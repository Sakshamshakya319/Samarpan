import { getDatabase } from "@/lib/mongodb"

/**
 * Script to verify admins in the database
 * Usage: npx ts-node scripts/verify-admin.ts
 */
async function verifyAdmin() {
  try {
    console.log("🔍 Verifying admins in database...\n")

    const db = await getDatabase()
    const adminsCollection = db.collection("admins")

    // Get all admins
    const admins = await adminsCollection.find({}).toArray()

    if (admins.length === 0) {
      console.log("❌ No admins found in database!")
      return
    }

    console.log(`✅ Found ${admins.length} admin(s):\n`)

    admins.forEach((admin: any, index: number) => {
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

    // Check for specific admin ID if provided
    const args = process.argv.slice(2)
    if (args.length > 0) {
      const adminId = args[0]
      console.log(`\n🔍 Searching for admin ID: ${adminId}`)

      const { ObjectId } = require("mongodb")
      try {
        const id = new ObjectId(adminId)
        const specificAdmin = await adminsCollection.findOne({ _id: id })

        if (specificAdmin) {
          console.log(`✅ Found admin:`)
          console.log(`   📧 Email: ${specificAdmin.email}`)
          console.log(`   🔐 Role: ${specificAdmin.role}`)
        } else {
          console.log(`❌ Admin with ID ${adminId} not found`)
        }
      } catch (error) {
        console.error(`❌ Invalid ObjectId format: ${adminId}`)
      }
    }
  } catch (error) {
    console.error("❌ Error verifying admins:", error)
    process.exit(1)
  }
}

verifyAdmin().then(() => process.exit(0))