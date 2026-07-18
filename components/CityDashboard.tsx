"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Dynamically import the map to avoid SSR issues with Leaflet
const CityDashboardMap = dynamic(() => import("./CityDashboardMap"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 rounded-lg animate-pulse">Loading Map...</div>
})

const CITIES = ["Amritsar", "Ludhiana", "Chandigarh", "Delhi"]
const CITY_COORDINATES: Record<string, [number, number]> = {
  "Amritsar": [31.6340, 74.8723],
  "Ludhiana": [30.9010, 75.8573],
  "Chandigarh": [30.7333, 76.7794],
  "Delhi": [28.7041, 77.1025]
}

export default function CityDashboard() {
  const [selectedCity, setSelectedCity] = useState("Amritsar")
  const [data, setData] = useState({ active_requests: [], stats: { active: 0, donors: 0, avg_response_min: 0, match_rate: 0 } })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/dashboard/city?city=${selectedCity}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      }
    }

    fetchData()
    
    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [selectedCity])

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">City Geolocation Dashboard</h2>
        
        {/* City Selector Pills */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-full overflow-x-auto">
          {CITIES.map(city => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCity === city 
                  ? "bg-[#7B1C2E] text-white shadow-sm" 
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <CityDashboardMap 
          requests={data.active_requests} 
          cityCenter={CITY_COORDINATES[selectedCity] || CITY_COORDINATES["Amritsar"]} 
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
          <div className="text-sm text-gray-500 mb-1">Active Requests</div>
          <div className="text-3xl font-bold text-[#7B1C2E]">{data.stats.active}</div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
          <div className="text-sm text-gray-500 mb-1">Available Donors</div>
          <div className="text-3xl font-bold text-[#7B1C2E]">{data.stats.donors}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
          <div className="text-sm text-gray-500 mb-1">Avg Response (mins)</div>
          <div className="text-3xl font-bold text-[#7B1C2E]">{data.stats.avg_response_min}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
          <div className="text-sm text-gray-500 mb-1">Match Rate Today</div>
          <div className="text-3xl font-bold text-[#7B1C2E]">{data.stats.match_rate}%</div>
        </div>
      </div>
    </div>
  )
}
