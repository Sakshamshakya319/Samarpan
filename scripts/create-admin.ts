import { connectToDatabase } from "../lib/mongodb"
import { hashPassword } from "../lib/auth"
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
    console.log("\n=== Samarpan Admin Setup ===\n")

    // Check if this is superadmin or regular admin
    const accountType = await question(
      "Create [s]uper admin or regular [a]dmin? (s/a): ",
    )
    const isSuperAdmin = accountType.toLowerCase() === "s"

    const email = await question("Email address: ")
    const password = await question("Password: ")
    const name = await question("Full name: ")

    // Get permissions for regular admin
    let permissions: string[] = []
    if (!isSuperAdmin) {
      console.log("\nAvailable permissions:")
      console.log("1. manage_users - Full user management")
      console.log("2. view_users - View users only")
      console.log("3. manage_donations - Manage donations")
      console.log("4. view_donations - View donations only")
      console.log("5. manage_blood_requests - Manage blood requests")
      console.log("6. view_blood_requests - View blood requests only")
      console.log("7. manage_events - Manage events")
      console.log("8. view_events - View events only")
      console.log("9. manage_transportation - Manage transportation")
      console.log("10. view_transportation - View transportation only")
      console.log("11. generate_certificates - Generate certificates")
      console.log("12. send_notifications - Send notifications")
      console.log("13. view_donation_images - View donation images")
      console.log("14. view_contact_submissions - View contact submissions")
      console.log("15. check_qr_codes - Check QR codes")
      console.log("16. view_event_donors - View event donors")
      console.log("17. manage_blogs - Manage blogs")
      console.log("18. view_blogs - View blogs only")

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

      permissions = permInput
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p in permMap)
        .map((p) => permMap[p])
    }

    // Confirm details
    console.log("\n--- Account Details ---")
    console.log(`Type: ${isSuperAdmin ? "Super Admin" : "Regular Admin"}`)
    console.log(`Email: ${email}`)
    console.log(`Name: ${name}`)
    if (!isSuperAdmin) {
      console.log(`Permissions: ${permissions.join(", ") || "None"}`)
    }

    const confirm = await question("\nProceed? (yes/no): ")
    if (confirm.toLowerCase() !== "yes") {
      console.log("Cancelled.")
      rl.close()
      return
    }

    // Connect to database
    const { db } = await connectToDatabase()
    const adminsCollection = db.collection("admins")

    // Check if email already exists
    const existing = await adminsCollection.findOne({ email })
    if (existing) {
      console.log("Error: Admin with this email already exists")
      rl.close()
      return
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create admin
    const result = await adminsCollection.insertOne({
      email,
      password: hashedPassword,
      name,
      role: isSuperAdmin ? "superadmin" : "admin",
      permissions,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log("\n✓ Admin account created successfully!")
    console.log(`ID: ${result.insertedId}`)
    console.log(
      `\nLogin at: ${isSuperAdmin ? "/admin/login" : "/admin/staff/login"}`,
    )

    rl.close()
  } catch (error) {
    console.error("Error:", error)
    rl.close()
    process.exit(1)
  }
}

main()