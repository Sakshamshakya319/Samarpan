import nodemailer from "nodemailer"

// Create SMTP transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PASS || !process.env.SMTP_USER) {
      console.warn("[Email] SMTP configuration missing, email not sent")
      return false
    }

    const transporter = getTransporter()

    // Parse SMTP_FROM for name and email
    const smtpFrom = process.env.SMTP_FROM || "Samarpan <noreply@samarpan.com>"

    const mailOptions = {
      from: smtpFrom,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    }

    console.log(`[Email] Sending email to ${mailOptions.to}`)
    await transporter.sendMail(mailOptions)
    console.log(`[Email] Email sent successfully to ${mailOptions.to}`)
    return true
  } catch (error) {
    console.error("[Email] Error sending email:", error)
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