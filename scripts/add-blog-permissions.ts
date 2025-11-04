import { connectToDatabase } from "../lib/mongodb"
import * as readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer)
    })
  })
}

async function main() {
  try {
    console.log("\n=== Add Blog Permissions to Existing Admins ===\n")
    console.log("This script will add blog management permissions to regular admins.")
    console.log("It's useful if you created admins before blog permissions were available.\n")

    const proceed = await question("Do you want to continue? (yes/no): ")
    if (proceed.toLowerCase() !== "yes") {
      console.log("Cancelled.")
      rl.close()
      return
    }

    const { db } = await connectToDatabase()
    const adminsCollection = db.collection("admins")

    // Show current admins
    console.log("\n📋 Current Admins:")
    const allAdmins = await adminsCollection.find({}).toArray()
    allAdmins.forEach((admin: any, idx: number) => {
      console.log(`${idx + 1}. ${admin.name} (${admin.email}) - Role: ${admin.role}`)
      console.log(`   Permissions: ${(admin.permissions || []).join(", ") || "None"}`)
    })

    // Option 1: Add manage_blogs to all regular admins
    const option = await question(
      "\nWhat do you want to do?\n1. Add 'manage_blogs' to all regular admins\n2. Add 'manage_blogs' to specific admin\n3. Add specific permissions to admin\nEnter choice (1/2/3): ",
    )

    if (option === "1") {
      const result = await adminsCollection.updateMany(
        { role: "admin" },
        {
          $addToSet: { permissions: "manage_blogs" },
        },
      )

      console.log(`✅ Updated ${result.modifiedCount} admin(s) with 'manage_blogs' permission`)
    } else if (option === "2") {
      const emailInput = await question("Enter admin email: ")
      const admin = await adminsCollection.findOne({ email: emailInput })

      if (!admin) {
        console.log("❌ Admin not found")
        rl.close()
        return
      }

      console.log(`Found: ${admin.name} (${admin.email})`)
      const result = await adminsCollection.updateOne(
        { email: emailInput },
        {
          $addToSet: { permissions: "manage_blogs" },
        },
      )

      if (result.modifiedCount > 0) {
        console.log("✅ Added 'manage_blogs' permission")
      } else {
        console.log("✓ Admin already has 'manage_blogs' permission")
      }
    } else if (option === "3") {
      const emailInput = await question("Enter admin email: ")
      const admin = await adminsCollection.findOne({ email: emailInput })

      if (!admin) {
        console.log("❌ Admin not found")
        rl.close()
        return
      }

      console.log(`Found: ${admin.name} (${admin.email})`)
      console.log("Available permissions to add:")
      console.log("1. manage_users")
      console.log("2. view_users")
      console.log("3. manage_donations")
      console.log("4. view_donations")
      console.log("5. manage_blood_requests")
      console.log("6. view_blood_requests")
      console.log("7. manage_events")
      console.log("8. view_events")
      console.log("9. manage_transportation")
      console.log("10. view_transportation")
      console.log("11. generate_certificates")
      console.log("12. send_notifications")
      console.log("13. view_donation_images")
      console.log("14. view_contact_submissions")
      console.log("15. check_qr_codes")
      console.log("16. view_event_donors")
      console.log("17. manage_blogs")
      console.log("18. view_blogs")

      const permInput = await question("\nEnter permission numbers (comma-separated): ")
      const permMap: { [key: string]: string } = {
        "1": "manage_users",
        "2": "view_users",
        "3": "manage_donations",
        "4": "view_donations",
        "5": "manage_blood_requests",
        "6": "view_blood_requests",
        "7": "manage_events",
        "8": "view_events",
        "9": "manage_transportation",
        "10": "view_transportation",
        "11": "generate_certificates",
        "12": "send_notifications",
        "13": "view_donation_images",
        "14": "view_contact_submissions",
        "15": "check_qr_codes",
        "16": "view_event_donors",
        "17": "manage_blogs",
        "18": "view_blogs",
      }

      const permissions = permInput
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p in permMap)
        .map((p) => permMap[p])

      if (permissions.length === 0) {
        console.log("No valid permissions selected")
        rl.close()
        return
      }

      const result = await adminsCollection.updateOne(
        { email: emailInput },
        {
          $addToSet: { permissions: { $each: permissions } },
        },
      )

      console.log(`✅ Added ${permissions.length} permission(s)`)
      console.log(`Permissions: ${permissions.join(", ")}`)
    }

    console.log("\n✅ Done!")
    rl.close()
  } catch (error) {
    console.error("Error:", error)
    rl.close()
    process.exit(1)
  }
}

main()