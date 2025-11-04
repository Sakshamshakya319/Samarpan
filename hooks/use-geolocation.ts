import { useState, useCallback } from "react"

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  locationName: string
  loading: boolean
  error: string
  permission: "granted" | "denied" | "pending"
}

interface UseGeolocationReturn extends GeolocationState {
  requestLocation: () => void
  clearError: () => void
}

const GEOLOCATION_TIMEOUT = 10000 // 10 seconds
const NOMINATIM_TIMEOUT = 5000 // 5 seconds

/**
 * Custom hook for handling geolocation with proper error handling,
 * timeout management, and reverse geocoding
 * 
 * Features:
 * - Timeout handling for geolocation requests
 * - Timeout handling for reverse geocoding API
 * - Proper error messages with specific error codes
 * - Graceful fallback when location name fetch fails
 * - Location caching (5 minutes)
 */
export function useGeolocation(): UseGeolocationReturn {
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationName, setLocationName] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [permission, setPermission] = useState<"granted" | "denied" | "pending">("pending")

  const fetchLocationName = useCallback(async (lat: number, lon: number) => {
    try {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT)

      // Use backend proxy to avoid CORS issues
      const response = await fetch(
        `/api/geolocation?lat=${lat}&lon=${lon}`,
        {
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setLocationName(data.locationName || "")
      } else {
        // API call failed, but we already have coordinates - that's OK
        setLocationName("")
      }
    } catch (err) {
      // Location name fetch failed (timeout or network error)
      // This is not critical - coordinates are still available
      if (err instanceof Error && err.name !== "AbortError") {
        console.debug("Non-critical reverse geocoding error:", err.message)
      }
      setLocationName("")
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("❌ Geolocation is not supported by your browser. Please use a modern browser like Chrome, Firefox, or Safari.")
      setPermission("denied")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")

    // Create a timeout for geolocation request
    const timeoutId = setTimeout(() => {
      setError("⏱️ Location request timed out. Your device might not have GPS enabled. Please enable location services and try again.")
      setPermission("denied")
      setLoading(false)
    }, GEOLOCATION_TIMEOUT)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId)

        const lat = position.coords.latitude
        const lon = position.coords.longitude

        setLatitude(lat)
        setLongitude(lon)
        setPermission("granted")

        // Fetch location name asynchronously (don't block on this)
        fetchLocationName(lat, lon)
        setLoading(false)
      },
      (err) => {
        clearTimeout(timeoutId)
        setLoading(false)

        // Handle different error codes
        let errorMessage = "Unable to access your location."

        if (err.code === 1) {
          // PERMISSION_DENIED
          errorMessage = "📍 Permission Denied: Please enable location access in your browser settings and try again."
        } else if (err.code === 2) {
          // POSITION_UNAVAILABLE
          errorMessage = "📡 Position Unavailable: Your device cannot determine your location. Please ensure GPS/Location services are enabled."
        } else if (err.code === 3) {
          // TIMEOUT
          errorMessage = "⏱️ Request Timed Out: Location took too long to fetch. Please enable location services and try again."
        }

        setError(errorMessage)
        setPermission("denied")
      },
      {
        enableHighAccuracy: false,
        timeout: GEOLOCATION_TIMEOUT,
        maximumAge: 300000, // Cache location for 5 minutes
      }
    )
  }, [fetchLocationName])

  const clearError = useCallback(() => {
    setError("")
  }, [])

  return {
    latitude,
    longitude,
    locationName,
    loading,
    error,
    permission,
    requestLocation,
    clearError,
  }
}