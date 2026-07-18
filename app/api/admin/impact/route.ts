import { NextResponse } from "next/server"
import {
  getTotalLivesConnected,
  getAvgResponseTimeByCity,
  getMatchRateByCity,
  getRadiusTierDistribution,
  getDonorFatigueRate
} from "@/lib/impactMetrics"

export async function GET() {
  try {
    const [
      livesConnected,
      avgResponseTime,
      matchRate,
      radiusDistribution,
      fatigueRate
    ] = await Promise.all([
      getTotalLivesConnected(),
      getAvgResponseTimeByCity(),
      getMatchRateByCity(),
      getRadiusTierDistribution(),
      getDonorFatigueRate()
    ])

    return NextResponse.json({
      lives_connected: livesConnected,
      avg_response_time: avgResponseTime,
      match_rate: matchRate,
      radius_distribution: radiusDistribution,
      fatigue_rate: fatigueRate
    }, { status: 200 })
  } catch (error) {
    console.error("[Admin Impact GET] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
