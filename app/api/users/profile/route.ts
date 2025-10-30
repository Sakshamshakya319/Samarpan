import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const user = await usersCollection.findOne({
      _id: new ObjectId(decoded.userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        name: user.name,
        bloodGroup: user.bloodGroup,
        location: user.location,
        phone: user.phone,
        lastDonationDate: user.lastDonationDate,
        totalDonations: user.totalDonations || 0,
        hasDisease: user.hasDisease || false,
        diseaseDescription: user.diseaseDescription || "",
        avatar: user.avatar || "",
        role: user.role || "user",
      },
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { name, bloodGroup, location, phone, lastDonationDate, hasDisease, diseaseDescription } = await request.json()

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(decoded.userId) },
      {
        $set: {
          name,
          bloodGroup,
          location,
          phone,
          lastDonationDate,
          hasDisease: hasDisease || false,
          diseaseDescription: diseaseDescription || "",
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!result.value) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updatedUser = result.value
    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        bloodGroup: updatedUser.bloodGroup,
        location: updatedUser.location,
        phone: updatedUser.phone,
        lastDonationDate: updatedUser.lastDonationDate,
        totalDonations: updatedUser.totalDonations || 0,
        hasDisease: updatedUser.hasDisease || false,
        diseaseDescription: updatedUser.diseaseDescription || "",
        avatar: updatedUser.avatar || "",
        role: updatedUser.role || "user",
      },
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
