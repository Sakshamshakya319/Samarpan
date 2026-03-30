import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const ngosCollection = db.collection("ngos")

    // Find NGO by email (case-insensitive)
    const ngo = await ngosCollection.findOne({ 
      ngoEmail: { $regex: new RegExp(`^${email.trim()}$`, "i") } 
    })

    if (!ngo) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if NGO is approved
    if (ngo.status !== "approved" || !ngo.isVerified) {
      let message = "Your NGO application is still pending review."
      if (ngo.status === "rejected") {
        message = `Your NGO application was rejected. Reason: ${ngo.rejectionReason || "Please contact support for more information."}`
      }
      return NextResponse.json({ error: message }, { status: 403 })
    }

    // Check if NGO is paused
    if (ngo.isPaused) {
      return NextResponse.json({ 
        error: "Your NGO account has been temporarily suspended. Please contact support for assistance.",
        isPaused: true,
        pauseReason: ngo.pauseReason,
        pausedAt: ngo.pausedAt
      }, { status: 403 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, ngo.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        ngoId: ngo._id.toString(),
        email: ngo.ngoEmail,
        role: "ngo",
        ngoName: ngo.ngoName,
        isPaused: ngo.isPaused || false,
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    )

    // Update last login
    await ngosCollection.updateOne(
      { _id: ngo._id },
      { $set: { lastLogin: new Date() } }
    )

    // Return success response
    return NextResponse.json(
      {
        message: "Login successful",
        token,
        ngo: {
          id: ngo._id,
          name: ngo.ngoName,
          email: ngo.ngoEmail,
          role: "ngo",
          contactPerson: ngo.contactPerson,
          location: `${ngo.city}, ${ngo.state}`,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("NGO login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}