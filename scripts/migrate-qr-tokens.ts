import dotenv from "dotenv"
import path from "path"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Load .env.local for development
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

// Generate a unique QR code token
function generateQRToken(): string {
  return `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

async function migrateQRTokens() {
  try {
    const db = await getDatabase()
    const registrationsCollection = db.collection("event_registrations")

    // Find all registrations without qrToken
    const registrationsWithoutQR = await registrationsCollection
      .find({
        $or: [
          { qrToken: { $exists: false } },
          { qrToken: null },
          { qrToken: "" }
        ]
      })
      .toArray()

    console.log(`Found ${registrationsWithoutQR.length} registrations without QR tokens`)

    if (registrationsWithoutQR.length === 0) {
      console.log("✅ All registrations have QR tokens. No migration needed.")
      process.exit(0)
    }

    let updated = 0
    for (const reg of registrationsWithoutQR) {
      const newQrToken = generateQRToken()
      const result = await registrationsCollection.updateOne(
        { _id: reg._id },
        {
          $set: {
            qrToken: newQrToken,
            qrVerified: false,
            updatedAt: new Date(),
          }
        }
      )

      if (result.modifiedCount > 0) {
        updated++
        console.log(
          `✅ Updated registration ${reg._id} with QR token: ${newQrToken}`
        )
      }
    }

    console.log(`\n🎉 Migration complete! Updated ${updated} registrations.`)
    process.exit(0)
  } catch (error) {
    console.error("❌ Migration error:", error)
    process.exit(1)
  }
}

migrateQRTokens()