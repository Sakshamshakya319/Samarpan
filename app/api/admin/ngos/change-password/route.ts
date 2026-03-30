import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"
import { verifyAdminToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.headers.get("Authorization")?.split(" ")[1]
    if (!adminToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await verifyAdminToken(adminToken)
    if (!admin || admin.role !== "superadmin") {
      return NextResponse.json({ error: "Only superadmins can change NGO passwords" }, { status: 403 })
    }

    const { ngoId, newPassword } = await request.json()

    if (!ngoId || !newPassword) {
      return NextResponse.json({ error: "NGO ID and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    const db = await getDatabase()
    const ngosCollection = db.collection("ngos")

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    const result = await ngosCollection.updateOne(
      { _id: new ObjectId(ngoId) },
      { 
        $set: { 
          password: hashedPassword,
          passwordUpdatedAt: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Password changed successfully" }, { status: 200 })

  } catch (error) {
    console.error("Admin NGO change password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
