#!/usr/bin/env tsx

/**
 * Test script for Twilio WhatsApp integration
 * Usage: npm run test-twilio-whatsapp
 */

import * as dotenv from 'dotenv';
// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

import { sendWhatsAppText, sendWhatsAppTemplate, sendWhatsAppNotification } from "@/lib/whatsapp"

async function testTwilioWhatsApp() {
  console.log("🧪 Testing Twilio WhatsApp Integration")
  console.log("=====================================")

  // Check environment variables
  const requiredEnvVars = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN", 
    "TWILIO_WHATSAPP_NUMBER"
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:")
    missingVars.forEach(varName => console.error(`   - ${varName}`))
    console.error("\nPlease update your .env.local file with the Twilio credentials.")
    process.exit(1)
  }

  console.log("✅ Environment variables configured")
  console.log(`   - TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID?.substring(0, 10)}...`)
  console.log(`   - TWILIO_WHATSAPP_NUMBER: ${process.env.TWILIO_WHATSAPP_NUMBER}`)
  console.log(`   - WHATSAPP_ENABLED: ${process.env.WHATSAPP_ENABLED}`)

  // Test phone number (you should replace this with your test number)
  const testPhoneNumber = process.env.TEST_WHATSAPP_NUMBER || "+919411850565"
  
  try {
    console.log("\n📤 Test 1: Sending simple text message")
    const textResult = await sendWhatsAppText(testPhoneNumber, "🩸 Hello from Samarpan Blood Donation! This is a test message from our updated Twilio WhatsApp integration.")
    
    if (textResult) {
      console.log("✅ Text message sent successfully!")
    } else {
      console.log("❌ Text message failed to send")
    }

    console.log("\n📤 Test 2: Sending notification message")
    const notificationResult = await sendWhatsAppNotification({
      phone: testPhoneNumber,
      title: "🩸 Blood Donation Update",
      message: "Your blood donation request has been processed successfully. Thank you for your contribution!"
    })
    
    if (notificationResult === undefined) {
      console.log("✅ Notification sent successfully!")
    } else {
      console.log("❌ Notification failed to send")
    }

    console.log("\n📤 Test 3: Sending template message (if content SID provided)")
    
    // Test with content template (if you have one)
    const contentSid = process.env.TWILIO_CONTENT_SID || "HXb5b62575e6e4ff6129ad7c8efe1f983e"
    const templateResult = await sendWhatsAppTemplate(
      testPhoneNumber,
      contentSid,
      { "1": "12/1", "2": "3pm" },
      {
        fallbackText: "📅 Appointment Reminder\nDate: 12/1\nTime: 3pm\nLocation: City Hospital"
      }
    )
    if (templateResult) {
      console.log("✅ Template message sent successfully!")
    } else {
      console.log("❌ Template message failed to send")
    }

    console.log("\n📤 Test 4: Sending template with regular API formatting")
    const regularTemplateResult = await sendWhatsAppTemplate(
      testPhoneNumber,
      "custom_template_name",
      { 
        patientName: "John Doe",
        bloodType: "A+",
        hospital: "City Hospital",
        date: "2024-01-15"
      },
      {
        useContentApi: false,
        fallbackText: "🩸 Blood Donation Request\nPatient: John Doe\nBlood Type: A+\nHospital: City Hospital\nDate: 2024-01-15"
      }
    )
    if (regularTemplateResult) {
      console.log("✅ Regular template message sent successfully!")
    } else {
      console.log("❌ Regular template message failed to send")
    }

    console.log("\n🎉 Twilio WhatsApp integration test completed!")
    console.log("Check your WhatsApp to see the test messages.")
    
  } catch (error) {
    console.error("\n💥 Error during testing:", error)
    process.exit(1)
  }
}

// Run the test
testTwilioWhatsApp().catch(console.error)