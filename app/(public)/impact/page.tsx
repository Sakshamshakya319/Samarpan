"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts"
import {
  TrendingUp,
  Heart,
  Zap,
  Activity,
  Users,
  Shield,
  Clock,
  Target,
} from "lucide-react"

interface ImpactData {
  summary: {
    totalRequests: number
    fulfilledRequests: number
    activeRequests: number
    sosRequests: number
    sosResolved: number
    totalDonors: number
    matchRate: number
    verifiedRequests: number
    livesImpacted: number
  }
  cityStats: Array<{
    city: string
    activeRequests: number
    totalRequests: number
    fulfilledRequests: number
    resolutionRate: number
  }>
  bloodGroupStats: Array<{ bloodGroup: string; count: number }>
  recentActivity: Array<{ date: string; requests: number }>
}

const BLOOD_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#06b6d4",
  "#6366f1",
  "#a855f7",
  "#ec4899",
]

const TARGET_METRICS = [
  {
    label: "Avg Donor Response Time",
    target: "≤ 12 min",
    current: "Tracking…",
    icon: Clock,
    description: "Target from Phase 5",
  },
  {
    label: "Emergency Match Rate",
    target: "≥ 85%",
    current: null, // will be populated from API
    icon: Target,
    description: "% of requests fulfilled",
  },
  {
    label: "SOS Resolution Time",
    target: "≤ 30 min",
    current: "Tracking…",
    icon: Zap,
    description: "From request to donor contact",
  },
  {
    label: "Blood Search Reduction",
    target: "−60%",
    current: "vs. manual",
    icon: TrendingUp,
    description: "Compared to manual search",
  },
]

export default function ImpactPage() {
  const [data, setData] = useState<ImpactData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/analytics/impact")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Activity className="w-5 h-5 animate-pulse" />
          Loading impact data…
        </div>
      </main>
    )
  }

  const summary = data?.summary

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <Activity className="w-4 h-4" />
            Live Platform Metrics
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Our Impact</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Real numbers from real emergencies. Samarpan 2.0 tracks every request,
            response, and life helped.
          </p>
        </div>

        {/* Hero Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                value: summary.livesImpacted,
                label: "Lives Helped",
                icon: Heart,
                color: "from-red-500 to-pink-600",
                bg: "bg-gradient-to-br from-red-500 to-pink-600",
              },
              {
                value: summary.totalDonors,
                label: "Registered Donors",
                icon: Users,
                color: "from-blue-500 to-indigo-600",
                bg: "bg-gradient-to-br from-blue-500 to-indigo-600",
              },
              {
                value: `${summary.matchRate}%`,
                label: "Match Rate",
                icon: Target,
                color: "from-emerald-500 to-teal-600",
                bg: "bg-gradient-to-br from-emerald-500 to-teal-600",
              },
              {
                value: summary.sosRequests,
                label: "SOS Requests",
                icon: Zap,
                color: "from-amber-500 to-orange-600",
                bg: "bg-gradient-to-br from-amber-500 to-orange-600",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`${stat.bg} rounded-2xl p-5 text-white shadow-lg`}
              >
                <stat.icon className="w-6 h-6 opacity-80 mb-2" />
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm opacity-90 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Target Metrics */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6" />
            Platform Targets
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {TARGET_METRICS.map((metric) => {
              const currentValue =
                metric.label === "Emergency Match Rate" && summary
                  ? `${summary.matchRate}%`
                  : metric.current

              const isOnTrack =
                metric.label === "Emergency Match Rate"
                  ? (summary?.matchRate || 0) >= 85
                  : false

              return (
                <div
                  key={metric.label}
                  className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                >
                  <metric.icon className="w-5 h-5 text-primary mb-3" />
                  <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">{currentValue || "—"}</span>
                    {isOnTrack && (
                      <span className="text-xs text-emerald-600 font-medium">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Target: <strong>{metric.target}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {metric.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Activity Line Chart */}
          {data?.recentActivity && data.recentActivity.length > 0 && (
            <div className="p-5 rounded-2xl border bg-card">
              <h3 className="font-semibold mb-4">Requests (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.recentActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(v) =>
                      new Date(v).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Blood Group Demand Pie */}
          {data?.bloodGroupStats && data.bloodGroupStats.length > 0 && (
            <div className="p-5 rounded-2xl border bg-card">
              <h3 className="font-semibold mb-4">Blood Group Demand</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.bloodGroupStats}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    nameKey="bloodGroup"
                    label={({ bloodGroup, percent }) =>
                      `${bloodGroup} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data.bloodGroupStats.map((_, i) => (
                      <Cell
                        key={i}
                        fill={BLOOD_COLORS[i % BLOOD_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [`${v} requests`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* City Stats Bar Chart */}
        {data?.cityStats && data.cityStats.length > 0 && (
          <div className="p-5 rounded-2xl border bg-card">
            <h3 className="font-semibold mb-4">City-wise Requests</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.cityStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalRequests" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fulfilledRequests" name="Fulfilled" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="activeRequests" name="Active" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Verification Stats */}
        {summary && (
          <div className="p-6 rounded-2xl border bg-gradient-to-br from-muted/30 to-background">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Request Trust & Verification
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-xl border">
                <div className="text-2xl font-bold text-emerald-600">
                  {summary.verifiedRequests}
                </div>
                <div className="text-sm text-muted-foreground">🟢 Level 1 Verified</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border">
                <div className="text-2xl font-bold text-amber-600">
                  {summary.totalRequests - summary.verifiedRequests - summary.sosRequests > 0
                    ? summary.totalRequests - summary.verifiedRequests - summary.sosRequests
                    : 0}
                </div>
                <div className="text-sm text-muted-foreground">🟡 Level 2 Partial</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border">
                <div className="text-2xl font-bold text-red-600">
                  {summary.sosRequests}
                </div>
                <div className="text-sm text-muted-foreground">🔴 SOS / Level 3</div>
              </div>
            </div>
          </div>
        )}

        {/* Philosophy note */}
        <div className="text-center p-6 bg-primary/5 rounded-2xl border border-primary/20">
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto italic">
            "Build the emergency workflow flawlessly first. AI optimization comes after real data is
            collected." — After 500+ real requests, an ML-based behavioral scoring model will be
            trained to predict which donors will respond per request.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {summary?.totalRequests || 0} / 500 requests collected toward AI training data
          </p>
          {summary && (
            <div className="mt-3 max-w-xs mx-auto bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((summary.totalRequests || 0) / 500) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
