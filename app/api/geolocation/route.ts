import { type NextRequest, NextResponse } from "next/server"

/**
 * Reverse Geocoding Proxy API
 * Converts latitude/longitude to location name via Nominatim
 * This endpoint solves CORS issues by proxying the request through the backend
 */

const NOMINATIM_TIMEOUT = 5000 // 5 seconds

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const lat = url.searchParams.get("lat")
    const lon = url.searchParams.get("lon")

    // Validate parameters
    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      )
    }

    // Validate they are valid numbers
    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)

    if (isNaN(latNum) || isNaN(lonNum)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude" },
        { status: 400 }
      )
    }

    // Validate ranges
    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return NextResponse.json(
        { error: "Latitude or longitude out of valid range" },
        { status: 400 }
      )
    }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lonNum}&zoom=10&addressdetails=1`,
        {
          signal: controller.signal,
          headers: {
            "User-Agent": "Samarpan-BloodDonation-App/1.0 (Node.js Backend)",
          },
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`Nominatim API error: ${response.status} ${response.statusText}`)
        return NextResponse.json(
          { locationName: "" },
          { status: 200 }
        )
      }

      const data = await response.json()
      const cityName =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        data.display_name?.split(",")[0] ||
        ""

      return NextResponse.json({
        locationName: cityName,
        address: data.address || {},
      })
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === "AbortError") {
        console.error("Nominatim request timeout")
      } else {
        console.error("Nominatim request error:", err)
      }
      // Return empty location name on error - don't fail the request
      return NextResponse.json({ locationName: "" }, { status: 200 })
    }
  } catch (error) {
    console.error("Geolocation API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}