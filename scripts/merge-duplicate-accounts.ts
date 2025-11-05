import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

async function mergeDuplicateAccounts() {
  try {
    console.log("[Merge] Connecting to database...")
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    console.log("[Merge] Finding duplicate emails...")
    
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
              password: "$password",
              googleId: "$googleId",
              oauthProvider: "$oauthProvider",
              avatar: "$avatar",
              bloodGroup: "$bloodGroup",
              location: "$location",
              phone: "$phone",
              role: "$role",
              createdAt: "$createdAt",
              updatedAt: "$updatedAt",
              lastDonationDate: "$lastDonationDate",
              totalDonations: "$totalDonations",
              hasDisease: "$hasDisease",
              diseaseDescription: "$diseaseDescription"
            }
          }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray()

    if (duplicates.length === 0) {
      console.log("[Merge] ✅ No duplicate emails found!")
      return
    }

    console.log(`[Merge] Found ${duplicates.length} sets of duplicate emails to merge`)
    
    for (const duplicate of duplicates) {
      const users = duplicate.users
      console.log(`\n[Merge] Processing duplicate set for email: ${duplicate._id}`)
      console.log(`[Merge] Found ${users.length} accounts`)
      
      // Find the primary account (prefer the one with password, then the oldest)
      let primaryAccount = users.find((user: any) => user.password)
      if (!primaryAccount) {
        primaryAccount = users.reduce((oldest: any, current: any) => 
          new Date(oldest.createdAt) < new Date(current.createdAt) ? oldest : current
        )
      }
      
      console.log(`[Merge] Primary account selected: ${primaryAccount._id} (created: ${primaryAccount.createdAt})`)
      
      // Merge data from other accounts into primary
      const accountsToMerge = users.filter((user: any) => user._id !== primaryAccount._id)
      
      let mergeData: any = {}
      let hasGoogleAccount = false
      
      for (const account of accountsToMerge) {
        console.log(`[Merge] Merging data from account: ${account._id}`)
        
        // Merge Google OAuth data if this account has it
        if (account.googleId && !hasGoogleAccount) {
          mergeData.googleId = account.googleId
          mergeData.oauthProvider = account.oauthProvider || "google"
          hasGoogleAccount = true
          console.log(`[Merge] - Added Google OAuth data: ${account.googleId}`)
        }
        
        // Merge avatar if primary doesn't have one
        if (account.avatar && !primaryAccount.avatar) {
          mergeData.avatar = account.avatar
          console.log(`[Merge] - Added avatar`)
        }
        
        // Merge other fields if primary doesn't have them
        if (account.bloodGroup && !primaryAccount.bloodGroup) {
          mergeData.bloodGroup = account.bloodGroup
          console.log(`[Merge] - Added blood group: ${account.bloodGroup}`)
        }
        
        if (account.location && !primaryAccount.location) {
          mergeData.location = account.location
          console.log(`[Merge] - Added location: ${account.location}`)
        }
        
        if (account.phone && !primaryAccount.phone) {
          mergeData.phone = account.phone
          console.log(`[Merge] - Added phone: ${account.phone}`)
        }
        
        if (account.lastDonationDate && !primaryAccount.lastDonationDate) {
          mergeData.lastDonationDate = account.lastDonationDate
          console.log(`[Merge] - Added last donation date`)
        }
        
        if (account.totalDonations && account.totalDonations > (primaryAccount.totalDonations || 0)) {
          mergeData.totalDonations = account.totalDonations
          console.log(`[Merge] - Updated total donations: ${account.totalDonations}`)
        }
        
        if (account.hasDisease && !primaryAccount.hasDisease) {
          mergeData.hasDisease = account.hasDisease
          mergeData.diseaseDescription = account.diseaseDescription
          console.log(`[Merge] - Added disease information`)
        }
      }
      
      // Update the primary account with merged data
      if (Object.keys(mergeData).length > 0) {
        mergeData.updatedAt = new Date()
        
        console.log(`[Merge] Updating primary account with merged data...`)
        const updateResult = await usersCollection.updateOne(
          { _id: new ObjectId(primaryAccount._id) },
          { $set: mergeData }
        )
        
        if (updateResult.modifiedCount === 1) {
          console.log(`[Merge] ✅ Primary account updated successfully`)
        } else {
          console.error(`[Merge] ❌ Failed to update primary account`)
          continue
        }
      }
      
      // Delete the merged accounts
      console.log(`[Merge] Deleting ${accountsToMerge.length} merged accounts...`)
      const deleteResult = await usersCollection.deleteMany({
        _id: { $in: accountsToMerge.map((acc: any) => new ObjectId(acc._id)) }
      })
      
      console.log(`[Merge] ✅ Deleted ${deleteResult.deletedCount} accounts`)
      console.log(`[Merge] ✅ Successfully merged ${users.length} accounts into one`)
    }
    
    console.log("[Merge] ✅ All duplicate accounts merged successfully!")
    
  } catch (error) {
    console.error("[Merge] Error merging accounts:", error)
    process.exit(1)
  }
}

// Run the merge
mergeDuplicateAccounts()
  .then(() => {
    console.log("[Merge] Account merge completed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("[Merge] Merge failed:", error)
    process.exit(1)
  })