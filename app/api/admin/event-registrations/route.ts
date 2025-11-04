import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

/**
 * Admin Event Registrations Management
 * View, update, and export event registrations
 */

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const url = new URL(request.url)
    const eventId = url.searchParams.get("eventId")
    const format = url.searchParams.get("format") // "json" or "excel"

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const registrationsCollection = db.collection("event_registrations")

    const registrations = await registrationsCollection
      .find({ eventId: new ObjectId(eventId) })
      .sort({ createdAt: -1 })
      .toArray()

    if (format === "excel") {
      // Convert to CSV format for Excel
      const csv = convertToCSV(registrations)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv;charset=utf-8",
          "Content-Disposition": `attachment; filename="event-registrations-${eventId}.csv"`,
        },
      })
    }

    return NextResponse.json({
      registrations,
      total: registrations.length,
    })
  } catch (error) {
    console.error("Admin get registrations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const db = await getDatabase()
    const { registrationId, status } = await request.json()

    if (!registrationId || !status) {
      return NextResponse.json({ error: "Registration ID and status are required" }, { status: 400 })
    }

    const registrationsCollection = db.collection("event_registrations")

    const result = await registrationsCollection.updateOne(
      { _id: new ObjectId(registrationId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Registration updated successfully" })
  } catch (error) {
    console.error("Admin update registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to convert registrations to CSV
function convertToCSV(registrations: any[]): string {
  if (registrations.length === 0) {
    return "No registrations found"
  }

  // CSV Headers
  const headers = ["Registration Number", "Name", "Email", "Time Slot", "Status", "Registered At"]

  // CSV Rows
  const rows = registrations.map((reg: any) => [
    reg.registrationNumber,
    reg.name,
    reg.email,
    reg.timeSlot,
    reg.status,
    new Date(reg.createdAt).toLocaleString(),
  ])

  // Combine headers and rows
  const csvContent = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(",")),
  ].join("\n")

  return csvContent
}