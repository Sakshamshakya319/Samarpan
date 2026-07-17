"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { HospitalSnapshot } from "@/lib/models/hospital"

// Fix Leaflet's default icon path issues in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

L.Marker.prototype.options.icon = DefaultIcon

const HospitalIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", // We can use a custom red icon if needed
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const DonorIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  map.setView(center, zoom)
  return null
}

interface HospitalMapProps {
  hospital: HospitalSnapshot
  donorLocation?: { latitude: number, longitude: number }
}

export default function HospitalMap({ hospital, donorLocation }: HospitalMapProps) {
  const [route, setRoute] = useState<[number, number][]>([])
  const [distance, setDistance] = useState<string>("")
  const [duration, setDuration] = useState<string>("")

  useEffect(() => {
    if (donorLocation && hospital) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${donorLocation.longitude},${donorLocation.latitude};${hospital.longitude},${hospital.latitude}?overview=full&geometries=geojson`
          )
          const data = await res.json()
          if (data.routes && data.routes.length > 0) {
            const routeCoordinates = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]) // GeoJSON is [lng, lat], Leaflet is [lat, lng]
            setRoute(routeCoordinates)
            
            const distKm = (data.routes[0].distance / 1000).toFixed(1)
            const durMin = Math.round(data.routes[0].duration / 60)
            setDistance(`${distKm} km`)
            setDuration(`${durMin} mins`)
          }
        } catch (error) {
          console.error("Error fetching route", error)
        }
      }
      fetchRoute()
    }
  }, [donorLocation, hospital])

  const center: [number, number] = [hospital.latitude, hospital.longitude]

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border">
      {(distance && duration) && (
        <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm border text-sm font-medium">
          {distance} • {duration}
        </div>
      )}
      <MapContainer center={center} zoom={15} style={{ width: "100%", height: "100%", minHeight: "300px" }} scrollWheelZoom={false}>
        <ChangeView center={center} zoom={donorLocation ? 13 : 15} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} icon={HospitalIcon}>
          <Popup>
            <div className="text-sm font-semibold">{hospital.name}</div>
            <div className="text-xs text-muted-foreground">{hospital.address}</div>
          </Popup>
        </Marker>
        {donorLocation && (
          <Marker position={[donorLocation.latitude, donorLocation.longitude]} icon={DonorIcon}>
            <Popup>Your Location</Popup>
          </Marker>
        )}
        {route.length > 0 && (
          <Polyline positions={route} color="blue" weight={4} opacity={0.6} />
        )}
      </MapContainer>
    </div>
  )
}
