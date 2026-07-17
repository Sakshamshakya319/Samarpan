import { type NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latStr = searchParams.get('latitude')
    const lngStr = searchParams.get('longitude')
    const radiusStr = searchParams.get('radius')

    if (!latStr || !lngStr) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
    }

    const latitude = parseFloat(latStr)
    const longitude = parseFloat(lngStr)
    const radiusInKm = radiusStr ? parseFloat(radiusStr) : 20
    const radiusInMeters = radiusInKm * 1000

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    const db = await getDatabase()
    const hospitalsCollection = db.collection('hospitals')

    const hospitals = await hospitalsCollection.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          distanceField: "distance",
          maxDistance: radiusInMeters,
          spherical: true
        }
      },
      { $limit: 20 },
      {
        $project: {
          hospitalId: 1,
          hospitalName: 1,
          address: 1,
          city: 1,
          district: 1,
          state: 1,
          latitude: 1,
          longitude: 1,
          distance: 1,
          _id: 0
        }
      }
    ]).toArray()

    return NextResponse.json({ hospitals }, { status: 200 })
  } catch (error) {
    console.error('[API_HOSPITALS_NEARBY]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
