import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get("city") || "Amritsar"

    const db = await getDatabase()
    const bloodRequestsCollection = db.collection("bloodRequests")
    const usersCollection = db.collection("users")
    const notificationLogsCollection = db.collection("notification_logs")

    // Get active requests for the city
    const activeRequests = await bloodRequestsCollection
      .find({ 
        status: "active", 
        "hospital.city": { $regex: new RegExp(`^${city}$`, "i") } 
      })
      .toArray()

    const now = new Date().getTime()

    const formattedRequests = activeRequests.map((req: any) => {
      const ageMinutes = Math.floor((now - new Date(req.createdAt).getTime()) / 60000)
      return {
        id: req._id.toString(),
        lat: req.hospital?.latitude,
        lng: req.hospital?.longitude,
        blood_group: req.bloodGroup,
        age_minutes: ageMinutes,
        status: req.status, // "active", "fulfilled" (though we filtered by active)
      }
    })

    // Get available donors for city
    const availableDonorsCount = await usersCollection.countDocuments({
      city: { $regex: new RegExp(`^${city}$`, "i") },
      hasDisease: { $ne: true }
    })

    // Avg response time from notification logs (where responded_at != null)
    // We could match by request IDs in this city
    const reqIds = activeRequests.map((r: any) => r._id)
    const logs = await notificationLogsCollection
      .find({
        request_id: { $in: reqIds },
        responded_at: { $ne: null }
      })
      .toArray()
    
    let totalResponseMins = 0;
    let matchCount = 0;
    
    logs.forEach((log: any) => {
      if (log.notified_at && log.responded_at) {
        totalResponseMins += (new Date(log.responded_at).getTime() - new Date(log.notified_at).getTime()) / 60000;
        if (log.response === "yes") matchCount++;
      }
    });

    const avgResponseMin = logs.length > 0 ? Math.round(totalResponseMins / logs.length) : 0;
    
    // Match rate today
    const matchRate = logs.length > 0 ? Math.round((matchCount / logs.length) * 100) : 0;

    return NextResponse.json(
      {
        active_requests: formattedRequests,
        stats: {
          active: activeRequests.length,
          donors: availableDonorsCount,
          avg_response_min: avgResponseMin,
          match_rate: matchRate
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[CityDashboard] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
