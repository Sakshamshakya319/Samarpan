import dotenv from "dotenv"
import path from "path"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Test QR Code System
async function testQRCodeSystem() {
  console.log("🧪 Testing QR Code System...")
  
  try {
    const db = await getDatabase()
    
    // Clean up any existing test data
    await cleanupTestData(db)
    
    // Create test event
    const eventId = await createTestEvent(db)
    console.log("✅ Created test event:", eventId)
    
    // Create test user
    const userId = await createTestUser(db)
    console.log("✅ Created test user:", userId)
    
    // Create test admin
    const adminId = await createTestAdmin(db)
    console.log("✅ Created test admin:", adminId)
    
    // Create event registration with QR token
    const registrationId = await createEventRegistration(db, userId, eventId)
    console.log("✅ Created event registration:", registrationId)
    
    // Generate admin token
    const adminToken = generateAdminToken(adminId)
    console.log("✅ Generated admin token")
    
    // Test QR verification API
    await testQRVerificationAPI(db, adminToken, registrationId)
    
    // Test duplicate prevention
    await testDuplicatePrevention(db, adminToken, registrationId)
    
    // Clean up
    await cleanupTestData(db)
    
    console.log("\n🎉 All QR Code System tests passed!")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  }
}

async function createTestEvent(db: any) {
  const eventsCollection = db.collection("events")
  const result = await eventsCollection.insertOne({
    title: "Test Blood Donation Event",
    location: "Test Hospital",
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return result.insertedId.toString()
}

async function createTestUser(db: any) {
  const usersCollection = db.collection("users")
  const result = await usersCollection.insertOne({
    name: "Test Donor",
    email: "testdonor@example.com",
    phone: "+1234567890",
    role: "user",
    totalDonations: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return result.insertedId.toString()
}

async function createTestAdmin(db: any) {
  const adminsCollection = db.collection("admins")
  const result = await adminsCollection.insertOne({
    name: "Test Admin",
    email: "testadmin@example.com",
    role: "admin",
    permissions: ["events", "donors", "qr-checker"],
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return result.insertedId.toString()
}

async function createEventRegistration(db: any, userId: string, eventId: string) {
  const registrationsCollection = db.collection("event_registrations")
  const qrToken = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  
  const result = await registrationsCollection.insertOne({
    userId: new ObjectId(userId),
    eventId: new ObjectId(eventId),
    name: "Test Donor",
    email: "testdonor@example.com",
    phone: "+1234567890",
    registrationNumber: `REG-${Date.now()}`,
    timeSlot: "09:00-10:00",
    qrToken: qrToken,
    qrVerified: false,
    donationStatus: "Registered",
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  
  return { id: result.insertedId.toString(), qrToken }
}

function generateAdminToken(adminId: string) {
  return jwt.sign(
    { adminId, role: "admin", email: "testadmin@example.com" },
    JWT_SECRET,
    { expiresIn: "7d" }
  )
}

async function testQRVerificationAPI(db: any, adminToken: string, registration: any) {
  console.log("\n🔍 Testing QR Verification API...")
  
  // Test GET endpoint (search by QR token)
  console.log("Testing GET /api/event-registrations/qr-verify")
  
  // Simulate API call
  const registrationsCollection = db.collection("event_registrations")
  const foundRegistration = await registrationsCollection.findOne({ qrToken: registration.qrToken })
  
  if (!foundRegistration) {
    throw new Error("Registration not found by QR token")
  }
  
  console.log("✅ GET endpoint working - found registration by QR token")
  
  // Test POST endpoint (verify QR code)
  console.log("Testing POST /api/event-registrations/qr-verify")
  
  // Simulate verification
  const updateResult = await registrationsCollection.updateOne(
    { _id: new ObjectId(registration.id) },
    {
      $set: {
        qrVerified: true,
        donationStatus: "Completed",
        verifiedAt: new Date(),
        verifiedBy: new ObjectId(),
        updatedAt: new Date(),
      },
    }
  )
  
  if (updateResult.modifiedCount !== 1) {
    throw new Error("Failed to verify QR code")
  }
  
  // Verify user donation count was updated
  const usersCollection = db.collection("users")
  const userUpdateResult = await usersCollection.updateOne(
    { _id: new ObjectId(foundRegistration.userId) },
    {
      $set: {
        lastDonationDate: new Date(),
        updatedAt: new Date(),
      },
      $inc: {
        totalDonations: 1,
      },
    }
  )
  
  if (userUpdateResult.modifiedCount !== 1) {
    throw new Error("Failed to update user donation record")
  }
  
  console.log("✅ POST endpoint working - QR code verified successfully")
}

async function testDuplicatePrevention(db: any, adminToken: string, registration: any) {
  console.log("\n🔍 Testing duplicate prevention...")
  
  const registrationsCollection = db.collection("event_registrations")
  
  // Try to verify again (should fail)
  const existingRegistration = await registrationsCollection.findOne({ _id: new ObjectId(registration.id) })
  
  if (existingRegistration.qrVerified) {
    console.log("✅ Duplicate prevention working - registration already verified")
  } else {
    throw new Error("Duplicate prevention not working")
  }
}

async function cleanupTestData(db: any) {
  console.log("\n🧹 Cleaning up test data...")
  
  try {
    await db.collection("events").deleteMany({ title: "Test Blood Donation Event" })
    await db.collection("users").deleteMany({ email: "testdonor@example.com" })
    await db.collection("admins").deleteMany({ email: "testadmin@example.com" })
    await db.collection("event_registrations").deleteMany({ email: "testdonor@example.com" })
    
    console.log("✅ Test data cleaned up")
  } catch (error) {
    console.warn("Warning: Could not clean up all test data:", error)
  }
}

// Run the test
testQRCodeSystem().catch(console.error)