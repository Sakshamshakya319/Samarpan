import nodemailer from "nodemailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport"

// Create SMTP transporter
let transporter: nodemailer.Transporter | null = null
let transporterReady = false

// Validate SMTP configuration
function validateSMTPConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!process.env.SMTP_HOST) errors.push("SMTP_HOST not configured")
  if (!process.env.SMTP_PORT) errors.push("SMTP_PORT not configured")
  if (!process.env.SMTP_USER) errors.push("SMTP_USER not configured")
  if (!process.env.SMTP_PASS) errors.push("SMTP_PASS not configured")
  if (!process.env.SMTP_FROM) errors.push("SMTP_FROM not configured")

  return {
    valid: errors.length === 0,
    errors,
  }
}

async function getTransporter(): Promise<nodemailer.Transporter | null> {
  if (transporter && transporterReady) {
    return transporter
  }

  try {
    const config = validateSMTPConfig()
    if (!config.valid) {
      console.error("[Email] ❌ SMTP Configuration errors:")
      config.errors.forEach((err) => console.error(`[Email]    - ${err}`))
      return null
    }

    const port = parseInt(process.env.SMTP_PORT || "587")

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Add connection timeout
      connectionTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
      // Add TLS configuration for better compatibility
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Verify connection (only once, don't repeat on every email)
    if (!transporterReady) {
      console.log("[Email] 🔍 Verifying SMTP connection...")
      await transporter.verify()
      transporterReady = true
      console.log("[Email] ✅ SMTP connection verified successfully")
    }

    return transporter
  } catch (error) {
    console.error("[Email] ❌ Failed to initialize transporter:", error)
    transporter = null
    transporterReady = false

    if (error instanceof Error) {
      // Provide specific error guidance
      if (error.message.includes("535") || error.message.includes("Authentication failed")) {
        console.error("[Email] 🔑 SendGrid authentication failed. Check your API key in SMTP_PASS")
        console.error("[Email] 📝 Update SMTP_PASS in .env.local with a valid SendGrid API key")
        console.error("[Email] 🔗 Get a new key at: https://app.sendgrid.com/settings/api_keys")
      } else if (error.message.includes("ECONNREFUSED")) {
        console.error("[Email] 🌐 Cannot connect to SMTP server. Check SMTP_HOST and SMTP_PORT")
      } else if (error.message.includes("ETIMEDOUT")) {
        console.error("[Email] ⏱️  Connection timeout. SMTP server may be unreachable")
      }
    }

    return null
  }
}

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendEmail(options: EmailOptions, retryCount = 0): Promise<boolean> {
  const MAX_RETRIES = 2
  const RETRY_DELAY = 1000 // 1 second

  try {
    // In development without valid SMTP, log to console
    const isDevelopment = process.env.NODE_ENV !== "production"
    const config = validateSMTPConfig()

    if (!config.valid) {
      if (isDevelopment) {
        console.warn("[Email] ⚠️  SMTP not fully configured. Email logged to console (development mode)")
        console.log(`[Email] TO: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`)
        console.log(`[Email] SUBJECT: ${options.subject}`)
        console.log(`[Email] HTML: ${options.html.substring(0, 200)}...`)
        console.warn("[Email] Configuration issues:")
        config.errors.forEach((err) => console.warn(`[Email]    - ${err}`))
        return true // Return true in dev mode to prevent user-facing errors
      }
      console.error("[Email] ❌ SMTP configuration incomplete in production")
      return false
    }

    const transporter = await getTransporter()
    if (!transporter) {
      console.error("[Email] ❌ Failed to get email transporter")
      return false
    }

    // Parse SMTP_FROM - handle both "Name <email>" and plain email formats
    const smtpFrom = process.env.SMTP_FROM || "Samarpan <noreply@samarpan.com>"
    const recipientEmails = Array.isArray(options.to) ? options.to.join(", ") : options.to

    // Validate recipient emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emails = Array.isArray(options.to) ? options.to : [options.to]
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        console.error(`[Email] ❌ Invalid recipient email: ${email}`)
        return false
      }
    }

    const mailOptions: SMTPTransport.MailOptions = {
      from: smtpFrom,
      to: recipientEmails,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
      // Add headers for better deliverability
      headers: {
        "X-Mailer": "Samarpan/1.0",
        "X-Priority": "3",
        "Importance": "normal",
        "List-Unsubscribe": "<mailto:noreply@samarpan.com>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      // Add replyTo if specified
      ...(options.replyTo && { replyTo: options.replyTo }),
    }

    console.log(`[Email] 📧 Sending email to ${recipientEmails} (Subject: "${options.subject}")`)

    // Send email with error handling
    const result = await transporter.sendMail(mailOptions)

    console.log(`[Email] ✅ Email sent successfully`)
    console.log(`[Email]    - MessageID: ${result.messageId}`)
    console.log(`[Email]    - To: ${recipientEmails}`)

    return true
  } catch (error) {
    console.error(`[Email] ❌ Error sending email (Attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error)

    // Retry logic for transient errors
    if (retryCount < MAX_RETRIES) {
      const isTransientError =
        error instanceof Error &&
        (error.message.includes("ETIMEDOUT") ||
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("EHOSTUNREACH") ||
          error.message.includes("ENOTFOUND"))

      if (isTransientError) {
        console.log(`[Email] 🔄 Retrying in ${RETRY_DELAY}ms...`)
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
        return sendEmail(options, retryCount + 1)
      }
    }

    // Log specific error types for debugging
    if (error instanceof Error) {
      if (error.message.includes("535") || error.message.includes("Authentication failed")) {
        console.error("[Email] 🔑 Authentication error: Invalid SendGrid API key")
      } else if (error.message.includes("Invalid email")) {
        console.error("[Email] ✉️  Invalid email format detected")
      } else if (error.message.includes("ECONNREFUSED")) {
        console.error("[Email] 🌐 Connection refused: SMTP server unreachable")
      } else if (error.message.includes("ETIMEDOUT")) {
        console.error("[Email] ⏱️  Connection timeout")
      }
    }

    return false
  }
}

export function generateBloodRequestEmailHTML(
  requestData: {
    bloodGroup: string
    quantity: string
    urgency: string
    reason: string
    hospitalLocation: string
    userName: string
    userPhone: string
    userEmail: string
  },
): string {
  const urgencyColors: Record<string, string> = {
    critical: "#dc2626",
    high: "#ea580c",
    normal: "#2563eb",
    low: "#16a34a",
  }

  const urgencyColor = urgencyColors[requestData.urgency.toLowerCase()] || "#2563eb"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Blood Donation Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0;">🩸 Blood Donation Needed</h1>
          </div>

          <!-- Main Content -->
          <div style="margin-bottom: 20px;">
            <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Request Details</h2>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0; font-weight: 600; color: #374151;">Blood Group:</td>
                  <td style="padding: 10px 0; color: #1f2937;">${requestData.bloodGroup}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0; font-weight: 600; color: #374151;">Quantity Needed:</td>
                  <td style="padding: 10px 0; color: #1f2937;">${requestData.quantity}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0; font-weight: 600; color: #374151;">Hospital Location:</td>
                  <td style="padding: 10px 0; color: #1f2937;">${requestData.hospitalLocation}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0; font-weight: 600; color: #374151;">Urgency Level:</td>
                  <td style="padding: 10px 0;">
                    <span style="background: ${urgencyColor}; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 600;">
                      ${requestData.urgency.toUpperCase()}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: 600; color: #374151; vertical-align: top;">Reason:</td>
                  <td style="padding: 10px 0; color: #1f2937;">${requestData.reason || "Not specified"}</td>
                </tr>
              </table>
            </div>

            <!-- Requester Info -->
            <div style="background: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #1e40af; font-size: 16px;">Requester Information</h3>
              <p style="margin: 8px 0; color: #1f2937;">
                <strong>Name:</strong> ${requestData.userName}
              </p>
              <p style="margin: 8px 0; color: #1f2937;">
                <strong>Email:</strong> ${requestData.userEmail}
              </p>
              <p style="margin: 8px 0; color: #1f2937;">
                <strong>Phone:</strong> ${requestData.userPhone || "Not provided"}
              </p>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px;">
                If you have ${requestData.bloodGroup} blood type and are eligible to donate, please contact the requester or visit Samarpan to accept this request.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 5px 0;">Samarpan Blood Donation Network</p>
            <p style="margin: 5px 0;">This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export function generateNotificationEmailHTML(data: {
  title: string
  message: string
  userName?: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 24px;">📬 Samarpan Notification</h1>
          </div>

          <!-- Greeting -->
          ${
            data.userName
              ? `<p style="color: #6b7280; margin-bottom: 20px;">Hi ${data.userName},</p>`
              : ""
          }

          <!-- Main Content -->
          <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">${data.title}</h2>
            <p style="color: #374151; white-space: pre-wrap; word-wrap: break-word;">${data.message}</p>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/notifications" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              View in Samarpan
            </a>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 5px 0;">Samarpan Blood Donation Network</p>
            <p style="margin: 5px 0;">This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

export function generateWelcomeEmailHTML(data: {
  userName: string
  email: string
  authType?: "password" | "oauth" // "password" for traditional signup, "oauth" for OAuth
}): string {
  const escapedUserName = escapeHtml(data.userName)
  const isOAuth = data.authType === "oauth"

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Samarpan</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px; font-weight: 700;">🩸 Welcome to Samarpan!</h1>
          </div>

          <!-- Greeting -->
          <p style="color: #6b7280; margin-bottom: 20px; font-size: 16px;">Hello ${escapedUserName},</p>

          <!-- Main Content -->
          <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #374151; margin: 0 0 15px 0; font-size: 14px;">
              Thank you for joining Samarpan! Your account has been successfully created and you're now part of our blood donation network.
            </p>
            ${
              isOAuth
                ? `<p style="color: #374151; margin: 15px 0 0 0; font-size: 14px;">
                  Your account is secured with your ${data.authType === "oauth" ? "Google" : "social media"} login credentials.
                </p>`
                : `<p style="color: #374151; margin: 15px 0 0 0; font-size: 14px;">
                  You can update your account details, set your blood group, and start participating in our donation community.
                </p>`
            }
          </div>

          <!-- Features Section -->
          <div style="margin-bottom: 20px;">
            <h3 style="color: #1f2937; font-size: 16px; margin-top: 0; margin-bottom: 12px;">What you can do now:</h3>
            <ul style="color: #374151; font-size: 14px; padding-left: 20px; margin: 0; line-height: 1.8;">
              <li>Complete your profile with blood group and location</li>
              <li>Browse and respond to blood donation requests</li>
              <li>Request blood when needed</li>
              <li>Track your donation history</li>
              <li>Earn certificates for your donations</li>
              <li>Get notifications for matching requests</li>
            </ul>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; border: 1px solid #dc2626;">
              Go to Dashboard
            </a>
          </div>

          <!-- Security Notice -->
          <div style="background: #eff6ff; padding: 12px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <p style="color: #1e40af; font-size: 12px; margin: 0; font-weight: 600;">💡 Tip: Keep your account information up to date to receive relevant donation requests.</p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 5px 0; font-weight: 600;">Samarpan Blood Donation Network</p>
            <p style="margin: 5px 0;">Together, we save lives through blood donation.</p>
            <p style="margin: 8px 0 0 0; font-size: 11px;">
              © 2024 Samarpan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export function generatePasswordResetEmailHTML(data: {
  userName: string
  resetLink: string
}): string {
  const escapedUserName = escapeHtml(data.userName)
  const escapedResetLink = escapeHtml(data.resetLink)

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request - Samarpan</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 24px; font-weight: 700;">🔐 Password Reset Request</h1>
          </div>

          <!-- Greeting -->
          <p style="color: #6b7280; margin-bottom: 20px; font-size: 16px;">Hello ${escapedUserName},</p>

          <!-- Main Content -->
          <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #374151; margin: 0 0 15px 0; font-size: 14px;">
              We received a request to reset your Samarpan account password. Click the button below to reset it. This link will expire in <strong>1 hour</strong>.
            </p>
            <p style="color: #6b7280; font-size: 13px; margin: 15px 0 0 0; font-style: italic;">
              If you did not request this, please ignore this email or contact support immediately.
            </p>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetLink}" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; border: 1px solid #dc2626;">
              Reset Password
            </a>
          </div>

          <!-- Alternative Link Section -->
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0; font-weight: 600;">If the button doesn't work, copy and paste this link:</p>
            <p style="color: #374151; font-size: 12px; word-break: break-all; margin: 0; font-family: monospace; background: white; padding: 10px; border-radius: 4px; overflow-wrap: break-word;">${escapedResetLink}</p>
          </div>

          <!-- Security Notice -->
          <div style="background: #fef3c7; padding: 12px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <p style="color: #78350f; font-size: 12px; margin: 0; font-weight: 600;">🔒 Security Tip: Never share this link with anyone. Samarpan staff will never ask for your reset link.</p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 5px 0; font-weight: 600;">Samarpan Blood Donation Network</p>
            <p style="margin: 5px 0;">This is an automated email. Please do not reply directly.</p>
            <p style="margin: 8px 0 0 0; font-size: 11px;">
              © 2024 Samarpan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}