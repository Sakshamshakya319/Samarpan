import { config } from "dotenv"
import { resolve } from "path"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

// Load environment variables from root .env file
config({ path: resolve(__dirname, "..", ".env") })

const MONGODB_URI = process.env.MONGODB_URL

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URL environment variable")
}

async function createAdmin() {
  const client = new MongoClient(MONGODB_URI as string)

  try {
    await client.connect()
    const db = client.db("samarpan")
    const adminsCollection = db.collection("admins")

    // Check if admin already exists
    const existingAdmin = await adminsCollection.findOne({ email: "admin@samarpan.com" })
    if (existingAdmin) {
      console.log("Admin already exists")
      return
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash("admin@123", salt)

    // Create admin
    const result = await adminsCollection.insertOne({
      email: "admin@samarpan.com",
      password: hashedPassword,
      name: "Admin",
      role: "admin",
      createdAt: new Date(),
    })

    console.log("Admin created successfully!")
    console.log("Email: admin@samarpan.com")
    console.log("Password: admin@123")
    console.log("Admin ID:", result.insertedId)
  } finally {
    await client.close()
  }
}

createAdmin().catch(console.error)
