const { MongoClient } = require("mongodb")
const bcrypt = require("bcryptjs")

const MONGODB_URL = process.env.MONGODB_URL
const DEFAULT_EMAIL = "admin@samarpan.com"
const DEFAULT_PASSWORD = "Admin@123"
const DEFAULT_NAME = "Samarpan Admin"

if (!MONGODB_URL) {
  console.error("❌ MONGODB_URL environment variable is not set")
  process.exit(1)
}

async function createSuperAdmin() {
  const client = new MongoClient(MONGODB_URL)

  try {
    console.log("🔍 Connecting to MongoDB...\n")
    await client.connect()

    const db = client.db()
    const adminsCollection = db.collection("admins")

    // Check if admin already exists
    const existingAdmin = await adminsCollection.findOne({ email: DEFAULT_EMAIL })
    if (existingAdmin) {
      console.log(`⚠️  Admin with email ${DEFAULT_EMAIL} already exists!`)
      console.log(`   ID: ${existingAdmin._id}`)
      console.log(`   Role: ${existingAdmin.role}`)
      return
    }

    // Hash password
    console.log("🔐 Hashing password...")
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt)

    // Create admin document
    const adminDoc = {
      email: DEFAULT_EMAIL,
      password: hashedPassword,
      name: DEFAULT_NAME,
      role: "superadmin",
      permissions: [], // Superadmin has all permissions
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Insert into database
    console.log("📝 Creating superadmin...")
    const result = await adminsCollection.insertOne(adminDoc)

    console.log("\n✅ Superadmin created successfully!")
    console.log(`📧 Email: ${DEFAULT_EMAIL}`)
    console.log(`🔐 Password: ${DEFAULT_PASSWORD}`)
    console.log(`🆔 Admin ID: ${result.insertedId}`)
  } catch (error) {
    console.error("❌ Error creating superadmin:", error.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

createSuperAdmin()