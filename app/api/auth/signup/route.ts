import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, generateToken } from "@/lib/auth"
import { sendEmail, generateWelcomeEmailHTML } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Signup request received")

    const body = await request.json()
    console.log("[v0] Request body:", { email: body.email, name: body.name })

    const { email, password, name, bloodGroup, location, phone } = body

    // Validation
    if (!email || !password || !name) {
      console.log("[v0] Validation failed: missing required fields")
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("[v0] Invalid email format")
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Password validation
    if (password.length < 6) {
      console.log("[v0] Password too short")
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    console.log("[v0] Connecting to database...")
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if user already exists
    console.log("[v0] Checking if user exists...")
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      console.log("[v0] User already exists:", email)
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 })
    }

    // Hash password
    console.log("[v0] Hashing password...")
    const hashedPassword = await hashPassword(password)

    // Create user
    console.log("[v0] Creating user...")
    const result = await usersCollection.insertOne({
      email,
      password: hashedPassword,
      name,
      bloodGroup: bloodGroup || "",
      location: location || "",
      phone: phone || "",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log("[v0] User created successfully:", result.insertedId)

    const token = generateToken(result.insertedId.toString(), email)

    // Send welcome email
    console.log("[v0] Sending welcome email to:", email)
    const welcomeEmailHTML = generateWelcomeEmailHTML({
      userName: name,
      email: email,
      authType: "password",
    })

    const emailSent = await sendEmail({
      to: email,
      subject: "Welcome to Samarpan - Your Blood Donation Journey Starts Here!",
      html: welcomeEmailHTML,
      replyTo: process.env.SMTP_FROM || "noreply@samarpan.com",
    })

    if (emailSent) {
      console.log("[v0] ✅ Welcome email sent successfully to:", email)
    } else {
      console.warn("[v0] ⚠️  Failed to send welcome email to:", email)
      // Don't fail the signup if email sending fails - user account is created
    }

    const response = NextResponse.json(
      {
        message: "User created successfully",
        token,
        user: {
          _id: result.insertedId,
          id: result.insertedId,
          email,
          name,
          bloodGroup: bloodGroup || "",
          location: location || "",
          phone: phone || "",
          lastDonationDate: "",
          totalDonations: 0,
          hasDisease: false,
          diseaseDescription: "",
          role: "user",
        },
      },
      { status: 201 },
    )
    
    // Set token in HTTP-only cookie for middleware to access
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Signup error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: `Signup failed: ${errorMessage}` }, { status: 500 })
  }
}
