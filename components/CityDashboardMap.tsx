"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-leaflet-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

const RED_ICON = createCustomIcon('#C8374F')
const AMBER_ICON = createCustomIcon('#D4A017')
const GREEN_ICON = createCustomIcon('#22963F')

interface SOSRequest {
  id: string
  lat: number
  lng: number
  blood_group: string
  age_minutes: number
  status: string
}

export default function CityDashboardMap({ requests, cityCenter }: { requests: SOSRequest[], cityCenter: [number, number] }) {
  // Add slight offset for markers at the exact same location
  const locationCounts: Record<string, number> = {};
  const displayRequests = requests.map(req => {
    if (!req.lat || !req.lng) return { ...req, displayLat: req.lat, displayLng: req.lng };
    const key = `${req.lat.toFixed(4)},${req.lng.toFixed(4)}`;
    const count = locationCounts[key] || 0;
    locationCounts[key] = count + 1;
    
    if (count > 0) {
       const angle = count * (Math.PI / 3);
       const radius = 0.0015 + (0.0005 * Math.floor(count / 6)); // Roughly 150m offset
       return {
         ...req,
         displayLat: req.lat + Math.sin(angle) * radius,
         displayLng: req.lng + Math.cos(angle) * radius
       }
    }
    return { ...req, displayLat: req.lat, displayLng: req.lng };
  });

  return (
    <MapContainer center={cityCenter} zoom={12} style={{ height: "400px", width: "100%", borderRadius: "0.5rem", zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {displayRequests.map((req) => {
        if (!req.displayLat || !req.displayLng) return null
        
        let icon = GREEN_ICON
        let radius = 5000
        let color = '#7B1C2E' // Samarpan brand color

        if (req.status === 'active') {
          if (req.age_minutes < 30) {
            icon = RED_ICON
            radius = 5000 // 5km
          } else if (req.age_minutes >= 30 && req.age_minutes <= 60) {
            icon = AMBER_ICON
            radius = 15000 // 15km
          } else {
            icon = AMBER_ICON
            radius = 30000 // 30km
          }
        }

        return (
          <div key={req.id}>
            <Marker position={[req.displayLat, req.displayLng]} icon={icon}>
              <Popup>
                <div className="font-semibold text-sm">Blood Group: {req.blood_group}</div>
                <div className="text-xs text-gray-600">Age: {req.age_minutes} mins</div>
                <div className="text-xs text-gray-600">Status: {req.status}</div>
              </Popup>
            </Marker>
            
            {/* Pulsing Radius Circle */}
            <Circle 
              center={[req.displayLat, req.displayLng]} 
              pathOptions={{ fillColor: color, color: color, fillOpacity: 0.2, weight: 1 }} 
              radius={radius} 
            />
          </div>
        )
      })}
    </MapContainer>
  )
}
