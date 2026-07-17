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
  hospitalLocation?: string
  hospital?: {
    name: string
    address: string
    city: string
    latitude: number
    longitude: number
  }
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
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  normal: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-green-50 text-green-700 border-green-200",
}

const LAUNCH_CITIES = [
  { name: "Jalandhar", status: "active", note: "LPU campus area" },
  { name: "Ludhiana", status: "onboarding", note: "Expanding" },
  { name: "Chandigarh", status: "onboarding", note: "Major medical hub" }
]

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-50 text-green-700 border border-green-200",
  onboarding: "bg-amber-50 text-amber-700 border border-amber-200",
  planned: "bg-blue-50 text-blue-700 border border-blue-200",
}

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  onboarding: "Onboarding",
  planned: "Planned",
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
    // Generate deterministic pseudo-random number from string (req._id)
    const seed = req._id ? req._id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.random() * 1000;
    const random1 = ((seed * 9301 + 49297) % 233280) / 233280;
    const random2 = (((seed + 1) * 9301 + 49297) % 233280) / 233280;

    if (req.hospital?.latitude && req.hospital?.longitude) {
      // Use exact hospital coordinates without any offset to ensure perfect accuracy
      return { ...req, lat: req.hospital.latitude, lng: req.hospital.longitude }
    }
    if (req.lat && req.lng) return req
    
    const locationStr = ((req.hospital?.name || req.hospitalLocation || "") + " " + (req.hospital?.city || req.city || "")).toLowerCase()
    for (const [city, coords] of Object.entries(FALLBACK_COORDS)) {
      if (locationStr.includes(city)) {
        // Add deterministic offset to prevent exact overlaps, but keep it stable across refreshes
        const offsetLat = (random1 - 0.5) * 0.02
        const offsetLng = (random2 - 0.5) * 0.02
        return { ...req, lat: coords[0] + offsetLat, lng: coords[1] + offsetLng }
      }
    }
    // Final fallback: India center with deterministic offset
    return { 
      ...req, 
      lat: 20.5937 + (random1 - 0.5) * 2, 
      lng: 78.9629 + (random2 - 0.5) * 2 
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

  const handleRequestClick = (reqId: string) => {
    router.push(`/request/${reqId}`)
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
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-slate-700" />
              </div>
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Live Dashboard</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Blood Shortage Map</h1>
            <p className="text-slate-500 mt-2 max-w-xl">
              Real-time blood requests across Indian cities. Updated every 2 minutes to provide accurate matching.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs font-medium text-slate-400 min-w-[120px] sm:text-right">
              Last updated: {isMounted ? lastRefreshed.toLocaleTimeString("en-IN") : "--:--:--"}
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={isLoading}
                className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-medium h-10 px-4 flex-1 sm:flex-none"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-slate-400" : ""}`} />
                Refresh
              </Button>
              <Link href="/sos" className="flex-1 sm:flex-none">
                <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 font-medium h-10 px-4 transition-colors shadow-sm">
                  <Activity className="w-4 h-4" />
                  SOS Request
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                label: "Active Requests",
                value: summary.activeRequests,
                icon: Activity,
                color: "text-red-600",
              },
              {
                label: "Donors Available",
                value: summary.totalDonors,
                icon: Users,
                color: "text-slate-900",
              },
              {
                label: "Match Rate",
                value: `${summary.matchRate}%`,
                icon: TrendingUp,
                color: "text-slate-900",
              },
              {
                label: "Lives Helped",
                value: summary.livesImpacted,
                icon: "❤️",
                color: "text-red-600",
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="p-5 md:p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
                  {typeof stat.icon === "string" ? (
                    <span className="text-xl">{stat.icon}</span>
                  ) : (
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  )}
                </div>
                <div className={`text-3xl font-black tracking-tight ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          <div className="space-y-6">
            {/* Urgency Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                <Filter className="w-4 h-4" />
                <span>Filter:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {["all", "critical", "high", "normal", "low"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedUrgency(level)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wider ${
                      selectedUrgency === level
                        ? "bg-slate-900 text-white border-transparent shadow-sm"
                        : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {level === "all" ? "All Requests" : level}
                  </button>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-2">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Geographic Distribution
                </h2>
                <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                  {requestsOnMap.length} Locations
                </span>
              </div>
              <CityMap 
                requests={filteredRequests} 
                height="500px" 
                onRequestClick={handleRequestClick} 
                selectedRequestId={selectedMapRequest}
              />
              {requestsOnMap.length === 0 && !isLoading && (
                <div className="text-center py-10 px-4">
                  <p className="text-sm font-medium text-slate-600">No mappable coordinates available.</p>
                  <p className="text-xs text-slate-400 mt-1">Requests without specific coordinates are hidden from the map.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Active Requests List */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[650px]">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10 sticky top-0">
                <h2 className="text-base font-bold text-slate-900">
                  Active Feed
                </h2>
                <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                  {filteredRequests.length} Total
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-28 rounded-xl bg-white border border-slate-200 animate-pulse"
                    />
                  ))
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-20 px-6">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                      <span className="text-2xl">🎉</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">No active requests found</p>
                    <p className="text-xs text-slate-500 mt-1">Our supply is currently meeting demand.</p>
                  </div>
                ) : (
                  filteredRequests.slice(0, 20).map((req) => (
                    <div
                      key={req._id}
                      onClick={() => {
                        setSelectedMapRequest(req._id)
                        window.scrollTo({ top: 100, behavior: "smooth" })
                      }}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors cursor-pointer group shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                            <span className="text-lg font-black text-red-600">{req.bloodGroup}</span>
                          </div>
                          {req.bloodComponent && req.bloodComponent !== "whole-blood" && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase tracking-wide border border-slate-200">
                              {req.bloodComponent.replace('-', ' ')}
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${URGENCY_COLORS[req.urgency] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          {req.urgency}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 mb-3">
                        <p className="text-sm font-semibold text-slate-900 truncate flex items-center gap-2">
                          {req.hospital?.name || req.hospitalLocation}
                        </p>
                        {(req.hospital?.city || req.city) && (
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {req.hospital?.city || req.city}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <VerificationBadge
                          level={(req.verificationLevel as 1 | 2 | 3) || 3}
                          size="sm"
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {new Date(req.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Launch Cities Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Cities Coverage</h2>
            <p className="text-xs text-slate-500 mt-1">Current operational status across regions.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Active Requests</th>
                  <th className="px-6 py-4">Resolution Rate</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {LAUNCH_CITIES.map((city) => {
                  const stats = cityStats.find(
                    (s) => s.city?.toLowerCase() === city.name.toLowerCase()
                  )
                  return (
                    <tr key={city.name} className="hover:bg-slate-50 transition-colors bg-white">
                      <td className="px-6 py-4 font-bold text-slate-900">{city.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[city.status]}`}>
                          {STATUS_LABEL[city.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {stats ? (
                          <span className="font-bold text-slate-900">
                            {stats.activeRequests}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {stats ? <span className="font-medium text-slate-700">{stats.resolutionRate}%</span> : <span className="text-slate-400 font-medium">—</span>}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{city.note}</td>
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
