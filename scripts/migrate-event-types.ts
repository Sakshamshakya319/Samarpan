import { connectToDatabase } from "../lib/mongodb"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config()

/**
 * Migration script to convert single eventType field to eventTypes array
 * This ensures backward compatibility while enabling multiple event type selection
 */

async function migrateEventTypes() {
  try {
    console.log("Starting event types migration...")
    
    const { db } = await connectToDatabase()
    const eventsCollection = db.collection("events")
    
    // Find all events that have eventType but not eventTypes
    const eventsToMigrate = await eventsCollection.find({
      eventType: { $exists: true },
      eventTypes: { $exists: false }
    }).toArray()
    
    console.log(`Found ${eventsToMigrate.length} events to migrate`)
    
    if (eventsToMigrate.length === 0) {
      console.log("No events need migration")
      return
    }
    
    // Update each event
    let migratedCount = 0
    for (const event of eventsToMigrate) {
      try {
        const result = await eventsCollection.updateOne(
          { _id: event._id },
          {
            $set: {
              eventTypes: [event.eventType || "donation_camp"]
            },
            $unset: {
              eventType: ""
            }
          }
        )
        
        if (result.modifiedCount > 0) {
          migratedCount++
          console.log(`✓ Migrated event: ${event.title} (${event.eventType} → [${event.eventType}])`)
        }
      } catch (error) {
        console.error(`✗ Failed to migrate event ${event._id}:`, error)
      }
    }
    
    console.log(`\nMigration completed: ${migratedCount}/${eventsToMigrate.length} events migrated`)
    
    // Verify migration
    const remainingOldFormat = await eventsCollection.countDocuments({
      eventType: { $exists: true },
      eventTypes: { $exists: false }
    })
    
    const newFormatCount = await eventsCollection.countDocuments({
      eventTypes: { $exists: true }
    })
    
    console.log(`\nVerification:`)
    console.log(`- Events with old format remaining: ${remainingOldFormat}`)
    console.log(`- Events with new format: ${newFormatCount}`)
    
    if (remainingOldFormat === 0) {
      console.log("✅ All events successfully migrated to new format!")
    } else {
      console.log("⚠️  Some events still use old format")
    }
    
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateEventTypes()
    .then(() => {
      console.log("Migration script completed")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Migration script failed:", error)
      process.exit(1)
    })
}

export { migrateEventTypes }