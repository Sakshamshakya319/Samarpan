import { type NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ hospitals: [] })
    }

    const db = await getDatabase()
    const hospitalsCollection = db.collection('hospitals')

    // Perform a text search or regex search
    // Since we created text indexes on hospitalName, city, district, state, we can use $text
    // However, for partial word matches (autocomplete), regex is often better than $text
    const regex = new RegExp(query, 'i')

    const hospitals = await hospitalsCollection
      .find({
        $or: [
          { hospitalName: { $regex: regex } },
          { city: { $regex: regex } },
          { district: { $regex: regex } }
        ]
      })
      .project({
        hospitalId: 1,
        hospitalName: 1,
        address: 1,
        city: 1,
        district: 1,
        state: 1,
        latitude: 1,
        longitude: 1,
        _id: 0
      })
      .limit(15)
      .toArray()

    return NextResponse.json({ hospitals }, { status: 200 })
  } catch (error) {
    console.error('[API_HOSPITALS_SEARCH]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
