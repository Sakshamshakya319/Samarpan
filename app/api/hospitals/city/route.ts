import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
    
    const db = await getDatabase()
    const hospitalsCollection = db.collection("hospitals")
    
    if (city) {
      // Fetch all hospitals for a specific city
      const hospitals = await hospitalsCollection.find({ 
        city: { $regex: new RegExp(`^${city}$`, 'i') } 
      }).limit(50).toArray()
      
      return NextResponse.json({ hospitals })
    } else {
      // Fetch list of unique cities
      const cities = await hospitalsCollection.distinct("city")
      return NextResponse.json({ cities: cities.filter(Boolean).sort() })
    }
  } catch (error) {
    console.error("[API_HOSPITALS_CITY]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
