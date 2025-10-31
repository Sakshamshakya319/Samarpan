import nodemailer from "nodemailer"
import * as dotenv from "dotenv"
import path from "path"

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function testEmailConfiguration() {
  console.log("🔍 Email Configuration Diagnostic Tool")
  console.log("=" + "=".repeat(60))

  // Check environment variables
  console.log("\n1️⃣  Checking SMTP Configuration...")
  console.log("-" + "-".repeat(60))

  const config = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS ? `${process.env.SMTP_PASS.substring(0, 10)}...` : undefined,
    SMTP_FROM: process.env.SMTP_FROM,
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
    process.exit(1)
  }

  // Test SMTP connection
  console.log("\n2️⃣  Testing SMTP Connection...")
  console.log("-" + "-".repeat(60))

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    console.log("Verifying SMTP connection...")
    await transporter.verify()
    console.log("✅ SMTP connection successful!")
  } catch (error) {
    console.error("❌ SMTP connection failed!")
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`)

      if (error.message.includes("535")) {
        console.error(
          "\n🔑 Authentication Error: Your SendGrid API key is invalid or expired.",
        )
        console.error("   Steps to fix:")
        console.error("   1. Go to https://app.sendgrid.com/settings/api_keys")
        console.error("   2. Create a new API key (Full Access recommended for testing)")
        console.error("   3. Update SMTP_PASS in .env.local with the new key")
        console.error("   4. Make sure the API key is not restricted to specific IPs")
      } else if (error.message.includes("ECONNREFUSED")) {
        console.error("\n🌐 Connection Refused: Cannot reach the SMTP server.")
        console.error("   Steps to fix:")
        console.error("   1. Check that SMTP_HOST is correct: " + process.env.SMTP_HOST)
        console.error("   2. Check that SMTP_PORT is correct: " + process.env.SMTP_PORT)
        console.error("   3. Ensure your internet connection is working")
      } else if (error.message.includes("ETIMEDOUT")) {
        console.error("\n⏱️  Connection Timeout: SMTP server is not responding.")
        console.error("   Steps to fix:")
        console.error("   1. Check if the SMTP server is running")
        console.error("   2. Try increasing the timeout in the transporter config")
        console.error("   3. Check your firewall settings")
      }
    }
    process.exit(1)
  }

  // Check sender email validation
  console.log("\n3️⃣  Checking Sender Email Configuration...")
  console.log("-" + "-".repeat(60))

  const smtpFrom = process.env.SMTP_FROM || ""
  const emailMatch = smtpFrom.match(/<(.+?)>|^(.+?)$/)
  const senderEmail = emailMatch ? emailMatch[1] || emailMatch[2] : smtpFrom

  console.log(`Sender Email: ${senderEmail}`)

  if (process.env.SMTP_USER === "apikey" && process.env.SMTP_HOST === "smtp.sendgrid.net") {
    console.log("📧 SendGrid Configuration Detected")
    console.log("")
    console.log("⚠️  IMPORTANT: With SendGrid, the sender email must be verified!")
    console.log("")
    console.log("Steps to verify your sender email in SendGrid:")
    console.log("1. Go to https://app.sendgrid.com/settings/sender_auth")
    console.log("2. Click 'Create New Sender' or use an existing verified sender")
    console.log("3. The email address you use in SMTP_FROM must match the verified sender")
    console.log("4. Current sender: " + senderEmail)
    console.log("")
    console.log("Alternative: Use SendGrid Single Sender Verification")
    console.log("- If you verify a single sender, use that email in SMTP_FROM")
    console.log("- If you verify a domain, any email @that-domain will work")
  }

  console.log("\n4️⃣  SendGrid API Key Validation...")
  console.log("-" + "-".repeat(60))

  const apiKey = process.env.SMTP_PASS
  if (apiKey) {
    if (apiKey.startsWith("SG.")) {
      console.log("✅ API Key format appears valid (starts with SG.)")
      console.log(`   Key: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 10)}`)
    } else {
      console.error("❌ API Key format looks invalid!")
      console.error("   SendGrid API keys should start with 'SG.'")
      console.error("   Current key: " + apiKey.substring(0, 20) + "...")
    }
  }

  console.log("\n5️⃣  Recommendations...")
  console.log("-" + "-".repeat(60))

  console.log("\n✅ Email should now be working if all checks passed!")
  console.log("\nIf emails are still not being received:")
  console.log("1. Check the user's spam/junk folder")
  console.log("2. Verify the sender email is properly configured in SendGrid")
  console.log("3. Check SendGrid activity log for bounce/suppression reasons:")
  console.log("   https://app.sendgrid.com/email_activity")
  console.log("4. Enable detailed logging in your application")
  console.log("5. Review server logs for error messages")

  console.log("\n" + "=".repeat(62))
  console.log("✅ Diagnostic complete!")
}

testEmailConfiguration().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})