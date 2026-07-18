import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { ObjectId } from "mongodb"
import { checkBloodBankInventory } from "@/lib/checkInventory"
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

// --- FABSM Algorithm Helpers ---
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function daysSince(date: Date | string | null | undefined): number {
  if (!date) return 999; // Assume eligible if no history
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function isDonorEligible(donor: any, component_type: string) {
  let last_whole_blood = null;
  let last_platelets = null;
  let last_plasma = null;
  let last_packed_rbcs = null;

  if (donor.donation_history && Array.isArray(donor.donation_history)) {
    const sorted = [...donor.donation_history].sort((a, b) => new Date(b.donated_at).getTime() - new Date(a.donated_at).getTime());
    last_whole_blood = sorted.find(h => h.component_type === 'whole-blood' || h.component_type === 'whole_blood')?.donated_at;
    last_platelets = sorted.find(h => h.component_type === 'platelets')?.donated_at;
    last_plasma = sorted.find(h => h.component_type === 'plasma')?.donated_at;
    last_packed_rbcs = sorted.find(h => h.component_type === 'packed-rbcs' || h.component_type === 'packed_rbcs')?.donated_at;
  } else if (donor.last_donated_date) {
    last_whole_blood = donor.last_donated_date;
  }

  const daysSinceWB = daysSince(last_whole_blood);
  const daysSincePlatelets = daysSince(last_platelets);
  const daysSincePlasma = daysSince(last_plasma);
  const daysSincePRBC = daysSince(last_packed_rbcs);

  let eligible = false;
  let days_until = 0;
  let reason = '';

  switch (component_type) {
    case 'whole-blood':
    case 'whole_blood':
      eligible = daysSinceWB >= 90;
      if (!eligible) {
        days_until = 90 - daysSinceWB;
        reason = 'whole blood requires 90 days cooldown';
      }
      break;
    case 'platelets':
      eligible = daysSincePlatelets >= 7 && daysSinceWB >= 56;
      if (!eligible) {
        if (daysSinceWB < 56) {
          days_until = 56 - daysSinceWB;
          reason = 'platelets requires 56 days after whole blood';
        } else {
          days_until = 7 - daysSincePlatelets;
          reason = 'platelets requires 7 days cooldown';
        }
      }
      break;
    case 'plasma':
      eligible = daysSincePlasma >= 28;
      if (!eligible) {
        days_until = 28 - daysSincePlasma;
        reason = 'plasma requires 28 days cooldown';
      }
      break;
    case 'packed-rbcs':
    case 'packed_rbcs':
      eligible = daysSincePRBC >= 56;
      if (!eligible) {
        days_until = 56 - daysSincePRBC;
        reason = 'packed RBCs requires 56 days cooldown';
      }
      break;
    default:
      eligible = true;
  }

  const relevant_days_since = {
    'whole_blood': daysSinceWB,
    'whole-blood': daysSinceWB,
    'platelets': Math.min(daysSincePlatelets, daysSinceWB),
    'plasma': daysSincePlasma,
    'packed_rbcs': daysSincePRBC,
    'packed-rbcs': daysSincePRBC
  }[component_type as string] || daysSinceWB;

  return { eligible, reason, days_until_eligible: days_until, relevant_days_since };
}

function calculateFABSMScore(donor: any, request: any) {
  const comp_type = request.component_type || 'whole-blood';
  const eligibility = isDonorEligible(donor, comp_type);
  if (!eligibility.eligible) {
    return { score: 0, eligible: false, fatigue_flag: false };
  }

  const distance_km = haversineKm(donor.lat, donor.lng, request.hospital_lat, request.hospital_lng);
  const distance_score = Math.max(0, (1 - distance_km / 30)) * 40;
  
  const eligibility_score = 30; // 30 points if eligible
  const response_score = (donor.historical_response_rate || 0) * 20;
  const recency_bonus = Math.min(eligibility.relevant_days_since / 365, 1) * 10;
  
  let total = distance_score + eligibility_score + response_score + recency_bonus;

  const RARE_GROUPS = ['O-','AB-','A-','B-','Bombay'];
  let isRareMatch = false;
  
  if (RARE_GROUPS.includes(request.blood_group) && donor.is_rare_donor && donor.rare_groups?.includes(request.blood_group)) {
    isRareMatch = true;
  }

  let fatigue_flag = false;
  if (!isRareMatch && (donor.notifications_this_month || 0) >= 3 && (donor.historical_response_rate || 0) < 0.2) {
    total = total * 0.3;
    fatigue_flag = true;
  }

  // Verification Multiplier
  const level = request.verification_level || 3;
  const verification_multiplier = level === 1 ? 1.2 : (level === 2 ? 1.0 : 0.8);
  
  // Care Circle Bonus
  let care_circle_bonus = 0;
  if (request.care_circle_previous_donors && Array.isArray(request.care_circle_previous_donors)) {
    if (request.care_circle_previous_donors.includes(donor._id?.toString())) {
      care_circle_bonus = 15;
    }
  }

  total = total * verification_multiplier + care_circle_bonus;
  
  if (isRareMatch) {
    total = total * 2.0;
  }

  return { score: total, eligible: true, fatigue_flag };
}

async function getTopDonors(usersCollection: any, request: any, radiusKm: number) {
  const { blood_group, hospital_lat, hospital_lng } = request;
  const compatibleGroups = getCompatibleDonors(blood_group);
  if (!compatibleGroups.includes("O-")) {
    compatibleGroups.push("O-");
  }

  const candidates = await usersCollection.find({
    bloodGroup: { $in: compatibleGroups },
    hasDisease: { $ne: true }
  }).toArray();

  const scoredDonors = candidates.map((donor: any) => {
    donor.lat = donor.latitude || donor.location?.coordinates?.[1] || 0;
    donor.lng = donor.longitude || donor.location?.coordinates?.[0] || 0;
    donor.last_donated_date = donor.lastDonatedAt || donor.last_donated_date || null;
    donor.notifications_this_month = donor.notificationsThisMonth || donor.notifications_this_month || 0;
    donor.historical_response_rate = donor.historicalResponseRate || donor.historical_response_rate || 0;

    const fabsm = calculateFABSMScore(donor, request);
    return { ...donor, fabsm };
  });

  const eligibleDonors = scoredDonors.filter((d: any) => 
    haversineKm(d.lat, d.lng, hospital_lat, hospital_lng) <= radiusKm && 
    d.fabsm.eligible
  );

  eligibleDonors.sort((a: any, b: any) => b.fabsm.score - a.fabsm.score);
  return eligibleDonors.slice(0, 5);
}
// -------------------------------

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
      inputMethod,
      care_circle_id,
      care_circle_previous_donors
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
    const newRequest = {
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
      care_circle_id: care_circle_id || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = await bloodRequestsCollection.insertOne(newRequest)

    const requestId = result.insertedId.toString()

    // 1) Log the SOS creation event
    const reqLogsCollection = db.collection("req_logs")
    await reqLogsCollection.insertOne({
      request_id: result.insertedId,
      created_at: new Date(),
      blood_group: bloodGroup,
      component_type: bloodComponent.replace("-", "_"), // ensure whole_blood format
      hospital_name: hospital.name,
      hospital_lat: hospital.latitude,
      hospital_lng: hospital.longitude,
      city: hospital.city || "",
      input_method: inputMethod || "manual",
      verification_level: 3,
      sos_resolved_at: null,
      resolution_radius_tier: "unresolved"
    })

    // eRaktKosh Inventory Check
    const stock = await checkBloodBankInventory(
      hospital.latitude, 
      hospital.longitude, 
      bloodGroup, 
      bloodComponent, 
      30
    );

    if (stock.length > 0) {
      // Return early with stock results, bypassing immediate donor notification
      return NextResponse.json(
        {
          message: "SOS request created. Blood bank stock found nearby.",
          requestId,
          blood_banks: stock
        },
        { status: 201 }
      )
    }

    // Find compatible donors for notification using FABSM
    const usersCollection = db.collection("users")
    
    const fabsmRequest = {
      hospital_lat: hospital.latitude,
      hospital_lng: hospital.longitude,
      blood_group: bloodGroup,
      component_type: bloodComponent,
      verification_level: 3, // It's newly created, so it's level 3 by default
      care_circle_previous_donors: care_circle_previous_donors || []
    };
    
    // Initial radius is 30km, fetching top 5 based on FABSM score
    const matchingUsers = await getTopDonors(usersCollection, fabsmRequest, 30)

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

      // 2) Log notifications to notification_logs
      const notificationLogsCollection = db.collection("notification_logs")
      const notifLogsToInsert: any[] = []
      matchingUsers.forEach((u: any) => {
        if (u.email) {
          notifLogsToInsert.push({
            donor_id: u._id,
            request_id: result.insertedId,
            notified_at: new Date(),
            channel: "email",
            donor_score: u.fabsm.score,
            responded_at: null,
            response: "ignored"
          })
        }
        if (u.phone && typeof u.phone === "string" && u.phone.trim().length > 0) {
          notifLogsToInsert.push({
            donor_id: u._id,
            request_id: result.insertedId,
            notified_at: new Date(),
            channel: "whatsapp",
            donor_score: u.fabsm.score,
            responded_at: null,
            response: "ignored"
          })
        }
      })
      if (notifLogsToInsert.length > 0) {
        await notificationLogsCollection.insertMany(notifLogsToInsert).catch((err: any) =>
          console.error("[SOS] Notification log error:", err)
        )
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
  } catch (err: any) {
    console.error("[SOS] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
