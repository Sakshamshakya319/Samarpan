import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyPassword, generateAdminToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log('[Admin Login] Starting login process...')
    
    const { email, password } = await request.json()
    console.log('[Admin Login] Login attempt for:', email)

    if (!email || !password) {
      console.log('[Admin Login] Missing email or password')
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const adminsCollection = db.collection("admins")

    // Find admin
    console.log('[Admin Login] Looking for admin in database...')
    const admin = await adminsCollection.findOne({ email })
    if (!admin) {
      console.log('[Admin Login] Admin not found:', email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log('[Admin Login] Admin found:', {
      email: admin.email,
      role: admin.role,
      status: admin.status
    })

    // Verify password
    console.log('[Admin Login] Verifying password...')
    const isPasswordValid = await verifyPassword(password, admin.password)
    if (!isPasswordValid) {
      console.log('[Admin Login] Invalid password for:', email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log('[Admin Login] Password verified successfully')

    // Check if admin is active
    if (admin.status === "inactive") {
      console.log('[Admin Login] Admin account is inactive:', email)
      return NextResponse.json(
        { error: "Admin account is inactive" },
        { status: 403 },
      )
    }

    console.log('[Admin Login] Generating token...')
    const token = generateAdminToken(
      admin._id.toString(),
      admin.role || "admin",
      email,
    )

    const response = NextResponse.json(
      {
        message: "Admin login successful",
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role || "admin",
          permissions: admin.permissions || [],
        },
      },
      { status: 200 },
    )

    // Set secure cookie for admin token (for middleware verification)
    response.cookies.set({
      name: "adminToken",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    console.log('[Admin Login] Login successful for:', email)
    return response
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
