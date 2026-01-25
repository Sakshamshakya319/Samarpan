import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Decode token to get NGO ID
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!decoded.ngoId || decoded.role !== "ngo") {
      return NextResponse.json({ error: "Invalid NGO token" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const ngosCollection = db.collection("ngos")

    // Find the NGO and get current status
    const ngo = await ngosCollection.findOne(
      { _id: new ObjectId(decoded.ngoId) },
      { 
        projection: { 
          ngoName: 1,
          status: 1,
          isPaused: 1,
          pauseReason: 1,
          pausedAt: 1,
          pausedBy: 1
        } 
      }
    )

    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 })
    }

    // Check if NGO is still approved
    if (ngo.status !== "approved") {
      return NextResponse.json({ 
        error: "NGO account is not approved",
        status: ngo.status
      }, { status: 403 })
    }

    return NextResponse.json({
      ngoId: ngo._id,
      ngoName: ngo.ngoName,
      status: ngo.status,
      isPaused: ngo.isPaused || false,
      pauseReason: ngo.pauseReason,
      pausedAt: ngo.pausedAt,
      pausedBy: ngo.pausedBy
    })

  } catch (error) {
    console.error("NGO status check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}