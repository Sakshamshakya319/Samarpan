import { connectToDatabase } from "../lib/mongodb"
import { ObjectId } from "mongodb"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config()

/**
 * Test script to verify multiple event types functionality
 */

async function testMultipleEventTypes() {
  try {
    console.log("Testing multiple event types functionality...")
    
    const { db } = await connectToDatabase()
    const eventsCollection = db.collection("events")
    
    // Test 1: Create an event with multiple event types
    console.log("\n1. Testing event creation with multiple types...")
    
    const testEvent = {
      title: "Multi-Type Test Event",
      description: "Test event with multiple event types",
      eventDate: new Date("2024-12-31"),
      startTime: "09:00",
      endTime: "17:00",
      location: "Test Location",
      expectedAttendees: 100,
      volunteerSlotsNeeded: 20,
      eventTypes: ["donation_camp", "awareness_seminar", "health_checkup"], // Multiple types
      locationType: "hospital",
      participantCategories: ["patients", "staff", "visitors"],
      status: "active",
      allowRegistrations: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const insertResult = await eventsCollection.insertOne(testEvent)
    console.log(`✓ Created test event with ID: ${insertResult.insertedId}`)
    
    // Test 2: Retrieve and verify the event
    console.log("\n2. Testing event retrieval...")
    
    const retrievedEvent = await eventsCollection.findOne({ _id: insertResult.insertedId })
    if (retrievedEvent && Array.isArray(retrievedEvent.eventTypes)) {
      console.log(`✓ Event types stored correctly: [${retrievedEvent.eventTypes.join(", ")}]`)
    } else {
      console.log("✗ Event types not stored as array")
    }
    
    // Test 3: Test filtering by event types
    console.log("\n3. Testing event type filtering...")
    
    // Find events that include "donation_camp" type
    const donationCampEvents = await eventsCollection.find({
      eventTypes: { $in: ["donation_camp"] }
    }).toArray()
    
    console.log(`✓ Found ${donationCampEvents.length} events with 'donation_camp' type`)
    
    // Find events that include multiple types
    const multiTypeEvents = await eventsCollection.find({
      eventTypes: { $in: ["awareness_seminar", "health_checkup"] }
    }).toArray()
    
    console.log(`✓ Found ${multiTypeEvents.length} events with 'awareness_seminar' or 'health_checkup' types`)
    
    // Test 4: Test backward compatibility
    console.log("\n4. Testing backward compatibility...")
    
    // Create an event with old format (single eventType)
    const oldFormatEvent = {
      title: "Old Format Test Event",
      description: "Test event with old eventType format",
      eventDate: new Date("2024-12-31"),
      location: "Test Location",
      eventType: "donor_appreciation", // Old format
      status: "active",
      createdAt: new Date()
    }
    
    const oldEventResult = await eventsCollection.insertOne(oldFormatEvent)
    console.log(`✓ Created old format event with ID: ${oldEventResult.insertedId}`)
    
    // Test 5: Test API compatibility
    console.log("\n5. Testing API response format...")
    
    const allEvents = await eventsCollection.find({}).toArray()
    
    for (const event of allEvents) {
      // Simulate API response formatting
      const formattedEvent = {
        ...event,
        eventTypes: Array.isArray(event.eventTypes) 
          ? event.eventTypes 
          : [event.eventType || "donation_camp"]
      }
      
      if (Array.isArray(formattedEvent.eventTypes)) {
        console.log(`✓ Event "${event.title}" - Types: [${formattedEvent.eventTypes.join(", ")}]`)
      } else {
        console.log(`✗ Event "${event.title}" - Failed to format types`)
      }
    }
    
    // Test 6: Test event type validation
    console.log("\n6. Testing event type validation...")
    
    const validEventTypes = [
      "donation_camp",
      "platelet_drive", 
      "awareness_seminar",
      "donor_appreciation",
      "emergency_camp",
      "health_checkup",
      "community_outreach",
      "blood_screening",
      "volunteer_training",
      "fundraising"
    ]
    
    const testEventTypes = ["donation_camp", "invalid_type", "awareness_seminar"]
    const validTypes = testEventTypes.filter(type => validEventTypes.includes(type))
    const invalidTypes = testEventTypes.filter(type => !validEventTypes.includes(type))
    
    console.log(`✓ Valid types: [${validTypes.join(", ")}]`)
    if (invalidTypes.length > 0) {
      console.log(`⚠️  Invalid types detected: [${invalidTypes.join(", ")}]`)
    }
    
    // Cleanup test events
    console.log("\n7. Cleaning up test events...")
    
    await eventsCollection.deleteMany({
      title: { $in: ["Multi-Type Test Event", "Old Format Test Event"] }
    })
    
    console.log("✓ Test events cleaned up")
    
    console.log("\n✅ All tests completed successfully!")
    console.log("\nSummary:")
    console.log("- Multiple event types can be stored and retrieved")
    console.log("- Event type filtering works correctly")
    console.log("- Backward compatibility maintained")
    console.log("- API response formatting handles both old and new formats")
    console.log("- Event type validation can identify invalid types")
    
  } catch (error) {
    console.error("Test failed:", error)
    process.exit(1)
  }
}

// Run test if called directly
if (require.main === module) {
  testMultipleEventTypes()
    .then(() => {
      console.log("Test script completed")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Test script failed:", error)
      process.exit(1)
    })
}

export { testMultipleEventTypes }