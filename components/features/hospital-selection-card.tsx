"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Search, MapPin, Navigation, Building2, CheckCircle2, AlertCircle, List } from "lucide-react"
import { HospitalSnapshot } from "@/lib/models/hospital"
import { cn } from "@/lib/utils/utils"

interface HospitalSelectionCardProps {
  onSelect: (hospital: HospitalSnapshot) => void
  selectedHospital?: HospitalSnapshot | null
}

export function HospitalSelectionCard({ onSelect, selectedHospital }: HospitalSelectionCardProps) {
  const [mode, setMode] = useState<"search" | "nearby" | "city">("search")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState("")

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch cities list on mount
  useEffect(() => {
    fetch('/api/hospitals/city')
      .then(r => r.json())
      .then(data => {
        if (data.cities) setCities(data.cities)
      })
      .catch(console.error)
  }, [])

  // Debounced Search
  useEffect(() => {
    if (mode !== "search") return
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/hospitals/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.hospitals || [])
        }
      } catch (err) {
        console.error("Failed to search hospitals", err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [query, mode])

  useEffect(() => {
    if (mode !== "city" || !selectedCity) return
    setIsSearching(true)
    fetch(`/api/hospitals/city?city=${encodeURIComponent(selectedCity)}`)
      .then(r => r.json())
      .then(data => {
        setResults(data.hospitals || [])
        if (data.hospitals?.length === 0) setError("No hospitals found in this city.")
      })
      .catch(() => setError("Failed to fetch city hospitals."))
      .finally(() => setIsSearching(false))
  }, [selectedCity, mode])

  const handleUseLocation = () => {
    setMode("nearby")
    setError("")
    setIsLocating(true)
    setResults([])

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(`/api/hospitals/nearby?latitude=${latitude}&longitude=${longitude}&radius=20`)
          if (res.ok) {
            const data = await res.json()
            setResults(data.hospitals || [])
            if (data.hospitals?.length === 0) {
              setError("No verified hospitals found within 20km of your location.")
            }
          } else {
            setError("Failed to fetch nearby hospitals.")
          }
        } catch (err) {
          setError("Network error while finding nearby hospitals.")
        } finally {
          setIsLocating(false)
        }
      },
      (err) => {
        let errorMessage = "Location access failed."
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions in your browser settings."
            break
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable right now. Try searching instead."
            break
          case err.TIMEOUT:
            errorMessage = "Location request timed out. Please check your connection or try searching."
            break
          default:
            errorMessage = "An unknown error occurred while getting location."
            break
        }
        setError(errorMessage)
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const handleSelect = (h: any) => {
    const osmUrl = `https://www.openstreetmap.org/?mlat=${h.latitude}&mlon=${h.longitude}#map=18/${h.latitude}/${h.longitude}`
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${h.latitude},${h.longitude}`

    const snapshot: HospitalSnapshot = {
      hospitalId: h.hospitalId,
      name: h.hospitalName,
      address: h.address,
      city: h.city,
      district: h.district,
      latitude: h.latitude,
      longitude: h.longitude,
      osmUrl,
      googleUrl
    }
    onSelect(snapshot)
    setQuery("")
    setResults([])
  }

  if (selectedHospital) {
    return (
      <Card className="border-2 border-emerald-500/20 bg-emerald-50/50">
        <CardContent className="p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 bg-emerald-100 p-2 rounded-full">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-emerald-900">{selectedHospital.name}</h4>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-sm text-emerald-700/80 mt-1">{selectedHospital.address}</p>
              <p className="text-xs text-emerald-600/70">{selectedHospital.city}, {selectedHospital.district}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => onSelect(null as any)}>
            Change
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        <button
          type="button"
          onClick={() => { setMode("search"); setResults([]) }}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
            mode === "search" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Search className="w-4 h-4" /> Search
        </button>
        <button
          type="button"
          onClick={() => { setMode("city"); setResults([]); setError(""); }}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
            mode === "city" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <List className="w-4 h-4" /> Browse
        </button>
        <button
          type="button"
          onClick={handleUseLocation}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
            mode === "nearby" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Navigation className="w-4 h-4" /> Nearby
        </button>
      </div>

      {mode === "search" && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search verified hospital by name, city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-11"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {mode === "city" && (
        <div className="relative">
          <select
            value={selectedCity}
            onChange={(e) => { setSelectedCity(e.target.value); setError(""); }}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select a city to view all hospitals...</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          {mode === "nearby" && (
            <div className="ml-7 mt-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setMode("search"); setError(""); }}
                className="bg-white border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <Search className="w-4 h-4 mr-2" />
                Switch to Search
              </Button>
            </div>
          )}
        </div>
      )}

      {isLocating && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Finding hospitals near you...
        </div>
      )}

      {results.length > 0 && (
        <div className="border rounded-xl divide-y bg-background shadow-sm max-h-[300px] overflow-y-auto">
          {results.map((h) => (
            <button
              key={h.hospitalId}
              type="button"
              onClick={() => handleSelect(h)}
              className="w-full text-left p-3 hover:bg-muted transition-colors flex items-start gap-3"
            >
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">{h.hospitalName}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{h.address}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full">{h.city}</span>
                  {h.distance && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                      {(h.distance / 1000).toFixed(1)} km away
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
