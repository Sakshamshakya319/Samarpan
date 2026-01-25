import type { PincodeResponse } from './models/ngo'

export async function fetchLocationByPincode(pincode: string): Promise<{ city: string; state: string } | null> {
  try {
    // Indian Post API
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
    const data: PincodeResponse[] = await response.json()
    
    if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
      const postOffice = data[0].PostOffice[0]
      return {
        city: postOffice.District,
        state: postOffice.State
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching pincode data:', error)
    return null
  }
}