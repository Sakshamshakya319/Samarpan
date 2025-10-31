import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { sendEmail, generatePasswordResetEmailHTML } from "@/lib/email"
import crypto from "crypto"

interface ForgotPasswordRequest {
  email: string
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Get application URL safely
function getAppUrl(request: NextRequest): string | null {
  // 1. First priority: NEXT_PUBLIC_APP_URL env variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      new URL(process.env.NEXT_PUBLIC_APP_URL)
      return process.env.NEXT_PUBLIC_APP_URL
    } catch {
      console.warn("[Password Reset] NEXT_PUBLIC_APP_URL is invalid:", process.env.NEXT_PUBLIC_APP_URL)
    }
  }

  // 2. Second priority: Try to construct from request headers (for proxied requests)
  const proto = request.headers.get("x-forwarded-proto")
  const host = request.headers.get("x-forwarded-host")
  if (proto && host) {
    try {
      const url = `${proto}://${host}`
      new URL(url)
      return url
    } catch {
      console.warn("[Password Reset] Failed to construct URL from headers")
    }
  }

  // 3. Third priority: Use request origin
  try {
    return request.nextUrl.origin
  } catch {
    console.error("[Password Reset] Failed to get request origin")
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    console.log(`[Password Reset] Forgot password request for email: ${email}`)

    // Get application URL
    const appUrl = getAppUrl(request)
    if (!appUrl) {
      console.error("[Password Reset] Could not determine application URL")
      return NextResponse.json(
        { message: "If an account with this email exists, a password reset link has been sent" },
        { status: 200 },
      )
    }

    // Connect to database
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if user exists
    const user = await usersCollection.findOne({ email: email.toLowerCase() })

    if (!user) {
      // Don't reveal if email exists (security best practice)
      console.log(`[Password Reset] Email not found: ${email}`)
      return NextResponse.json(
        { message: "If an account with this email exists, a password reset link has been sent" },
        { status: 200 },
      )
    }

    // Generate password reset token (expires in 1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex")
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store reset token in database
    console.log(`[Password Reset] Storing reset token for user: ${user._id}`)
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetToken: resetTokenHash,
          passwordResetExpiry: resetTokenExpiry,
          passwordResetRequestedAt: new Date(),
        },
      },
    )

    const resetLink = `${appUrl}/reset-password?token=${resetToken}`

    console.log(`[Password Reset] Generated reset link (appUrl: ${appUrl})`)

    // Send reset email
    const emailHTML = generatePasswordResetEmailHTML({
      userName: user.name || email,
      resetLink,
    })

    const emailSent = await sendEmail({
      to: email,
      subject: "Password Reset Request - Samarpan",
      html: emailHTML,
    })

    if (!emailSent) {
      console.error(`[Password Reset] Failed to send email to: ${email}`)
      // Don't reveal that email sending failed in production
      return NextResponse.json(
        { message: "If an account with this email exists, a password reset link has been sent" },
        { status: 200 },
      )
    }

    console.log(`[Password Reset] Password reset email sent to: ${email}`)
    return NextResponse.json(
      { message: "If an account with this email exists, a password reset link has been sent" },
      { status: 200 },
    )
  } catch (error) {
    console.error("[Password Reset] Error:", error)
    // Don't expose internal error details in production
    return NextResponse.json(
      { message: "If an account with this email exists, a password reset link has been sent" },
      { status: 200 },
    )
  }
}