import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAdminPermission } from "@/lib/admin/admin-utils-server"
import { ObjectId } from "mongodb"
import { rankDonors, generateDonorMessage } from "@/lib/domain/donor-scoring"
import { sendWhatsAppBulk } from "@/lib/services/whatsapp"
import { sendEmail } from "@/lib/services/email"

/**
 * POST /api/notifications/send-sos
 * Admin-only: Send smart personalized notifications to ranked donors for a request.
 */
export async function POST(request: NextRequest) {
  try {
    const adminVerification = await verifyAdminPermission(request)
    if (!adminVerification.valid) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { requestId, radiusKm } = body

    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const bloodRequestsCollection = db.collection("bloodRequests")
    const usersCollection = db.collection("users")
    const notificationsCollection = db.collection("notifications")

    // Get the blood request
    let bloodRequest: any
    try {
      bloodRequest = await bloodRequestsCollection.findOne({
        _id: new ObjectId(requestId),
      })
    } catch {
      return NextResponse.json({ error: "Invalid requestId" }, { status: 400 })
    }

    if (!bloodRequest) {
      return NextResponse.json({ error: "Blood request not found" }, { status: 404 })
    }

    // Get current month's notification counts for fatigue prevention
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const monthlyNotificationCounts = await notificationsCollection
      .aggregate([
        {
          $match: {
            createdAt: { $gte: monthStart },
            type: { $in: ["blood_request", "sos_blood_request"] },
          },
        },
        {
          $group: {
            _id: "$userId",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    const notificationCountMap = new Map(
      monthlyNotificationCounts.map((n: any) => [n._id.toString(), n.count])
    )

    // Get donors with matching blood group
    const potentialDonors = await usersCollection
      .find({
        bloodGroup: bloodRequest.bloodGroup,
        hasDisease: { $ne: true },
      })
      .toArray()

    const donorProfiles = potentialDonors.map((d) => ({
      _id: d._id.toString(),
      name: d.name || "Donor",
      email: d.email,
      phone: d.phone || "",
      bloodGroup: d.bloodGroup,
      lat: d.lat,
      lng: d.lng,
      city: d.city,
      lastDonationDate: d.lastDonationDate,
      hasDisease: d.hasDisease,
      notificationsThisMonth:
        notificationCountMap.get(d._id.toString()) ?? 0,
    }))

    const requestForScoring = {
      _id: requestId,
      bloodGroup: bloodRequest.bloodGroup,
      lat: bloodRequest.lat,
      lng: bloodRequest.lng,
      hospitalLocation: bloodRequest.hospitalLocation,
      urgency: bloodRequest.urgency,
      createdAt: new Date(bloodRequest.createdAt),
    }

    // Rank donors using the scoring formula
    const rankedDonors = rankDonors(donorProfiles, requestForScoring, 50)

    // Filter by radius if specified
    const filteredDonors = radiusKm
      ? rankedDonors.filter(
          (d) => d.distanceKm === Infinity || d.distanceKm <= radiusKm
        )
      : rankedDonors

    if (filteredDonors.length === 0) {
      return NextResponse.json({
        message: "No eligible donors found for this request",
        sent: 0,
      })
    }

    // Send personalized notifications
    let emailsSent = 0
    let whatsappSent = 0
    const inAppNotifications = []

    for (const scored of filteredDonors) {
      const message = generateDonorMessage(scored, requestForScoring)
      const donor = scored.donor as any

      // In-app notification
      inAppNotifications.push({
        userId: new ObjectId(donor._id),
        title: `🩸 ${bloodRequest.bloodGroup} Blood Needed — ${scored.distanceKm !== Infinity ? scored.distanceKm.toFixed(1) + "km away" : "In your city"}`,
        message,
        type: "smart_match",
        relatedRequestId: new ObjectId(requestId),
        score: scored.score,
        read: false,
        createdAt: new Date(),
      })

      // Email
      if (donor.email) {
        sendEmail({
          to: [donor.email],
          subject: `🩸 You're a match — ${bloodRequest.bloodGroup} blood needed at ${bloodRequest.hospitalLocation}`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#dc2626;">🩸 Emergency Blood Request</h2>
            <p>${message}</p>
            <p><strong>Hospital:</strong> ${bloodRequest.hospitalLocation}</p>
            <p><strong>Urgency:</strong> ${bloodRequest.urgency.toUpperCase()}</p>
            <p><strong>Blood Group:</strong> ${bloodRequest.bloodGroup}</p>
            <a href="https://samarpan-mu.vercel.app/donate-blood" style="background:#dc2626;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px;">
              I Can Help →
            </a>
          </div>`,
        }).then(() => emailsSent++).catch(console.error)
      }

      // WhatsApp
      if (donor.phone) {
        whatsappSent++
      }
    }

    // Bulk WhatsApp
    const phones = filteredDonors
      .map((d: any) => d.donor.phone)
      .filter((p: any): p is string => typeof p === "string" && p.trim().length > 0)

    if (phones.length > 0) {
      const bulkMessage =
        `🩸 Smart Match — ${bloodRequest.bloodGroup} Blood Needed\n` +
        `Hospital: ${bloodRequest.hospitalLocation}\n` +
        `Urgency: ${bloodRequest.urgency.toUpperCase()}\n` +
        `Open Samarpan to respond: samarpan-mu.vercel.app`

      sendWhatsAppBulk(phones, bulkMessage).catch(console.error)
    }

    // Save in-app notifications
    if (inAppNotifications.length > 0) {
      await notificationsCollection.insertMany(inAppNotifications)
    }

    // Update notification counts for fatigue tracking
    const donorIds = filteredDonors.map((d) => new ObjectId(d.donor._id))
    if (donorIds.length > 0) {
      await usersCollection.updateMany(
        { _id: { $in: donorIds } },
        { $inc: { notificationsThisMonth: 1 } }
      )
    }

    return NextResponse.json({
      message: `Smart notifications sent to ${filteredDonors.length} ranked donors`,
      sent: filteredDonors.length,
      emailsSent,
      whatsappSent,
      topDonors: filteredDonors.slice(0, 5).map((d) => ({
        name: d.donor.name,
        score: Math.round(d.score),
        distance:
          d.distanceKm === Infinity ? "Unknown" : `${d.distanceKm.toFixed(1)}km`,
      })),
    })
  } catch (error) {
    console.error("[Send SOS Notifications] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
