import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URL

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URL environment variable")
}

let cachedClient: MongoClient | null = null
let cachedDb: any = null

export async function connectToDatabase() {
  // Check if cached connection is still valid
  if (cachedClient && cachedDb) {
    try {
      // Test the connection with a simple ping
      const admin = cachedClient.db("admin")
      await admin.command({ ping: 1 })
      return { client: cachedClient, db: cachedDb }
    } catch (error) {
      // Connection is stale, invalidate cache
      console.warn("Cached MongoDB connection is stale, reconnecting...")
      cachedClient = null
      cachedDb = null
    }
  }

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    retryWrites: true,
  })

  await client.connect()
  const db = client.db("samarpan")

  cachedClient = client
  cachedDb = db

  return { client, db }
}

export async function getDatabase() {
  const { db } = await connectToDatabase()
  return db
}
