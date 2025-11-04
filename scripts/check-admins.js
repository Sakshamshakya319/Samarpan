const { MongoClient } = require("mongodb")

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/samarpan"

async function checkAdmins() {
  const client = new MongoClient(MONGODB_URL)

  try {
    console.log("🔍 Connecting to MongoDB...\n")
    await client.connect()

    const db = client.db()
    const adminsCollection = db.collection("admins")

    // Get all admins
    const admins = await adminsCollection.find({}).toArray()

    if (admins.length === 0) {
      console.log("❌ No admins found in database!")
      return
    }

    console.log(`✅ Found ${admins.length} admin(s):\n`)

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Admin Details:`)
      console.log(`   📧 Email: ${admin.email}`)
      console.log(`   🆔 ID: ${admin._id}`)
      console.log(`   👤 Name: ${admin.name}`)
      console.log(`   🔐 Role: ${admin.role}`)
      console.log(`   ✅ Status: ${admin.status}`)
      console.log(`   🛡️  Permissions: ${(admin.permissions || []).join(", ") || "none"}`)
      console.log(`   📅 Created: ${admin.createdAt}`)
      console.log("")
    })
  } catch (error) {
    console.error("❌ Error:", error.message)
  } finally {
    await client.close()
  }
}

checkAdmins()