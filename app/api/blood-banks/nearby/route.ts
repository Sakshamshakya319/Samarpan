import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  return NextResponse.json({
    available: false,
    message: 'Please contact your nearest government blood bank directly.',
    contacts: [
      { city: 'Jalandhar', name: 'Civil Hospital Blood Bank', phone: '0181-2224821' },
      { city: 'Ludhiana',  name: 'DMCH Blood Bank',          phone: '0161-2302477' },
      { city: 'Amritsar',  name: 'GMCH Blood Bank',          phone: '0183-2401084' },
      { city: 'Chandigarh',name: 'PGIMER Blood Bank',        phone: '0172-2756545' },
      { city: 'Patiala',   name: 'Rajindra Hospital BB',     phone: '0175-2211401' },
    ]
  })
}
