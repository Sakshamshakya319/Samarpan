import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { getTokenFromRequest } from "@/lib/auth/auth-utils"
import { verifyToken } from "@/lib/auth/auth"
import { ObjectId } from "mongodb"

/**
 * GET /api/care-circle — List all care circle profiles for the current user
 * POST /api/care-circle — Create a new care circle patient profile
 */

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const careCircleCollection = db.collection("careCircle")

    const profiles = await careCircleCollection
      .find({ createdBy: new ObjectId(decoded.userId) })
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error("[Care Circle GET] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const {
      patientName,
      patientPhone,
      bloodGroup,
      bloodComponent = "whole-blood",
      condition, // e.g., "cancer", "thalassemia", "sickle cell"
      hospital,
      frequencyDays = 21, // Default: every 3 weeks
      previousDonorIds = [],
      notes = "",
    } = body

    if (!patientName || !bloodGroup || !hospital) {
      return NextResponse.json(
        { error: "Patient name, blood group, and hospital are required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const careCircleCollection = db.collection("careCircle")

    const result = await careCircleCollection.insertOne({
      createdBy: new ObjectId(decoded.userId),
      patientName,
      patientPhone: patientPhone || "",
      bloodGroup,
      bloodComponent,
      condition: condition || "",
      hospital,
      frequencyDays,
      previousDonorIds: previousDonorIds.map((id: string) => {
        try {
          return new ObjectId(id)
        } catch {
          return id
        }
      }),
      notes,
      lastRequestDate: null,
      totalRequests: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json(
      {
        message: "Care Circle profile created",
        profileId: result.insertedId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[Care Circle POST] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
