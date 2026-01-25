import Mailjet from "node-mailjet"

// Create Mailjet client
let mailjetClient: Mailjet.Client | null = null

// Validate Mailjet configuration
function validateMailjetConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  const apiKey = process.env.MAILJET_API_KEY || process.env.SMTP_USER
  const apiSecret = process.env.MAILJET_SECRET_KEY || process.env.SMTP_PASS
  const senderEmail = process.env.MAILJET_SENDER_EMAIL || process.env.SMTP_FROM

  if (!apiKey) errors.push("Mailjet API Key (MAILJET_API_KEY or SMTP_USER) not configured")
  if (!apiSecret) errors.push("Mailjet Secret Key (MAILJET_SECRET_KEY or SMTP_PASS) not configured")
  if (!senderEmail) errors.push("Sender Email (MAILJET_SENDER_EMAIL or SMTP_FROM) not configured")

  return {
    valid: errors.length === 0,
    errors,
  }
}

function getMailjetClient(): Mailjet.Client | null {
  if (mailjetClient) {
    return mailjetClient
  }

  try {
    const config = validateMailjetConfig()
    if (!config.valid) {
      console.error("[Email] ❌ Mailjet Configuration errors:")
      config.errors.forEach((err) => console.error(`[Email]    - ${err}`))
      return null
    }

    const apiKey = process.env.MAILJET_API_KEY || process.env.SMTP_USER
    const apiSecret = process.env.MAILJET_SECRET_KEY || process.env.SMTP_PASS

    // Initialize Mailjet client
    mailjetClient = Mailjet.apiConnect(apiKey!, apiSecret!)

    return mailjetClient
  } catch (error) {
    console.error("[Email] ❌ Failed to initialize Mailjet client:", error)
    mailjetClient = null
    return null
  }
}

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  attachments?: {
    filename: string
    content: Buffer | string
    contentType: string
  }[]
}

