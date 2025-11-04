import { connectToDatabase } from "../lib/mongodb"

/**
 * AUTO-MIGRATION SCRIPT
 * This script automatically grants blog permissions to all regular admins
 * who don't already have them. Run this once after deploying the blog feature.
 *
 * Usage: npm run migrate:blogs
 */

async function main() {
  try {
    console.log("\n🔄 === Blog Permissions Auto-Migration ===\n")

    const { db } = await connectToDatabase()
    const adminsCollection = db.collection("admins")

    // Step 1: Count current admins
    const totalAdmins = await adminsCollection.countDocuments({})
    console.log(`📊 Total admins in database: ${totalAdmins}`)

    // Step 2: Add manage_blogs to all regular admins who don't have it
    console.log("\n⏳ Adding 'manage_blogs' permission to regular admins...")
    const regularAdminsResult = await adminsCollection.updateMany(
      { role: "admin" },
      { $addToSet: { permissions: "manage_blogs" } },
    )

    console.log(`✅ Regular admins updated: ${regularAdminsResult.modifiedCount}`)

    // Step 3: Verify superadmins have all permissions
    console.log("\n⏳ Verifying superadmin permissions...")
    const superadmins = await adminsCollection
      .find({ role: "superadmin" })
      .toArray()

    console.log(`✅ Superadmins found: ${superadmins.length}`)

    // Step 4: Show current state
    console.log("\n📋 === Final Status ===\n")
    const allAdmins = await adminsCollection.find({}).toArray()

    let adminsWithBlogAccess = 0
    allAdmins.forEach((admin: any) => {
      const hasBlogPermission =
        admin.role === "superadmin" ||
        (admin.permissions && admin.permissions.includes("manage_blogs"))
      if (hasBlogPermission) {
        adminsWithBlogAccess++
        console.log(`✅ ${admin.name} (${admin.email}) - Blog access: GRANTED`)
      } else {
        console.log(`⚠️  ${admin.name} (${admin.email}) - Blog access: MISSING`)
      }
    })

    console.log(
      `\n✨ Migration complete! ${adminsWithBlogAccess}/${totalAdmins} admins have blog access`,
    )

    if (adminsWithBlogAccess === totalAdmins) {
      console.log(
        "\n✅ All admins can now create, edit, and publish blogs!",
      )
    } else {
      console.log(
        "\n⚠️  Some admins still don't have blog permissions. Use 'npm run add-blog-perms' to fix specific admins.",
      )
    }
  } catch (error) {
    console.error("❌ Migration error:", error)
    process.exit(1)
  }
}

main()