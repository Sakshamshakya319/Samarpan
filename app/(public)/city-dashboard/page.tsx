"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { CityMap } from "@/components/features/city-map"
import { VerificationBadge } from "@/components/shared/verification-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Activity,
  Users,
  TrendingUp,
  RefreshCw,
  Filter,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/lib/store/hooks"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface CityStats {
  city: string
  activeRequests: number
  totalRequests: number
  fulfilledRequests: number
  resolutionRate: number
}

interface BloodRequest {
  _id: string
  bloodGroup: string
  hospitalLocation: string
  lat?: number
  lng?: number
  city?: string
  urgency: string
  status: string
  createdAt: string
  verificationLevel?: 1 | 2 | 3
  bloodComponent?: string
}

const URGENCY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  normal: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-green-100 text-green-800 border-green-200",
}

const LAUNCH_CITIES = [
  { name: "Jalandhar", status: "active", note: "LPU campus area" },
  { name: "Ludhiana", status: "onboarding", note: "Expanding" },
  { name: "Chandigarh", status: "onboarding", note: "Major medical hub" }
]

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  onboarding: "bg-amber-100 text-amber-800",
  planned: "bg-blue-100 text-blue-800",
}

const STATUS_LABEL: Record<string, string> = {
  active: "🟢 Active",
  onboarding: "🟡 Onboarding",
  planned: "🔵 Planned",
}

const FALLBACK_COORDS: Record<string, [number, number]> = {
  jalandhar: [31.3260, 75.5762],
  ludhiana: [30.9010, 75.8573],
  chandigarh: [30.7333, 76.7794],
  amritsar: [31.6340, 74.8723],
  delhi: [28.6139, 77.2090],
}

function enrichCoordinates(requests: BloodRequest[]) {
  return requests.map(req => {
    if (req.lat && req.lng) return req
    
    const locationStr = (req.hospitalLocation + " " + (req.city || "")).toLowerCase()
    for (const [city, coords] of Object.entries(FALLBACK_COORDS)) {
      if (locationStr.includes(city)) {
        // Add slight random offset to prevent exact overlaps
        const offsetLat = (Math.random() - 0.5) * 0.02
        const offsetLng = (Math.random() - 0.5) * 0.02
        return { ...req, lat: coords[0] + offsetLat, lng: coords[1] + offsetLng }
      }
    }
    // Final fallback: India center with offset
    return { 
      ...req, 
      lat: 20.5937 + (Math.random() - 0.5) * 2, 
      lng: 78.9629 + (Math.random() - 0.5) * 2 
    }
  })
}

export default function CityDashboardPage() {
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [cityStats, setCityStats] = useState<CityStats[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all")
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [isMounted, setIsMounted] = useState(false)
  const [selectedMapRequest, setSelectedMapRequest] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const { isAuthenticated } = useAppSelector((state) => state.auth)
  const router = useRouter()
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  const handleRequestClick = (reqId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/city-dashboard`)
    } else {
      router.push(`/dashboard`)
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [reqResp, impactResp] = await Promise.all([
        fetch("/api/blood-request?all=true"),
        fetch("/api/analytics/impact"),
      ])

      if (reqResp.ok) {
        const data = await reqResp.json()
        setRequests(enrichCoordinates(data.requests || []))
      }

      if (impactResp.ok) {
        const impact = await impactResp.json()
        setCityStats(impact.cityStats || [])
        setSummary(impact.summary)
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err)
    } finally {
      setIsLoading(false)
      setLastRefreshed(new Date())
    }
  }

  useEffect(() => {
    fetchData()
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchData, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const filteredRequests = selectedUrgency === "all"
    ? requests
    : requests.filter((r) => r.urgency === selectedUrgency)

  const requestsOnMap = filteredRequests.filter((r) => r.lat && r.lng)

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Live City Dashboard</span>
            </div>
            <h1 className="text-4xl font-bold">Blood Shortage Map</h1>
            <p className="text-muted-foreground mt-1">
              Real-time blood requests across Indian cities. Updated every 2 minutes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground min-w-[120px] text-right">
              Last updated: {isMounted ? lastRefreshed.toLocaleTimeString("en-IN") : "--:--:--"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/sos">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1">
                🚨 SOS Request
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Active Requests",
                value: summary.activeRequests,
                icon: Activity,
                color: "text-red-600",
                bg: "bg-red-50",
              },
              {
                label: "Donors Available",
                value: summary.totalDonors,
                icon: Users,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Match Rate",
                value: `${summary.matchRate}%`,
                icon: TrendingUp,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Lives Helped",
                value: summary.livesImpacted,
                icon: "❤️",
                color: "text-pink-600",
                bg: "bg-pink-50",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`p-4 rounded-xl border ${stat.bg} border-opacity-60`}
              >
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Urgency Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by urgency:</span>
          {["all", "critical", "high", "normal", "low"].map((level) => (
            <button
              key={level}
              onClick={() => setSelectedUrgency(level)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                selectedUrgency === level
                  ? "bg-primary text-white border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary"
              }`}
            >
              {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Live Request Map
            <span className="text-sm font-normal text-muted-foreground">
              ({requestsOnMap.length} requests with location)
            </span>
          </h2>
          <CityMap 
            requests={filteredRequests} 
            height="450px" 
            onRequestClick={handleRequestClick} 
            selectedRequestId={selectedMapRequest}
          />
          {requestsOnMap.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No requests with map coordinates yet. Requests with hospital names will appear as locations are geocoded.
            </p>
          )}
        </div>

        {/* Active Requests List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Active Requests ({filteredRequests.length})
          </h2>
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No active blood requests right now 🎉</p>
              <p className="text-sm mt-1">That means we're meeting demand!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredRequests.slice(0, 20).map((req) => (
                <div
                  key={req._id}
                  onClick={() => {
                    setSelectedMapRequest(req._id)
                    // Scroll up to the map smoothly
                    window.scrollTo({ top: 100, behavior: "smooth" })
                  }}
                  className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-primary">{req.bloodGroup}</span>
                      {req.bloodComponent && req.bloodComponent !== "whole-blood" && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          {req.bloodComponent}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${URGENCY_COLORS[req.urgency] || ""}`}
                      >
                        {req.urgency}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium mt-1 truncate">
                    🏥 {req.hospitalLocation}
                  </p>
                  {req.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {req.city}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <VerificationBadge
                      level={(req.verificationLevel as 1 | 2 | 3) || 3}
                      size="sm"
                    />
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Launch Cities Table */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Cities Coverage</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">City</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Active Requests</th>
                  <th className="px-4 py-3 text-left font-medium">Resolution Rate</th>
                  <th className="px-4 py-3 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {LAUNCH_CITIES.map((city) => {
                  const stats = cityStats.find(
                    (s) => s.city?.toLowerCase() === city.name.toLowerCase()
                  )
                  return (
                    <tr key={city.name} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{city.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[city.status]}`}
                        >
                          {STATUS_LABEL[city.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {stats ? (
                          <span className="font-semibold text-red-600">
                            {stats.activeRequests}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {stats ? `${stats.resolutionRate}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{city.note}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </main>
  )
}
