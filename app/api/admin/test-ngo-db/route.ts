import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || !["admin", "superadmin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const db = await getDatabase()
    
    // List all collections
    const collections = await db.listCollections().toArray()
    console.log('Available collections:', collections.map(c => c.name))
    
    // Check NGO collection specifically
    const ngosCollection = db.collection("ngos")
    const ngoCount = await ngosCollection.countDocuments()
    console.log('NGO documents count:', ngoCount)
    
    // Get sample NGO documents
    const sampleNgos = await ngosCollection.find({}).limit(5).toArray()
    console.log('Sample NGOs:', sampleNgos.map(ngo => ({ 
      id: ngo._id, 
      name: ngo.ngoName, 
      status: ngo.status,
      createdAt: ngo.createdAt 
    })))

    return NextResponse.json({ 
      collections: collections.map(c => c.name),
      ngoCount,
      sampleNgos: sampleNgos.map(ngo => ({ 
        id: ngo._id, 
        name: ngo.ngoName, 
        status: ngo.status,
        createdAt: ngo.createdAt 
      }))
    }, { status: 200 })

  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json({ error: "Database connection failed", details: error }, { status: 500 })
  }
}