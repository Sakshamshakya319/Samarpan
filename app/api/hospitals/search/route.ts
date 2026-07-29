import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  
  if (q.length < 3) {
    return NextResponse.json({ hospitals: [] })
  }

  try {
    const db = await getDatabase()
    const hospitalsCollection = db.collection("hospitals")
    
    // Simple case-insensitive search by name
    const hospitals = await hospitalsCollection
      .find({ name: { $regex: q, $options: 'i' } })
      .limit(10)
      .toArray()
      
    return NextResponse.json({ hospitals })
  } catch (error) {
    console.error("Error searching hospitals:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
