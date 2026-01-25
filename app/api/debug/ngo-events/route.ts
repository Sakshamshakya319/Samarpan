import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const eventsCollection = db.collection("events")

    // Get all events with ngoId to debug
    const allEvents = await eventsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    const ngoEvents = await eventsCollection
      .find({ ngoId: { $exists: true } })
      .sort({ createdAt: -1 })
      .toArray()

    const pendingEvents = await eventsCollection
      .find({ 
        ngoId: { $exists: true },
        status: "pending_approval"
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      debug: true,
      totalEvents: allEvents.length,
      ngoEventsCount: ngoEvents.length,
      pendingEventsCount: pendingEvents.length,
      allEvents: allEvents.map(e => ({
        _id: e._id,
        title: e.title,
        status: e.status,
        ngoId: e.ngoId,
        ngoName: e.ngoName,
        createdAt: e.createdAt,
        hasNgoId: !!e.ngoId
      })),
      ngoEvents: ngoEvents.map(e => ({
        _id: e._id,
        title: e.title,
        status: e.status,
        ngoId: e.ngoId,
        ngoName: e.ngoName,
        createdAt: e.createdAt
      })),
      pendingEvents: pendingEvents.map(e => ({
        _id: e._id,
        title: e.title,
        status: e.status,
        ngoId: e.ngoId,
        ngoName: e.ngoName,
        createdAt: e.createdAt
      }))
    })

  } catch (error) {
    console.error("Debug NGO events error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}