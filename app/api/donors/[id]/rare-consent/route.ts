import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { getTokenFromRequest } from "@/lib/auth/auth-utils"
import { verifyToken } from "@/lib/auth/auth"
import { ObjectId } from "mongodb"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.userId !== params.id) {
      return NextResponse.json({ error: "Invalid token or unauthorized for this user" }, { status: 403 })
    }

    const body = await request.json()
    const { groups, consent_text } = body

    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return NextResponse.json({ error: "Groups array is required" }, { status: 400 })
    }

    const validRareGroups = ['O-', 'AB-', 'A-', 'B-', 'Bombay']
    const hasInvalidGroup = groups.some(g => !validRareGroups.includes(g))
    if (hasInvalidGroup) {
      return NextResponse.json({ error: "Invalid rare group provided" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          is_rare_donor: true,
          rare_groups: groups,
          rare_consent_at: new Date(),
          rare_consent_version: consent_text || 'version-1.0',
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Rare blood group consent updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("[Rare Consent POST] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
