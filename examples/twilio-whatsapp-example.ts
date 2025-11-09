/**
 * Example: Using Twilio WhatsApp Integration in Samarpan
 * 
 * This example shows how to use the updated WhatsApp functions
 * that now use Twilio API instead of Meta Graph API
 */

import { sendWhatsAppText, sendWhatsAppNotification, sendWhatsAppTemplate, sendWhatsAppBulk } from '@/lib/whatsapp';

// Example 1: Send a simple text message
export async function sendSimpleMessage() {
  const phoneNumber = '+917999702959'; // Replace with actual phone number
  const message = '🩸 Hello from Samarpan Blood Donation! Your donation request has been received.';
  
  const success = await sendWhatsAppText(phoneNumber, message);
  
  if (success) {
    console.log('✅ Message sent successfully!');
  } else {
    console.log('❌ Failed to send message');
  }
}

// Example 2: Send a notification with title and message
export async function sendNotification() {
  await sendWhatsAppNotification({
    phone: '+919411850565', // Optional - will use default if not provided
    title: '🩸 Blood Donation Request',
    message: 'Your blood donation request for Patient: John Doe (A+ blood type) has been confirmed. Please visit the hospital at your convenience.'
  });
}

// Example 3: Send a template message (using Twilio Content Templates)
export async function sendTemplateMessage() {
  const templateSid = 'HXb5b62575e6e4ff6129ad7c8efe1f983e'; // Your Twilio template SID
  const contentVariables = {
    '1': '12/1',    // Date
    '2': '3pm'      // Time
  };
  
  await sendWhatsAppTemplate(
    '+919411850565',
    templateSid,
    contentVariables,
    {
      fallbackText: '📅 Appointment Reminder\nDate: 12/1\nTime: 3pm\nLocation: City Hospital'
    }
  );
}

// Example 3b: Send template with regular API formatting
export async function sendTemplateWithRegularAPI() {
  await sendWhatsAppTemplate(
    '+919411850565',
    'blood_donation_alert', // Custom template name
    { 
      patientName: 'John Doe',
      bloodType: 'A+',
      hospital: 'City Hospital',
      urgency: 'High',
      contact: '+919876543210'
    },
    {
      useContentApi: false, // Force regular API
      fallbackText: '🚨 URGENT BLOOD DONATION NEEDED\nPatient: John Doe\nBlood Type: A+\nHospital: City Hospital\nUrgency: High\nContact: +919876543210'
    }
  );
}

// Example 4: Send bulk messages
export async function sendBulkMessages() {
  const phoneNumbers = [
    '+919411850565',
    '+919876543210',
    '+917999702959'
  ];
  
  const message = '🩸 Urgent: Blood donation camp this Sunday at City Hospital. All blood types needed!';
  
  const result = await sendWhatsAppBulk(phoneNumbers, message);
  
  console.log(`✅ Sent: ${result.sent}, ❌ Failed: ${result.failed}`);
}

// Example 5: Integration in API route
export async function handleBloodRequestNotification(donorPhone: string, patientName: string, bloodType: string) {
  try {
    await sendWhatsAppNotification({
      phone: donorPhone,
      title: '🩸 Blood Donation Request',
      message: `Urgent blood donation needed!\n\nPatient: ${patientName}\nBlood Type: ${bloodType}\n\nPlease contact us if you can help.`
    });
    
    return { success: true, message: 'Notification sent successfully' };
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
    return { success: false, message: 'Failed to send notification' };
  }
}