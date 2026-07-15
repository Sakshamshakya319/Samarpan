import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"

/**
 * GET /api/analytics/impact
 * Returns platform-wide impact metrics aggregated from MongoDB.
 * Public endpoint — no auth required.
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const bloodRequestsCollection = db.collection("bloodRequests")
    const usersCollection = db.collection("users")

    const [
      totalRequests,
      fulfilledRequests,
      activeRequests,
      sosRequests,
      totalDonors,
      cityStats,
      recentRequests,
    ] = await Promise.all([
      // Total blood requests
      bloodRequestsCollection.countDocuments(),

      // Fulfilled requests
      bloodRequestsCollection.countDocuments({ status: "fulfilled" }),

      // Active requests
      bloodRequestsCollection.countDocuments({ status: "active" }),

      // SOS requests
      bloodRequestsCollection.countDocuments({ isSOS: true }),

      // Total registered donors
      usersCollection.countDocuments({ bloodGroup: { $exists: true, $ne: "" } }),

      // Per-city breakdown
      bloodRequestsCollection
        .aggregate([
          { $match: { city: { $exists: true, $ne: "" } } },
          {
            $group: {
              _id: "$city",
              activeRequests: {
                $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
              },
              totalRequests: { $sum: 1 },
              fulfilledRequests: {
                $sum: { $cond: [{ $eq: ["$status", "fulfilled"] }, 1, 0] },
              },
            },
          },
          { $sort: { totalRequests: -1 } },
          { $limit: 10 },
        ])
        .toArray(),

      // Last 30 days requests for chart
      bloodRequestsCollection
        .aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
    ])

    // Blood group distribution
    const bloodGroupStats = await bloodRequestsCollection
      .aggregate([
        {
          $group: {
            _id: "$bloodGroup",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray()

    // Calculate match rate
    const matchRate =
      totalRequests > 0
        ? Math.round((fulfilledRequests / totalRequests) * 100)
        : 0

    // Verified requests
    const verifiedRequests = await bloodRequestsCollection.countDocuments({
      verificationLevel: 1,
    })

    // SOS resolved
    const sosResolved = await bloodRequestsCollection.countDocuments({
      isSOS: true,
      status: "fulfilled",
    })

    return NextResponse.json({
      summary: {
        totalRequests,
        fulfilledRequests,
        activeRequests,
        sosRequests,
        sosResolved,
        totalDonors,
        matchRate,
        verifiedRequests,
        livesImpacted: fulfilledRequests, // 1 fulfilled request ≈ 1 life helped
      },
      cityStats: cityStats.map((c: any) => ({
        city: c._id,
        activeRequests: c.activeRequests,
        totalRequests: c.totalRequests,
        fulfilledRequests: c.fulfilledRequests,
        resolutionRate:
          c.totalRequests > 0
            ? Math.round((c.fulfilledRequests / c.totalRequests) * 100)
            : 0,
      })),
      bloodGroupStats: bloodGroupStats.map((b: any) => ({
        bloodGroup: b._id,
        count: b.count,
      })),
      recentActivity: recentRequests.map((r: any) => ({
        date: r._id,
        requests: r.count,
      })),
    })
  } catch (error) {
    console.error("[Analytics Impact] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
