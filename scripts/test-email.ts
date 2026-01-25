import Mailjet from "node-mailjet"
import * as dotenv from "dotenv"
import path from "path"

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function testEmailConfiguration() {
  console.log("🔍 Email Configuration Diagnostic Tool")
  console.log("=" + "=".repeat(60))

  // Check environment variables
  console.log("\n1️⃣  Checking Mailjet Configuration...")
  console.log("-" + "-".repeat(60))

  const apiKey = process.env.MAILJET_API_KEY || process.env.SMTP_USER
  const apiSecret = process.env.MAILJET_SECRET_KEY || process.env.SMTP_PASS
  const senderEmail = process.env.MAILJET_SENDER_EMAIL || process.env.SMTP_FROM

  const config = {
    MAILJET_API_KEY: apiKey ? `${apiKey.substring(0, 10)}...` : undefined,
    MAILJET_SECRET_KEY: apiSecret ? `${apiSecret.substring(0, 10)}...` : undefined,
    MAILJET_SENDER_EMAIL: senderEmail,
  }

  let allConfigured = true
  for (const [key, value] of Object.entries(config)) {
    const status = value ? "✅" : "❌"
    console.log(`${status} ${key}: ${value || "NOT SET"}`)
    if (!value) allConfigured = false
  }

  if (!allConfigured) {
    console.log(
      "\n⚠️  Some configuration values are missing. Please check your .env.local file.",
    )
    console.log("   Required: MAILJET_API_KEY (or SMTP_USER) and MAILJET_SECRET_KEY (or SMTP_PASS) and MAILJET_SENDER_EMAIL (or SMTP_FROM)")
    process.exit(1)
  }

  // Test Mailjet connection
  console.log("\n2️⃣  Testing Mailjet Connection...")
  console.log("-" + "-".repeat(60))

  try {
    const mailjet = Mailjet.apiConnect(apiKey!, apiSecret!)
    
    // Try to get account details to verify credentials
    const result = await mailjet.get("user").request()
    
    console.log("✅ Mailjet connection successful!")
    console.log("   Account details:", (result.body as any).Data[0].Email)
    
  } catch (error) {
    console.error("❌ Mailjet connection failed!")
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`)
      
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
         console.error("\n🔑 Authentication Error: Your Mailjet API Key or Secret Key is invalid.")
         console.error("   Steps to fix:")
         console.error("   1. Go to https://app.mailjet.com/account/api_keys")
         console.error("   2. Check your API Key and Secret Key")
         console.error("   3. Update .env.local")
      }
    }
    // Don't exit here, continue to check other things
  }

  // Check sender email validation
  console.log("\n3️⃣  Checking Sender Email Configuration...")
  console.log("-" + "-".repeat(60))

  const emailMatch = senderEmail!.match(/<(.+?)>|^(.+?)$/)
  const emailAddress = emailMatch ? emailMatch[1] || emailMatch[2] : senderEmail

  console.log(`Sender Email: ${emailAddress}`)
  console.log("ℹ️  Note: Ensure this email is verified in Mailjet Sender Addresses.")
  console.log("   https://app.mailjet.com/account/sender")

  console.log("\n" + "=".repeat(62))
  console.log("✅ Diagnostic complete!")
}

testEmailConfiguration().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
