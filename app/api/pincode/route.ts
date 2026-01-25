import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pincode = searchParams.get('pincode')

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json({ error: "Valid 6-digit pincode is required" }, { status: 400 })
    }

    // Call Indian Post API
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
    const data = await response.json()

    if (!response.ok || !data || data.length === 0) {
      return NextResponse.json({ error: "Failed to fetch pincode data" }, { status: 500 })
    }

    const result = data[0]

    if (result.Status !== "Success" || !result.PostOffice || result.PostOffice.length === 0) {
      return NextResponse.json({ error: "Invalid pincode" }, { status: 404 })
    }

    // Get the first post office data (usually the main one)
    const postOffice = result.PostOffice[0]

    return NextResponse.json({
      pincode: postOffice.Pincode,
      city: postOffice.District,
      state: postOffice.State,
      area: postOffice.Name,
      division: postOffice.Division,
      region: postOffice.Region
    }, { status: 200 })

  } catch (error) {
    console.error("Pincode API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}