import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyPassword, generateToken, generateAdminToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Login request received")

    const body = await request.json()
    console.log("[v0] Login attempt for email:", body.email)

    const { email, password } = body

    if (!email || !password) {
      console.log("[v0] Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log("[v0] Connecting to database...")
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Find user
    console.log("[v0] Finding user...")
    const user = await usersCollection.findOne({ email })
    if (!user) {
      console.log("[v0] User not found:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    console.log("[v0] Verifying password...")
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      console.log("[v0] Invalid password for user:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("[v0] Login successful for user:", email)

    // Check if user is an admin
    console.log("[v0] Checking if user is admin...")
    const adminsCollection = db.collection("admins")
    const admin = await adminsCollection.findOne({ email })

    let token: string
    let isAdmin = false
    let adminRole = ""

    if (admin) {
      console.log("[v0] Admin found! Generating admin token for:", email)
      token = generateAdminToken(admin._id.toString(), admin.role, admin.email)
      isAdmin = true
      adminRole = admin.role
    } else {
      console.log("[v0] Regular user. Generating user token for:", email)
      token = generateToken(user._id.toString(), user.email)
    }

    const response = NextResponse.json(
      {
        message: "Login successful",
        token,
        isAdmin,
        adminRole,
        user: {
          _id: user._id,
          id: user._id,
          email: user.email,
          name: user.name,
          bloodGroup: user.bloodGroup || "",
          location: user.location || "",
          phone: user.phone || "",
          lastDonationDate: user.lastDonationDate || "",
          totalDonations: user.totalDonations || 0,
          hasDisease: user.hasDisease || false,
          diseaseDescription: user.diseaseDescription || "",
          role: user.role,
        },
      },
      { status: 200 },
    )
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    }

    if (isAdmin) {
      // For admin users, set adminToken cookie for admin operations
      console.log("[v0] Setting adminToken cookie for admin user")
      response.cookies.set("adminToken", token, cookieOptions)
    } else {
      // For regular users, set token cookie
      console.log("[v0] Setting token cookie for regular user")
      response.cookies.set("token", token, cookieOptions)
    }

    return response
  } catch (error) {
    console.error("[v0] Login error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: `Login failed: ${errorMessage}` }, { status: 500 })
  }
}
