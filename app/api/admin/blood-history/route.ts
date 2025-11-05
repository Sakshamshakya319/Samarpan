import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyAdminPermission } from "@/lib/admin-utils-server"

export async function GET(request: NextRequest) {
  try {
    // Verify admin permission
    const verification = await verifyAdminPermission(request)
    
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: verification.status || 401 })
    }

    const db = await getDatabase()

    // Fetch all completed blood donations from various sources
    const completedRequests = await db.collection("bloodRequests")
      .find({ status: "fulfilled" })
      .sort({ updatedAt: -1 })
      .toArray()

    const completedDonations = await db.collection("donations")
      .find({ status: "completed" })
      .sort({ createdAt: -1 })
      .toArray()

    const completedEvents = await db.collection("events")
      .find({ status: "completed" })
      .sort({ eventDate: -1 })
      .toArray()

    // Combine and format all donation history
    const donationHistory = []

    // Process blood request fulfillments
    completedRequests.forEach((request: any) => {
      if (request.acceptedBy && request.acceptedBy.length > 0) {
        request.acceptedBy.forEach((acceptance: any) => {
          if (acceptance.status === "completed") {
            donationHistory.push({
              _id: acceptance._id || `${request._id}-${acceptance.userId}`,
              userId: acceptance.userId,
              userName: acceptance.userName || "Unknown Donor",
              userEmail: acceptance.userEmail || "",
              userPhone: acceptance.userPhone || "",
              bloodGroup: acceptance.bloodGroup || request.bloodGroup,
              quantity: acceptance.quantity || 1,
              donationDate: acceptance.completedAt || request.updatedAt,
              donationType: "request",
              requestId: request._id.toString(),
              pointsAwarded: acceptance.pointsAwarded || 0,
              certificateIssued: acceptance.certificateIssued || false,
              status: "completed",
              notes: `Donated to ${request.requesterName || "Unknown"} - ${request.urgency} urgency`,
            })
          }
        })
      }
    })

    // Process direct donations
    completedDonations.forEach((donation: any) => {
      donationHistory.push({
        _id: donation._id.toString(),
        userId: donation.donorId,
        userName: donation.donorName || "Unknown Donor",
        userEmail: donation.donorEmail || "",
        userPhone: donation.donorPhone || "",
        bloodGroup: donation.donorBloodGroup || donation.bloodGroup,
        quantity: donation.quantity || 1,
        donationDate: donation.createdAt,
        donationType: "direct",
        pointsAwarded: donation.pointsAwarded || 0,
        certificateIssued: donation.certificateIssued || false,
        status: donation.status,
        notes: donation.notes || "",
      })
    })

    // Process event donations
    completedEvents.forEach((event: any) => {
      if (event.donors && event.donors.length > 0) {
        event.donors.forEach((donor: any) => {
          if (donor.status === "completed") {
            donationHistory.push({
              _id: donor._id || `${event._id}-${donor.donorId}`,
              userId: donor.donorId,
              userName: donor.donorName || donor.name || "Unknown Donor",
              userEmail: donor.donorEmail || donor.email || "",
              userPhone: donor.donorPhone || donor.phone || "",
              bloodGroup: donor.donorBloodGroup || donor.bloodGroup,
              quantity: donor.quantity || 1,
              donationDate: donor.donationDate || event.eventDate,
              donationType: "event",
              eventId: event._id.toString(),
              pointsAwarded: donor.pointsAwarded || 0,
              certificateIssued: donor.certificateIssued || false,
              status: "completed",
              notes: `Event: ${event.title}`,
            })
          }
        })
      }
    })

    // Sort by donation date (newest first)
    donationHistory.sort((a, b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime())

    return NextResponse.json({
      success: true,
      donations: donationHistory,
      totalCount: donationHistory.length,
      summary: {
        totalDonations: donationHistory.length,
        totalPointsAwarded: donationHistory.reduce((sum, d) => sum + d.pointsAwarded, 0),
        uniqueDonors: new Set(donationHistory.map(d => d.userId)).size,
        thisMonthDonations: donationHistory.filter(d => {
          const donationDate = new Date(d.donationDate)
          const now = new Date()
          return donationDate.getMonth() === now.getMonth() && 
                 donationDate.getFullYear() === now.getFullYear()
        }).length,
      }
    })

  } catch (error) {
    console.error("Error fetching blood donation history:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}