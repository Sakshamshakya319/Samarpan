import * as dotenv from "dotenv"
import path from "path"
import { sendWhatsAppText } from "../lib/whatsapp"

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function testWhatsAppConfiguration() {
  console.log("🔍 WhatsApp Configuration Diagnostic Tool")
  console.log("=" + "=".repeat(60))

  // Check environment variables
  console.log("\n1️⃣  Checking WhatsApp Configuration...")
  console.log("-" + "-".repeat(60))

  const config = {
    WHATSAPP_ENABLED: process.env.WHATSAPP_ENABLED,
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN ? `${process.env.WHATSAPP_TOKEN.substring(0, 20)}...` : undefined,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_DEFAULT_COUNTRY_CODE: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE,
  }

  let allConfigured = true
  for (const [key, value] of Object.entries(config)) {
    const status = value ? "✅" : "❌"
    console.log(`${status} ${key}: ${value || "NOT SET"}`)
    if (!value && key !== "WHATSAPP_DEFAULT_COUNTRY_CODE") allConfigured = false
  }

  if (!allConfigured) {
    console.log(
      "\n⚠️  Some required configuration values are missing. Please check your .env.local file.",
    )
    console.log("\nRequired environment variables:")
    console.log("- WHATSAPP_ENABLED=true")
    console.log("- WHATSAPP_TOKEN=EAAG... (from Meta/Facebook Developers)")
    console.log("- WHATSAPP_PHONE_NUMBER_ID=1234567890")
    console.log("- WHATSAPP_DEFAULT_COUNTRY_CODE=91 (optional, defaults to 91)")
    process.exit(1)
  }

  if (process.env.WHATSAPP_ENABLED !== "true") {
    console.log("\n⚠️  WhatsApp is disabled (WHATSAPP_ENABLED != 'true')")
    console.log("Set WHATSAPP_ENABLED=true to enable WhatsApp notifications")
    process.exit(1)
  }

  // Validate token format
  console.log("\n2️⃣  Validating WhatsApp Token...")
  console.log("-" + "-".repeat(60))

  const token = process.env.WHATSAPP_TOKEN || ""
  if (token.startsWith("EAAG") || token.startsWith("EAA")) {
    console.log("✅ Token format appears valid (starts with EAAG or EAA)")
  } else {
    console.error("❌ Token format looks invalid!")
    console.error("   WhatsApp tokens should start with 'EAAG' or 'EAA'")
    console.error("   Current token: " + token.substring(0, 20) + "...")
    console.error("\nSteps to get a valid token:")
    console.error("1. Go to https://developers.facebook.com/apps/")
    console.error("2. Create/select your app")
    console.error("3. Go to WhatsApp > Getting Started")
    console.error("4. Generate a permanent access token")
  }

  // Test API connection
  console.log("\n3️⃣  Testing WhatsApp API Connection...")
  console.log("-" + "-".repeat(60))

  // Ask for test phone number
  const testPhone = process.argv[2]
  if (!testPhone) {
    console.log("❌ No test phone number provided")
    console.log("\nUsage: npm run test:whatsapp <phone_number>")
    console.log("Example: npm run test:whatsapp +919876543210")
    console.log("\nNote: Phone number should include country code (e.g., +91 for India)")
    process.exit(1)
  }

  console.log(`Testing with phone number: ${testPhone}`)

  try {
    console.log("Sending test message...")
    const success = await sendWhatsAppText(testPhone, "🧪 This is a test message from Samarpan WhatsApp integration. If you received this, the integration is working correctly!")

    if (success) {
      console.log("✅ Test message sent successfully!")
      console.log("\n📱 Check your WhatsApp for the test message.")
      console.log("If you didn't receive it, check:")
      console.log("1. The phone number format (+country code)")
      console.log("2. WhatsApp Business API setup")
      console.log("3. Meta/Facebook app configuration")
      console.log("4. Webhook configuration (if required)")
    } else {
      console.log("❌ Failed to send test message")
      console.log("\nPossible issues:")
      console.log("1. Invalid token or phone number ID")
      console.log("2. WhatsApp Business API not properly configured")
      console.log("3. Rate limiting or API restrictions")
      console.log("4. Network connectivity issues")
    }
  } catch (error) {
    console.error("❌ Error testing WhatsApp API:")
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`)

      if (error.message.includes("401")) {
        console.error("\n🔑 Authentication Error: Invalid token")
        console.error("Steps to fix:")
        console.error("1. Verify your WhatsApp token is correct")
        console.error("2. Check that the token hasn't expired")
        console.error("3. Ensure the token has the correct permissions")
      } else if (error.message.includes("400")) {
        console.error("\n📱 Bad Request: Check phone number format or API parameters")
      } else if (error.message.includes("429")) {
        console.error("\n⏱️  Rate Limited: Too many requests, try again later")
      }
    }
  }

  console.log("\n" + "=".repeat(62))
  console.log("✅ WhatsApp diagnostic complete!")
}

testWhatsAppConfiguration().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})