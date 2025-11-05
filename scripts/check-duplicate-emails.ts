import { getDatabase } from "@/lib/mongodb"

async function checkDuplicateEmails() {
  try {
    console.log("[Check] Connecting to database...")
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    console.log("[Check] Looking for duplicate emails...")
    
    // Find duplicate emails (case-insensitive)
    const duplicates = await usersCollection.aggregate([
      {
        $group: {
          _id: { $toLower: "$email" },
          count: { $sum: 1 },
          users: {
            $push: {
              _id: "$_id",
              name: "$name",
              email: "$email",
              googleId: "$googleId",
              createdAt: "$createdAt"
            }
          }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray()

    if (duplicates.length === 0) {
      console.log("[Check] ✅ No duplicate emails found!")
      return
    }

    console.log(`[Check] ⚠️  Found ${duplicates.length} sets of duplicate emails:`)
    
    duplicates.forEach((duplicate: any, index: number) => {
      console.log(`\n[Check] Duplicate Set ${index + 1}:`)
      console.log(`[Check] Email (lowercase): ${duplicate._id}`)
      console.log(`[Check] Count: ${duplicate.count}`)
      console.log("[Check] Users:")
      
      duplicate.users.forEach((user: any) => {
        console.log(`  - ID: ${user._id}`)
        console.log(`    Name: ${user.name}`)
        console.log(`    Email: ${user.email}`)
        console.log(`    Google ID: ${user.googleId || 'None'}`)
        console.log(`    Created: ${user.createdAt}`)
        console.log("")
      })
    })

    console.log("[Check] To fix these duplicates, you can:")
    console.log("[Check] 1. Merge accounts manually by keeping one and updating it with Google OAuth info")
    console.log("[Check] 2. Delete duplicate accounts (make sure to keep the one with more data)")
    console.log("[Check] 3. Run the merge script to automatically merge duplicate accounts")
    
  } catch (error) {
    console.error("[Check] Error checking duplicates:", error)
    process.exit(1)
  }
}

// Run the check
checkDuplicateEmails()
  .then(() => {
    console.log("[Check] Duplicate email check completed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("[Check] Check failed:", error)
    process.exit(1)
  })