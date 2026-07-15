import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { getTokenFromRequest } from "@/lib/auth/auth-utils"
import { verifyToken } from "@/lib/auth/auth"
import { ObjectId } from "mongodb"
import { haversineDistance, getNotificationRadius } from "@/lib/utils/haversine"

/**
 * GET /api/blood-request/nearby?requestId=xxx
 * Returns donors within the appropriate radius based on request age.
 * Also supports manually specifying radius via ?radius=15 (km)
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

    const url = new URL(request.url)
    const requestId = url.searchParams.get("requestId")
    const manualRadius = url.searchParams.get("radius")
      ? parseFloat(url.searchParams.get("radius")!)
      : null

    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const bloodRequestsCollection = db.collection("bloodRequests")

    // Get the blood request
    let bloodRequest: any
    try {
      bloodRequest = await bloodRequestsCollection.findOne({
        _id: new ObjectId(requestId),
      })
    } catch {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 })
    }

    if (!bloodRequest) {
      return NextResponse.json({ error: "Blood request not found" }, { status: 404 })
    }

    // Determine notification radius
    const radius =
      manualRadius ??
      getNotificationRadius(new Date(bloodRequest.createdAt))

    const usersCollection = db.collection("users")

    // Find donors with matching blood group
    const potentialDonors = await usersCollection
      .find({
        bloodGroup: bloodRequest.bloodGroup,
        hasDisease: { $ne: true },
        _id: { $ne: new ObjectId(decoded.userId) },
      })
      .toArray()

    // Filter by distance if request has geocoordinates
    let nearbyDonors = potentialDonors
    let radiusUsed = radius

    if (bloodRequest.lat && bloodRequest.lng && radius !== Infinity) {
      nearbyDonors = potentialDonors.filter((donor) => {
        if (!donor.lat || !donor.lng) return false
        const dist = haversineDistance(
          bloodRequest.lat,
          bloodRequest.lng,
          donor.lat,
          donor.lng
        )
        return dist <= radius
      })
    }

    // If no nearby donors found and request > 2 hours old, return all city donors
    if (nearbyDonors.length === 0 && radius === Infinity) {
      nearbyDonors = potentialDonors.filter(
        (d) => !d.city || !bloodRequest.city || d.city === bloodRequest.city
      )
    }

    // Add distance to each donor
    const donorsWithDistance = nearbyDonors.map((donor: any) => {
      let distanceKm: number | null = null
      if (bloodRequest.lat && bloodRequest.lng && donor.lat && donor.lng) {
        distanceKm = haversineDistance(
          bloodRequest.lat,
          bloodRequest.lng,
          donor.lat,
          donor.lng
        )
      }
      return {
        id: donor._id.toString(),
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        city: donor.city || "",
        distanceKm,
        hasLocation: !!donor.lat && !!donor.lng,
      }
    })

    donorsWithDistance.sort((a: { distanceKm: number | null }, b: { distanceKm: number | null }) => {
      if (a.distanceKm === null) return 1
      if (b.distanceKm === null) return -1
      return a.distanceKm - b.distanceKm
    })

    return NextResponse.json({
      requestId,
      bloodGroup: bloodRequest.bloodGroup,
      hospitalLocation: bloodRequest.hospitalLocation,
      radiusKm: radius === Infinity ? "city-wide" : radius,
      donorsFound: donorsWithDistance.length,
      donors: donorsWithDistance.slice(0, 50), // Return top 50
    })
  } catch (error) {
    console.error("[Nearby Donors] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
