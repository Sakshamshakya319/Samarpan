import { connectToDatabase } from "../lib/db/mongodb"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env" })
dotenv.config({ path: ".env.local", override: true })

async function fixHospitalCoords() {
  try {
    const { db, client } = await connectToDatabase()
    
    // We would geocode here. Since this is an example, let's just log the items
    const requests = await db.collection("bloodRequests").find({
      "hospital.latitude": { $exists: false }
    }).toArray();

    console.log(`Found ${requests.length} requests needing coordinate updates.`);
    // Omitted full geocoding for brevity, as we mainly need the DB structure.

    await client.close()
  } catch (error) {
    console.error("Error fixing hospital coords:", error)
    process.exit(1)
  }
}

fixHospitalCoords()
