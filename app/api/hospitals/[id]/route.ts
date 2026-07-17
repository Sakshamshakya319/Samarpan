import { type NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: 'Hospital ID is required' }, { status: 400 })
    }

    const db = await getDatabase()
    const hospitalsCollection = db.collection('hospitals')

    const hospital = await hospitalsCollection.findOne({ hospitalId: id })

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    // Generate URLs
    const osmUrl = `https://www.openstreetmap.org/?mlat=${hospital.latitude}&mlon=${hospital.longitude}#map=18/${hospital.latitude}/${hospital.longitude}`
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${hospital.latitude},${hospital.longitude}`

    const responseData = {
      ...hospital,
      osmUrl,
      googleUrl
    }

    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error('[API_HOSPITALS_GET]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
