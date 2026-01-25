import { connectToDatabase } from "../lib/mongodb"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config()

/**
 * Test script to verify NGO events are properly created and can be fetched by admin APIs
 */

async function testNgoEventsFetch() {
  try {
    console.log("Testing NGO events fetch functionality...")
    
    const { db } = await connectToDatabase()
    const eventsCollection = db.collection("events")
    
    // Test 1: Check existing NGO events
    console.log("\n1. Checking existing NGO events...")
    
    const ngoEvents = await eventsCollection.find({
      ngoId: { $exists: true }
    }).toArray()
    
    console.log(`✓ Found ${ngoEvents.length} NGO events in database`)
    
    if (ngoEvents.length > 0) {
      console.log("NGO Events:")
      ngoEvents.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title}`)
        console.log(`     - Status: ${event.status}`)
        console.log(`     - NGO: ${event.ngoName}`)
        console.log(`     - Event Types: ${Array.isArray(event.eventTypes) ? event.eventTypes.join(", ") : event.eventType || "N/A"}`)
        console.log(`     - Created: ${event.createdAt}`)
      })
    }
    
    // Test 2: Check all events (admin + NGO)
    console.log("\n2. Checking all events...")
    
    const allEvents = await eventsCollection.find({}).toArray()
    
    console.log(`✓ Found ${allEvents.length} total events in database`)
    
    const adminEvents = allEvents.filter(event => !event.ngoId)
    const ngoEventsFromAll = allEvents.filter(event => event.ngoId)
    
    console.log(`   - Admin created events: ${adminEvents.length}`)
    console.log(`   - NGO created events: ${ngoEventsFromAll.length}`)
    
    // Test 3: Verify event types format
    console.log("\n3. Verifying event types format...")
    
    let eventsWithOldFormat = 0
    let eventsWithNewFormat = 0
    
    for (const event of allEvents) {
      if (Array.isArray(event.eventTypes)) {
        eventsWithNewFormat++
      } else if (event.eventType) {
        eventsWithOldFormat++
        console.log(`   ⚠️  Event "${event.title}" still uses old eventType format: ${event.eventType}`)
      }
    }
    
    console.log(`✓ Events with new format (eventTypes array): ${eventsWithNewFormat}`)
    console.log(`✓ Events with old format (eventType string): ${eventsWithOldFormat}`)
    
    // Test 4: Test API query patterns
    console.log("\n4. Testing API query patterns...")
    
    // Test NGO events by status
    const pendingNgoEvents = await eventsCollection.find({
      ngoId: { $exists: true },
      status: "pending_approval"
    }).toArray()
    
    const activeNgoEvents = await eventsCollection.find({
      ngoId: { $exists: true },
      status: "active"
    }).toArray()
    
    console.log(`✓ Pending NGO events: ${pendingNgoEvents.length}`)
    console.log(`✓ Active NGO events: ${activeNgoEvents.length}`)
    
    // Test all events by status
    const allActiveEvents = await eventsCollection.find({
      status: "active"
    }).toArray()
    
    console.log(`✓ All active events (admin + NGO): ${allActiveEvents.length}`)
    
    // Test 5: Verify event structure for API compatibility
    console.log("\n5. Verifying event structure for API compatibility...")
    
    if (allEvents.length > 0) {
      const sampleEvent = allEvents[0]
      const requiredFields = ['title', 'description', 'eventDate', 'location', 'status', 'createdAt']
      const missingFields = requiredFields.filter(field => !sampleEvent[field])
      
      if (missingFields.length === 0) {
        console.log("✓ All required fields present in events")
      } else {
        console.log(`⚠️  Missing fields in events: ${missingFields.join(", ")}`)
      }
      
      // Check event types field
      if (Array.isArray(sampleEvent.eventTypes)) {
        console.log("✓ Event types field is properly formatted as array")
      } else if (sampleEvent.eventType) {
        console.log("⚠️  Event uses old eventType format - should be migrated")
      } else {
        console.log("⚠️  No event type information found")
      }
    }
    
    console.log("\n✅ NGO events fetch test completed!")
    console.log("\nSummary:")
    console.log(`- Total events: ${allEvents.length}`)
    console.log(`- NGO events: ${ngoEventsFromAll.length}`)
    console.log(`- Admin events: ${adminEvents.length}`)
    console.log(`- Events with new format: ${eventsWithNewFormat}`)
    console.log(`- Events with old format: ${eventsWithOldFormat}`)
    
    if (ngoEventsFromAll.length === 0) {
      console.log("\n⚠️  No NGO events found. This could mean:")
      console.log("   1. No NGOs have created events yet")
      console.log("   2. NGO events are not being saved properly")
      console.log("   3. Database connection issues")
    }
    
  } catch (error) {
    console.error("Test failed:", error)
    process.exit(1)
  }
}

// Run test if called directly
if (require.main === module) {
  testNgoEventsFetch()
    .then(() => {
      console.log("Test script completed")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Test script failed:", error)
      process.exit(1)
    })
}

export { testNgoEventsFetch }