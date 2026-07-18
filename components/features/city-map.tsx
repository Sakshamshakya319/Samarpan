"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface BloodRequest {
  _id: string
  bloodGroup: string
  hospitalLocation?: string
  hospital?: {
    name: string
    address?: string
    city?: string
    latitude?: number
    longitude?: number
  }
  lat?: number
  lng?: number
  city?: string
  urgency: string
  status: string
  createdAt: string
  verificationLevel?: 1 | 2 | 3
  isSOS?: boolean
  bloodComponent?: string
}

interface CityMapProps {
  requests: BloodRequest[]
  center?: [number, number]
  zoom?: number
  height?: string
  onRequestClick?: (requestId: string) => void
  selectedRequestId?: string | null
}

// Urgency color mapping
const URGENCY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  normal: "#d97706",
  low: "#16a34a",
}

const BLOOD_GROUP_COLORS: Record<string, string> = {
  "A+": "#ef4444",
  "A-": "#f97316",
  "B+": "#eab308",
  "B-": "#84cc16",
  "O+": "#06b6d4",
  "O-": "#6366f1",
  "AB+": "#a855f7",
  "AB-": "#ec4899",
  "Bombay (Oh)": "#dc2626",
}

export function CityMap({
  requests,
  center = [20.5937, 78.9629], // India center
  zoom = 5,
  height = "500px",
  onRequestClick,
  selectedRequestId,
}: CityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const markerMapRef = useRef<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    const initMap = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const L = (await import("leaflet")).default
        await import("leaflet/dist/leaflet.css")

        if (!mapRef.current || !isMounted) return

        // Fix default icon paths (Leaflet + webpack issue)
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        })

        // Initialize map if not already done
        if (!leafletMapRef.current) {
          leafletMapRef.current = L.map(mapRef.current, {
            center,
            zoom,
            zoomControl: true,
          })

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
            maxZoom: 18,
          }).addTo(leafletMapRef.current)
          
          // Inject keyframes for pulse animation if not exists
          if (!document.getElementById('map-animations')) {
            const style = document.createElement('style')
            style.id = 'map-animations'
            style.innerHTML = `
              @keyframes map-pulse {
                0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
                70% { box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); }
                100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
              }
            `
            document.head.appendChild(style)
          }
        }

        // Clear existing markers
        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []
        markerMapRef.current = {}

        // Add markers for requests with coordinates, adding a slight offset for identical locations
        const locationCounts: Record<string, number> = {};
        const requestsWithCoords = requests.filter((r) => r.lat && r.lng).map(req => {
          const key = `${req.lat!.toFixed(4)},${req.lng!.toFixed(4)}`;
          const count = locationCounts[key] || 0;
          locationCounts[key] = count + 1;
          
          if (count > 0) {
             const angle = count * (Math.PI / 4);
             const radius = 0.0005 + (0.0003 * Math.floor(count / 8)); // roughly 50m offset
             return {
               ...req,
               lat: req.lat! + Math.sin(angle) * radius,
               lng: req.lng! + Math.cos(angle) * radius
             }
          }
          return req;
        });

        requestsWithCoords.forEach((req) => {
          if (!req.lat || !req.lng) return

          const color = URGENCY_COLORS[req.urgency] || "#6b7280"
          const bgColor = BLOOD_GROUP_COLORS[req.bloodGroup] || "#6b7280"

          const isEmergency = req.isSOS || req.urgency === "critical"
          
          // CSS for pulsing animation if emergency
          const pulseStyle = isEmergency 
            ? `box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); animation: map-pulse 1.5s infinite;` 
            : `box-shadow: 0 2px 8px rgba(0,0,0,0.4);`

          // Custom colored marker
          const markerIcon = L.divIcon({
            html: `
              <div style="
                width: 36px; height: 36px;
                background: ${bgColor};
                border: 3px solid white;
                border-radius: 50%;
                ${pulseStyle}
                display: flex; align-items: center; justify-content: center;
                font-weight: bold; font-size: 10px; color: white;
                position: relative;
              ">
                ${req.bloodGroup}
                <div style="
                  position: absolute; bottom: -8px; left: 50%;
                  transform: translateX(-50%);
                  width: 0; height: 0;
                  border-left: 5px solid transparent;
                  border-right: 5px solid transparent;
                  border-top: 8px solid ${bgColor};
                "></div>
              </div>
            `,
            className: "",
            iconSize: [36, 44],
            iconAnchor: [18, 44],
            popupAnchor: [0, -44],
          })

          const urgencyLabel =
            req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)

          const verifyEmoji =
            req.verificationLevel === 1
              ? "🟢"
              : req.verificationLevel === 2
              ? "🟡"
              : "🔴"

          const popup = L.popup({ maxWidth: 250 }).setContent(`
            <div style="font-family: system-ui, sans-serif; padding: 4px;">
              <div style="font-weight: bold; font-size: 14px; color: ${bgColor}; margin-bottom: 6px;">
                🩸 ${req.bloodGroup} Needed
              </div>
              <div style="font-size: 12px; color: #374151; space-y: 4px;">
                <div>🏥 ${req.hospital?.name || req.hospitalLocation || 'Hospital'}</div>
                <div>🚨 Urgency: <strong style="color:${color}">${urgencyLabel}</strong></div>
                <div>${verifyEmoji} Trust: Level ${req.verificationLevel || 3}</div>
                <div style="color: #6b7280; font-size: 11px; margin-top: 4px;">
                  ${new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
                ${req.status === "active" ? `
                <div style="margin-top: 10px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  <button class="accept-btn" style="width: 100%; background: ${isEmergency ? '#dc2626' : '#2563eb'}; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 500; cursor: pointer; transition: opacity 0.2s;">
                    ${isEmergency ? 'Accept SOS Request' : 'Accept Request'}
                  </button>
                </div>
                ` : ''}
              </div>
            </div>
          `)

          const marker = L.marker([req.lat!, req.lng!], { icon: markerIcon })
            .bindPopup(popup)
            .addTo(leafletMapRef.current!)

          marker.on('popupopen', (e: any) => {
            const btn = e.popup._contentNode.querySelector('.accept-btn')
            if (btn) {
              btn.onmouseover = () => btn.style.opacity = '0.9'
              btn.onmouseout = () => btn.style.opacity = '1'
              btn.onclick = () => {
                if (onRequestClick) onRequestClick(req._id)
              }
            }
          })

          markersRef.current.push(marker)
          markerMapRef.current[req._id] = marker
        })

        // Auto-fit bounds if we have markers
        if (markersRef.current.length > 1) {
          const group = L.featureGroup(markersRef.current)
          leafletMapRef.current.fitBounds(group.getBounds().pad(0.15))
        }

        setIsLoading(false)
      } catch (err) {
        console.error("Map init error:", err)
        setError("Failed to load map")
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      isMounted = false
    }
  }, [requests, center, zoom])

  // Handle selected request
  useEffect(() => {
    if (selectedRequestId && leafletMapRef.current && markerMapRef.current[selectedRequestId]) {
      const marker = markerMapRef.current[selectedRequestId]
      leafletMapRef.current.flyTo(marker.getLatLng(), 15, { duration: 1.5 })
      setTimeout(() => marker.openPopup(), 1500)
    }
  }, [selectedRequestId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative rounded-xl overflow-hidden border border-border shadow-sm" style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-[1000]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading map…</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-[1000]">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
