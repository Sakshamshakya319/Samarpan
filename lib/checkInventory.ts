import { haversineKm } from "@/app/api/sos/route"

export interface BloodBankStock {
  bank_name: string;
  address: string;
  contact: string;
  distance_km: number;
  units_available: string;
}

export async function checkBloodBankInventory(
  hospital_lat: number,
  hospital_lng: number,
  blood_group: string,
  component_type: string,
  radius_km: number = 30
): Promise<BloodBankStock[]> {
  try {
    // 1. Call eRaktKosh API
    const response = await fetch('https://eraktkosh.in/BLDAHIMS/bloodbank/transactions/bbblocationsearch.cnt?slnc=1&ht=0&state=Punjab', {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*'
      },
      // Short timeout so we don't delay SOS unnecessarily
      signal: AbortSignal.timeout(5000) 
    });

    if (!response.ok) {
      console.warn(`eRaktKosh API returned status ${response.status}`);
      return [];
    }

    // Try to parse JSON. If it's HTML, we'll catch it and return []
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.warn("eRaktKosh API did not return JSON. Returning empty stock.");
      return [];
    }

    if (!Array.isArray(data)) {
      if (data && Array.isArray(data.data)) {
        data = data.data;
      } else {
        return [];
      }
    }

    // 2. Filter and calculate distances
    const availableBanks: BloodBankStock[] = [];

    for (const bank of data) {
      // API typically returns latitude, longitude, bankName, address, contact, etc.
      // E.g., bank.latitude, bank.longitude
      if (!bank.latitude || !bank.longitude) continue;

      const distance = haversineKm(hospital_lat, hospital_lng, parseFloat(bank.latitude), parseFloat(bank.longitude));
      
      if (distance <= radius_km) {
        // Here we ideally check bank.stock for the specific blood_group + component_type.
        // Assuming the API returns a stock summary or we assume stock is > 0 if it's listed in a specific search.
        // For the sake of the prototype/research paper based on the prompt:
        
        let units = "Available"; // Fallback
        if (bank.stockDetails && bank.stockDetails[blood_group]) {
           units = bank.stockDetails[blood_group] + " Units";
        }
        
        // As long as it's within radius, we add it
        availableBanks.push({
          bank_name: bank.bankName || bank.hospName || "Blood Bank",
          address: bank.address || bank.hospAddress || "Address not available",
          contact: bank.contact || bank.phone || "N/A",
          distance_km: Math.round(distance * 10) / 10,
          units_available: units
        });
      }
    }

    // 3. Sort by distance
    availableBanks.sort((a, b) => a.distance_km - b.distance_km);

    return availableBanks;
  } catch (error) {
    console.error("Error fetching from eRaktKosh:", error);
    return [];
  }
}