export async function sendEmail(options: EmailOptions, retryCount = 0): Promise<boolean> {
  const MAX_RETRIES = 2
  const RETRY_DELAY = 1000 // 1 second

  try {
    // In development without valid credentials, log to console
    const isDevelopment = process.env.NODE_ENV !== "production"
    const config = validateMailjetConfig()

    if (!config.valid) {
      if (isDevelopment) {
        console.warn("[Email] ⚠️  Mailjet not fully configured. Email logged to console (development mode)")
        console.log(`[Email] TO: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`)
        console.log(`[Email] SUBJECT: ${options.subject}`)
        console.log(`[Email] HTML: ${options.html.substring(0, 200)}...`)
        if (options.attachments?.length) {
          console.log(`[Email] ATTACHMENTS: ${options.attachments.map(a => a.filename).join(", ")}`)
        }
        console.warn("[Email] Configuration issues:")
        config.errors.forEach((err) => console.warn(`[Email]    - ${err}`))
        return true // Return true in dev mode to prevent user-facing errors
      }
      console.error("[Email] ❌ Mailjet configuration incomplete in production")
      return false
    }

    const client = getMailjetClient()
    if (!client) {
      console.error("[Email] ❌ Failed to get Mailjet client")
      return false
    }

    // Parse Sender Email - handle both "Name <email>" and plain email formats
    const sender = process.env.MAILJET_SENDER_EMAIL || process.env.SMTP_FROM || "Samarpan <noreply@samarpan.com>"
    
    // Extract name and email from "Name <email>" format
    const fromMatch = sender.match(/(.*)<(.*)>/)
    const fromName = fromMatch ? fromMatch[1].trim() : "Samarpan"
    const fromEmail = fromMatch ? fromMatch[2].trim() : sender

    // Prepare recipients
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to]
    const recipients = toAddresses.map(email => ({
      Email: email,
      Name: email.split("@")[0] // Simple name extraction
    }))

    // Prepare attachments
    const attachments = options.attachments?.map(att => ({
      ContentType: att.contentType,
      Filename: att.filename,
      Base64Content: Buffer.isBuffer(att.content) 
        ? att.content.toString('base64') 
        : att.content
    }))

    // Prepare message
    const messageData: any = {
      From: {
        Email: fromEmail,
        Name: fromName
      },
      To: recipients,
      Subject: options.subject,
      TextPart: options.text || options.html.replace(/<[^>]*>/g, ""),
      HTMLPart: options.html,
      CustomID: "SamarpanApp",
      Headers: {
        "Reply-To": options.replyTo || fromEmail
      }
    }

    if (attachments && attachments.length > 0) {
      messageData.Attachments = attachments
    }

    const request = client.post("send", { 'version': 'v3.1' }).request({
      Messages: [messageData]
    })

    console.log(`[Email] 📧 Sending email to ${toAddresses.join(", ")} (Subject: "${options.subject}")`)

    // Send email
    const result = await request
    
    // Log success
    const responseData = result.body as any
    const messageStatus = responseData.Messages[0].Status
    
    if (messageStatus === "success") {
        console.log(`[Email] ✅ Email sent successfully`)
        console.log(`[Email]    - To: ${toAddresses.join(", ")}`)
        return true
    } else {
        console.error(`[Email] ❌ Mailjet reported issue:`, responseData.Messages[0])
        return false
    }

  } catch (error) {
    console.error(`[Email] ❌ Error sending email (Attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error)

    // Retry logic for transient errors
    if (retryCount < MAX_RETRIES) {
      // Basic retry for network errors
      console.log(`[Email] 🔄 Retrying in ${RETRY_DELAY}ms...`)
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
      return sendEmail(options, retryCount + 1)
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
            <a href="${escapedResetLink}" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; border: 1px solid #dc2626;">
              Reset Password
            </a>
          </div>

          <!-- Security Notice -->
          <div style="background: #eff6ff; padding: 12px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <p style="color: #1e40af; font-size: 12px; margin: 0; font-weight: 600;">🔒 Security: Never share this link with anyone.</p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 5px 0; font-weight: 600;">Samarpan Blood Donation Network</p>
            <p style="margin: 5px 0;">This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate NGO registration confirmation email
export function generateNGORegistrationEmailHTML({
  ngoName,
  contactPersonName,
}: {
  ngoName: string
  contactPersonName: string
}): string {
  const escapedNgoName = escapeHtml(ngoName)
  const escapedContactName = escapeHtml(contactPersonName)

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NGO Registration Received - Samarpan</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px; font-weight: 700;">🏢 NGO Registration Received</h1>
          </div>

          <!-- Greeting -->
          <p style="color: #6b7280; margin-bottom: 20px; font-size: 16px;">Dear ${escapedContactName},</p>

          <!-- Main Content -->
          <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #374151; margin: 0 0 15px 0; font-size: 14px;">
              Thank you for registering <strong>${escapedNgoName}</strong> with Samarpan! We have received your application and all required documents.
            </p>
          </div>

          <!-- Process Steps -->
          <div style="background: #fef3c7; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">📋 What happens next?</h3>
            <ol style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Our admin team will review your application and documents</li>
              <li style="margin-bottom: 8px;">We will verify all submitted information</li>
              <li style="margin-bottom: 8px;">You will receive an email notification about the approval status</li>
              <li style="margin-bottom: 0;">Once approved, you can login and start managing blood donation activities</li>
            </ol>
          </div>

          <!-- Timeline -->
          <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <p style="color: #1e40af; font-size: 14px; margin: 0; font-weight: 600;">
              ⏱️ Review Timeline: Applications are typically reviewed within 3-5 business days.
            </p>
          </div>

          <!-- Support -->
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">
              If you have any questions, please contact our support team.
            </p>
            <p style="color: #374151; font-size: 14px; font-weight: 600;">
              Thank you for joining our mission to save lives through blood donation!
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 5px 0; font-weight: 600;">Samarpan Blood Donation Network</p>
            <p style="margin: 5px 0;">Contact: support@samarpan.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate NGO approval email
export function generateNGOApprovalEmailHTML({
  ngoName,
  contactPersonName,
  loginEmail,
}: {
  ngoName: string
  contactPersonName: string
  loginEmail: string
}): string {
  const escapedNgoName = escapeHtml(ngoName)
  const escapedContactName = escapeHtml(contactPersonName)
  const escapedLoginEmail = escapeHtml(loginEmail)

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NGO Application Approved - Samarpan</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0; font-size: 28px; font-weight: 700;">🎉 Congratulations!</h1>
            <p style="color: #16a34a; font-size: 16px; margin: 10px 0 0 0; font-weight: 600;">Your NGO has been approved</p>
          </div>

          <!-- Greeting -->
          <p style="color: #6b7280; margin-bottom: 20px; font-size: 16px;">Dear ${escapedContactName},</p>

          <!-- Approval Notice -->
          <div style="background: #dcfce7; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #16a34a;">
            <h3 style="color: #15803d; margin-top: 0; font-size: 18px;">✅ ${escapedNgoName} has been successfully verified!</h3>
            <p style="color: #15803d; margin: 0; font-size: 14px;">
              Your NGO application has been reviewed and approved by our team. Welcome to the Samarpan family!
            </p>
          </div>

          <!-- Login Information -->
          <div style="background: #dbeafe; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1e40af; margin-top: 0; font-size: 16px;">🔐 Login Information</h3>
            <p style="color: #1e40af; margin: 8px 0; font-size: 14px;">
              <strong>Login Email:</strong> ${escapedLoginEmail}
            </p>
            <p style="color: #1e40af; margin: 8px 0; font-size: 14px;">
              <strong>Password:</strong> Use the password you created during registration
            </p>
            <p style="color: #1e40af; margin: 8px 0; font-size: 14px;">
              <strong>Login URL:</strong> <a href="${process.env.NEXT_PUBLIC_APP_URL}/ngo/login" style="color: #1e40af; text-decoration: underline;">NGO Login Portal</a>
            </p>
          </div>

          <!-- Features -->
          <div style="margin-bottom: 20px;">
            <h3 style="color: #1f2937; font-size: 16px; margin-top: 0; margin-bottom: 12px;">🚀 What you can do now:</h3>
            <ul style="color: #374151; font-size: 14px; padding-left: 20px; margin: 0; line-height: 1.8;">
              <li>Login to your NGO dashboard</li>
              <li>Organize blood donation camps</li>
              <li>Manage donor registrations</li>
              <li>Track donation activities</li>
              <li>Connect with blood banks and hospitals</li>
            </ul>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/ngo/login" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; border: 1px solid #dc2626;">
              Login to Dashboard
            </a>
          </div>

          <!-- Thank You -->
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #374151; font-size: 14px; font-weight: 600;">
              Thank you for partnering with us in our mission to save lives through blood donation!
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 5px 0; font-weight: 600;">Samarpan Blood Donation Network</p>
            <p style="margin: 5px 0;">Contact: support@samarpan.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate NGO rejection email
export function generateNGORejectionEmailHTML({
  ngoName,
  contactPersonName,
  rejectionReason,
}: {
  ngoName: string
  contactPersonName: string
  rejectionReason: string
}): string {
  const escapedNgoName = escapeHtml(ngoName)
  const escapedContactName = escapeHtml(contactPersonName)
  const escapedReason = escapeHtml(rejectionReason)

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NGO Application Status Update - Samarpan</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header with Samarpan Branding -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px 30px 40px 30px; text-align: center; position: relative;">
            <div style="background: rgba(255, 255, 255, 0.1); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
              <div style="font-size: 36px; font-weight: bold;">🩸</div>
            </div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Samarpan</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Blood Donation Network</p>
            <div style="position: absolute; top: 20px; right: 20px; background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;">
              Application Update
            </div>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            
            <!-- Greeting -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Dear ${escapedContactName},</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px;">
                Thank you for your interest in partnering with Samarpan as a verified NGO.
              </p>
            </div>

            <!-- Application Status -->
            <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <div style="display: flex; align-items: flex-start; gap: 16px;">
                <div style="background: #ef4444; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                  ⚠️
                </div>
                <div style="flex: 1;">
                  <h3 style="color: #dc2626; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">Application Status Update</h3>
                  <p style="color: #dc2626; margin: 0 0 16px 0; font-size: 15px; line-height: 1.5;">
                    After careful review of your application for <strong>${escapedNgoName}</strong>, we regret to inform you that we are unable to approve your NGO registration at this time.
                  </p>
                  <div style="background: white; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px;">
                    <h4 style="color: #991b1b; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Reason for Rejection:</h4>
                    <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.4;">${escapedReason}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Next Steps -->
            <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <div style="display: flex; align-items: flex-start; gap: 16px;">
                <div style="background: #3b82f6; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                  💡
                </div>
                <div style="flex: 1;">
                  <h3 style="color: #1e40af; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">What You Can Do Next</h3>
                  
                  <div style="margin-bottom: 20px;">
                    <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 15px; font-weight: 600;">📞 Contact Our Support Team</h4>
                    <p style="color: #1e40af; margin: 0 0 12px 0; font-size: 14px; line-height: 1.5;">
                      If you believe this decision was made in error or need clarification on the requirements:
                    </p>
                    <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #93c5fd;">
                      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <span style="color: #1e40af; font-size: 16px;">📧</span>
                        <span style="color: #1e40af; font-weight: 600; font-size: 14px;">support@samarpan.com</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="color: #1e40af; font-size: 16px;">📞</span>
                        <span style="color: #1e40af; font-weight: 600; font-size: 14px;">+91-XXXX-XXXX-XX (Mon-Fri, 9 AM - 6 PM)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 15px; font-weight: 600;">🔄 Resubmit Your Application</h4>
                    <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.5;">
                      You may resubmit your application after addressing the mentioned concerns. Please ensure all documents meet our requirements before resubmission.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Requirements Reminder -->
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <h3 style="color: #374151; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📋 Quick Requirements Reminder</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px;">
                <div>
                  <h4 style="color: #6b7280; margin: 0 0 8px 0; font-weight: 600;">Required Documents:</h4>
                  <ul style="color: #6b7280; margin: 0; padding-left: 16px; line-height: 1.6;">
                    <li>NGO Registration Certificate</li>
                    <li>Blood Bank/Donation License</li>
                    <li>PAN Card of NGO</li>
                    <li>Address Proof</li>
                    <li>ID Proof of Authorized Person</li>
                  </ul>
                </div>
                <div>
                  <h4 style="color: #6b7280; margin: 0 0 8px 0; font-weight: 600;">Document Guidelines:</h4>
                  <ul style="color: #6b7280; margin: 0; padding-left: 16px; line-height: 1.6;">
                    <li>Clear, readable scans/photos</li>
                    <li>Valid and up-to-date documents</li>
                    <li>File size under 5MB</li>
                    <li>PDF, JPG, or PNG format</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Closing Message -->
            <div style="text-align: center; margin-bottom: 20px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                We appreciate your commitment to blood donation and community service. We hope to work with you in the future once all requirements are met.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Together, we can save more lives through organized blood donation.
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/ngo/register" style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Resubmit Application
              </a>
            </div>
          </div>

          <!-- Footer with Samarpan Branding -->
          <div style="background: #1f2937; color: #d1d5db; padding: 30px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <h3 style="color: white; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">Samarpan Team</h3>
              <p style="margin: 0; font-size: 14px; opacity: 0.8;">Connecting Donors, Saving Lives</p>
            </div>
            
            <div style="border-top: 1px solid #374151; padding-top: 20px; margin-top: 20px;">
              <p style="margin: 0 0 8px 0; font-size: 13px;">
                <strong>Samarpan Blood Donation Network</strong>
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px; opacity: 0.7;">
                📧 support@samarpan.com | 🌐 www.samarpan.com
              </p>
              <p style="margin: 0; font-size: 11px; opacity: 0.6;">
                © 2024 Samarpan. All rights reserved. | This is an automated email, please do not reply directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
