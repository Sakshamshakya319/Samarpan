import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { sendEmail, generatePasswordResetEmailHTML } from "@/lib/email"
import crypto from "crypto"

interface ForgotPasswordRequest {
  email: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log(`[Password Reset] Forgot password request for email: ${email}`)

    // Connect to database
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if user exists
    const user = await usersCollection.findOne({ email })

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
        },
      },
    )

    // Get the app URL
    const origin = request.headers.get("x-forwarded-proto")
      ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
      : request.nextUrl.origin

    const resetLink = `${origin}/reset-password?token=${resetToken}`

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
      return NextResponse.json(
        { error: "Failed to send password reset email. Please try again." },
        { status: 500 },
      )
    }

    console.log(`[Password Reset] Password reset email sent to: ${email}`)
    return NextResponse.json(
      { message: "If an account with this email exists, a password reset link has been sent" },
      { status: 200 },
    )
  } catch (error) {
    console.error("[Password Reset] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}