import { getDatabase } from "@/lib/db/mongodb"

export async function getTotalLivesConnected() {
  const db = await getDatabase()
  const bloodRequests = db.collection("bloodRequests")

  const total = await bloodRequests.countDocuments({ status: "fulfilled" })

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recent = await bloodRequests.countDocuments({
    status: "fulfilled",
    updatedAt: { $gte: thirtyDaysAgo }
  })

  return { total, change_30_days: recent }
}

export async function getAvgResponseTimeByCity() {
  const db = await getDatabase()
  const logs = db.collection("notification_logs")

  const pipeline = [
    {
      $match: {
        response: "yes",
        notified_at: { $exists: true, $ne: null },
        responded_at: { $exists: true, $ne: null }
      }
    },
    {
      $project: {
        city: 1,
        response_time_ms: { $subtract: [{ $toDate: "$responded_at" }, { $toDate: "$notified_at" }] }
      }
    },
    {
      $group: {
        _id: "$city",
        avg_ms: { $avg: "$response_time_ms" },
        sample_size: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        city: "$_id",
        avg_minutes: { $round: [{ $divide: ["$avg_ms", 60000] }, 1] },
        sample_size: 1
      }
    },
    { $sort: { city: 1 } }
  ]

  return await logs.aggregate(pipeline).toArray()
}

export async function getMatchRateByCity() {
  const db = await getDatabase()
  const reqLogs = db.collection("req_logs")

  const pipeline = [
    {
      $group: {
        _id: "$city",
        total: { $sum: 1 },
        fulfilled: {
          $sum: { $cond: [{ $ne: ["$sos_resolved_at", null] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        city: "$_id",
        total: 1,
        fulfilled: 1,
        match_rate: {
          $cond: [
            { $gt: ["$total", 0] },
            { $round: [{ $multiply: [{ $divide: ["$fulfilled", "$total"] }, 100] }, 1] },
            0
          ]
        }
      }
    },
    { $sort: { city: 1 } }
  ]

  return await reqLogs.aggregate(pipeline).toArray()
}

export async function getRadiusTierDistribution() {
  const db = await getDatabase()
  const reqLogs = db.collection("req_logs")

  const pipeline = [
    {
      $group: {
        _id: "$resolution_radius_tier",
        count: { $sum: 1 }
      }
    }
  ]

  const results = await reqLogs.aggregate(pipeline).toArray()
  
  const distribution: any = {
    tier_5km: 0,
    tier_15km: 0,
    tier_30km: 0,
    unresolved: 0,
    total: 0
  }

  results.forEach((r: any) => {
    if (r._id === '5km') distribution.tier_5km = r.count;
    else if (r._id === '15km') distribution.tier_15km = r.count;
    else if (r._id === '30km') distribution.tier_30km = r.count;
    else distribution.unresolved += r.count;
    distribution.total += r.count;
  })

  return distribution
}

export async function getDonorFatigueRate() {
  const db = await getDatabase()
  const users = db.collection("users")

  const activeDonors = await users.countDocuments({ hasDisease: { $ne: true } })
  const fatiguedDonors = await users.countDocuments({
    hasDisease: { $ne: true },
    notifications_this_month: { $gte: 3 },
    historical_response_rate: { $lt: 0.2 }
  })

  const fatigue_rate_pct = activeDonors > 0 ? (fatiguedDonors / activeDonors) * 100 : 0

  return {
    fatigued_count: fatiguedDonors,
    total_donors: activeDonors,
    fatigue_rate_pct: Math.round(fatigue_rate_pct * 10) / 10
  }
}
