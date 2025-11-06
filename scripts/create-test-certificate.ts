import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import crypto from "crypto"

async function createTestCertificate() {
  try {
    console.log("Creating test certificate...")

    const db = await getDatabase()

    const usersCollection = db.collection("users")
    const certificatesCollection = db.collection("certificates")

    let testUser = await usersCollection.findOne({ email: "test@example.com" })

    if (!testUser) {
      console.log("Creating test user...")
      const result = await usersCollection.insertOne({
        email: "test@example.com",
        name: "Test Donor",
        phone: "9876543210",
        bloodGroup: "O+",
        location: "Jalandhar",
        createdAt: new Date(),
        passwordHash: "hashed_password",
        isVerified: true,
        totalDonations: 0,
      })
      testUser = await usersCollection.findOne({ _id: result.insertedId })
    }

    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const verificationToken = crypto.randomBytes(16).toString("hex")

    console.log(`Certificate ID: ${certificateId}`)
    console.log(`Verification Token: ${verificationToken}`)

    const result = await certificatesCollection.insertOne({
      userId: testUser!._id,
      certificateId,
      verificationToken,
      donationCount: 5,
      issuedDate: new Date(),
      createdBy: new ObjectId("000000000000000000000000"),
      status: "active",
    })

    console.log("✅ Test certificate created successfully!")
    console.log(`Certificate MongoDB ID: ${result.insertedId}`)
    console.log(`User: ${testUser!.name} (${testUser!.email})`)
    console.log("\nUse these credentials to verify at /verify-certificate:")
    console.log(`  Certificate ID: ${certificateId}`)
    console.log(`  Verification Token: ${verificationToken}`)
  } catch (error) {
    console.error("Error creating test certificate:", error)
    process.exit(1)
  }
}

createTestCertificate()
  .then(() => {
    console.log("\nDone!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })
