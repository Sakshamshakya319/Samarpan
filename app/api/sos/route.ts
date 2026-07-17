import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { sendEmail, generateBloodRequestEmailHTML } from "@/lib/services/email"
import { sendWhatsAppBulk } from "@/lib/services/whatsapp"
import { getCompatibleDonors } from "@/lib/domain/rare-blood-registry"

// Simple in-memory rate limiting (resets on server restart)
// Key: IP address, Value: { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 3 // max 3 SOS per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) return false

  entry.count++
  return true
}

/**
 * POST /api/sos
 * Public endpoint — no authentication required.
 * Creates an emergency blood request with verificationLevel: 3.
 * Rate-limited by IP.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown"

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many SOS requests. Please wait a moment before trying again." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      requesterName,
      requesterPhone,
      bloodGroup,
      bloodComponent = "whole-blood",
      quantity,
      hospital,
      urgency = "critical",
    } = body

    // Validate required fields
    if (!requesterName || !bloodGroup || !hospital || !hospital.name || !hospital.latitude || !hospital.longitude || !quantity) {
      return NextResponse.json(
        { error: "Name, blood group, hospital details, and quantity are required" },
        { status: 400 }
      )
    }

    if (!["whole-blood", "platelets", "plasma", "packed-rbcs"].includes(bloodComponent)) {
      return NextResponse.json({ error: "Invalid blood component" }, { status: 400 })
    }

    const db = await getDatabase()
    const bloodRequestsCollection = db.collection("bloodRequests")

    // Create SOS request
    const result = await bloodRequestsCollection.insertOne({
      isSOS: true,
      requesterName,
      requesterPhone: requesterPhone || "",
      bloodGroup,
      bloodComponent,
      quantity: parseInt(quantity, 10) || 1,
      urgency,
      hospital,
      verificationLevel: 3, // User-submitted, awaiting verification
      status: "active",
      verified: false,
      requestType: "sos",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const requestId = result.insertedId.toString()

    // Find compatible donors for notification
    const usersCollection = db.collection("users")
    const compatibleGroups = getCompatibleDonors(bloodGroup)
    const matchingUsers = await usersCollection
      .find({
        bloodGroup: { $in: compatibleGroups },
        hasDisease: { $ne: true },
      })
      .limit(200)
      .toArray()

    // Send email notifications asynchronously
    if (matchingUsers.length > 0) {
      const emailAddresses = matchingUsers.map((u: any) => u.email).filter(Boolean)

      const emailHTML = generateBloodRequestEmailHTML({
        bloodGroup,
        quantity,
        urgency,
        reason: `🚨 EMERGENCY SOS — Requested by ${requesterName}`,
        hospitalLocation: hospital.name,
        userName: requesterName,
        userPhone: requesterPhone || "Not provided",
        userEmail: "SOS (no login required)",
      })

      sendEmail({
        to: emailAddresses,
        subject: `🚨 EMERGENCY SOS — ${bloodGroup} Blood Needed NOW at ${hospital.name}`,
        html: emailHTML,
      }).catch((err) => console.error("[SOS] Email error:", err))

      // WhatsApp notifications
      const phones = matchingUsers
        .map((u: any) => u.phone)
        .filter((p: any): p is string => typeof p === "string" && p.trim().length > 0)

      if (phones.length > 0) {
        const text =
          `🚨 EMERGENCY SOS — ${bloodGroup} Blood Needed\n\n` +
          `Hospital: ${hospital.name}\n` +
          `Units needed: ${quantity}\n` +
          `Component: ${bloodComponent}\n` +
          `Contact: ${requesterPhone || "See Samarpan app"}\n\n` +
          `Please respond immediately at samarpan-mu.vercel.app`

        sendWhatsAppBulk(phones, text).catch((err) =>
          console.error("[SOS] WhatsApp error:", err)
        )
      }

      // Create in-app notifications
      const notificationsCollection = db.collection("notifications")
      const notifications = matchingUsers.map((u: any) => ({
        userId: u._id,
        title: `🚨 SOS — ${bloodGroup} Blood Needed`,
        message: `Emergency blood request at ${hospital.name}. ${quantity} unit(s) needed urgently. Contact: ${requesterPhone || "See request"}`,
        type: "sos_blood_request",
        relatedRequestId: result.insertedId,
        read: false,
        createdAt: new Date(),
      }))

      if (notifications.length > 0) {
        await notificationsCollection.insertMany(notifications)
      }
    }

    return NextResponse.json(
      {
        message: "SOS request created. Donors are being notified.",
        requestId,
        verificationLevel: 3,
        notificationsCount: matchingUsers.length,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[SOS] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
