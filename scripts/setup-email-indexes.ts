import { getDatabase } from "@/lib/mongodb"

async function setupEmailIndexes() {
  try {
    console.log("[Setup] Connecting to database...")
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    console.log("[Setup] Creating email index for case-insensitive unique constraint...")
    
    // Create case-insensitive unique index on email field
    await usersCollection.createIndex(
      { email: 1 },
      { 
        unique: true,
        collation: { locale: 'en', strength: 2 },
        name: 'email_unique_case_insensitive'
      }
    )

    console.log("[Setup] ✅ Email index created successfully")
    
    // Also create a sparse index for googleId to optimize queries
    await usersCollection.createIndex(
      { googleId: 1 },
      { sparse: true, name: 'googleId_sparse' }
    )
    
    console.log("[Setup] ✅ GoogleId index created successfully")
    console.log("[Setup] All indexes created successfully!")
    
  } catch (error) {
    console.error("[Setup] Error creating indexes:", error)
    
    // Check if the error is due to duplicate emails
    if (error instanceof Error && error.message.includes('E11000')) {
      console.error("[Setup] Duplicate emails found in database. Please clean up existing duplicates first.")
      console.error("[Setup] You can find duplicate emails with:")
      console.error(`[Setup] db.users.aggregate([
        { $group: { _id: { $toLower: "$email" }, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ])`)
    }
    
    process.exit(1)
  }
}

// Run the setup
setupEmailIndexes()
  .then(() => {
    console.log("[Setup] Email index setup completed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("[Setup] Setup failed:", error)
    process.exit(1)
  })