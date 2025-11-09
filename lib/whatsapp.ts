/**
 * WhatsApp Twilio API Sender
 * Sends WhatsApp messages via Twilio API.
 *
 * Env vars required:
 * - WHATSAPP_ENABLED=true|false
 * - TWILIO_ACCOUNT_SID=AC...
 * - TWILIO_AUTH_TOKEN=...
 * - TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
 * - WHATSAPP_DEFAULT_COUNTRY_CODE=91 (optional)
 */

// Initialize Twilio client
let twilioClient: any = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.warn("[WhatsApp] Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
      return null;
    }
    
    try {
      // Use require to avoid issues if Twilio is not installed
      const twilio = require('twilio');
      twilioClient = twilio(accountSid, authToken);
    } catch (error) {
      console.error("[WhatsApp] Failed to initialize Twilio client:", error);
      return null;
    }
  }
  return twilioClient;
}

function normalizePhone(raw?: string): string | null {
  if (!raw) return null
  let p = raw.trim()
  // Already in E.164
  if (p.startsWith("+")) return p
  // Strip spaces and dashes
  p = p.replace(/[^0-9]/g, "")
  // If a default country code is provided, prefix when we have 10 digits
  const cc = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || ""
  if (cc && p.length === 10) return `+${cc}${p}`
  // If it looks like 12-13 digits and starts with country code, prefix plus
  if (p.length >= 11) return `+${p}`
  return null
}

export async function sendWhatsAppText(to: string, text: string): Promise<boolean> {
  try {
    if (process.env.WHATSAPP_ENABLED !== "true") return false
    
    const client = getTwilioClient()
    if (!client) {
      console.warn("[WhatsApp] Twilio client not initialized")
      return false
    }

    const normalized = normalizePhone(to)
    if (!normalized) {
      console.warn(`[WhatsApp] Invalid phone number: ${to}`)
      return false
    }

    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'
    
    // Send message using Twilio
    const message = await client.messages.create({
      from: fromNumber,
      body: text,
      to: `whatsapp:${normalized.replace('+', '')}` // Remove + for Twilio format
    })

    console.log(`[WhatsApp] Message sent successfully: ${message.sid}`)
    return true
  } catch (err) {
    console.error("[WhatsApp] Error sending message:", err)
    return false
  }
}

export async function sendWhatsAppNotification(args: { phone?: string, title: string, message: string }): Promise<void> {
  const { phone, title, message } = args
  const combined = `${title}\n\n${message}`
  if (!phone) return
  await sendWhatsAppText(phone, combined)
}

export async function sendWhatsAppBulk(phones: string[], text: string): Promise<{ sent: number, failed: number }>{
  if (process.env.WHATSAPP_ENABLED !== "true") return { sent: 0, failed: 0 }
  const results = await Promise.allSettled(phones.map((p) => sendWhatsAppText(p, text)))
  let sent = 0, failed = 0
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) sent++
    else failed++
  }
  return { sent, failed }
}

/**
 * Send WhatsApp message using Twilio Content Templates or regular text with template formatting
 * @param to - Recipient phone number
 * @param templateId - Twilio Content Template SID (e.g., 'HXb5b62575e6e4ff6129ad7c8efe1f983e') or template name
 * @param contentVariables - Variables for the template (object with key-value pairs)
 * @param options - Additional options for template sending
 * @returns Promise<boolean> - Success status
 */
export async function sendWhatsAppTemplate(
  to: string, 
  templateId: string, 
  contentVariables?: Record<string, any>,
  options?: {
    fallbackText?: string; // Fallback text if template fails
    useContentApi?: boolean; // Use content API vs regular messaging API
  }
): Promise<boolean> {
  try {
    if (process.env.WHATSAPP_ENABLED !== "true") {
      console.warn("[WhatsApp] WhatsApp messaging is disabled")
      return false
    }
    
    const client = getTwilioClient()
    if (!client) {
      console.warn("[WhatsApp] Twilio client not initialized")
      return false
    }

    const normalized = normalizePhone(to)
    if (!normalized) {
      console.warn(`[WhatsApp] Invalid phone number: ${to}`)
      return false
    }

    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'
    const toNumber = `whatsapp:${normalized.replace('+', '')}`
    
    // Determine which API to use based on templateId format
    const isContentTemplate = templateId.startsWith('HX') || templateId.startsWith('H')
    const useContentApi = options?.useContentApi !== false && isContentTemplate

    try {
      if (useContentApi) {
        // Use Twilio Content API for approved templates
        console.log(`[WhatsApp] Using Content API with template: ${templateId}`)
        
        const messageParams: any = {
          from: fromNumber,
          to: toNumber,
          contentSid: templateId
        }

        // Add content variables if provided
        if (contentVariables && Object.keys(contentVariables).length > 0) {
          messageParams.contentVariables = JSON.stringify(contentVariables)
        }

        const message = await client.messages.create(messageParams)
        console.log(`[WhatsApp] Template message sent successfully via Content API: ${message.sid}`)
        return true
        
      } else {
        // Use regular messaging API with template-like formatting
        console.log(`[WhatsApp] Using regular API with template formatting`)
        
        // Try to use fallback text if provided, otherwise create template-like message
        let messageText = options?.fallbackText || ''
        
        if (!messageText && contentVariables) {
          // Create a simple template-like message from variables
          messageText = Object.entries(contentVariables)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n')
        }
        
        if (!messageText) {
          console.warn("[WhatsApp] No message content provided for template")
          return false
        }

        const message = await client.messages.create({
          from: fromNumber,
          body: messageText,
          to: toNumber
        })

        console.log(`[WhatsApp] Message sent successfully via regular API: ${message.sid}`)
        return true
      }
      
    } catch (templateError: any) {
      console.error("[WhatsApp] Template sending failed, attempting fallback:", templateError.message)
      
      // Fallback to regular text message if template fails
      if (options?.fallbackText) {
        console.log("[WhatsApp] Attempting fallback text message")
        const fallbackMessage = await client.messages.create({
          from: fromNumber,
          body: options.fallbackText,
          to: toNumber
        })
        console.log(`[WhatsApp] Fallback message sent: ${fallbackMessage.sid}`)
        return true
      } else {
        throw templateError // Re-throw if no fallback
      }
    }

  } catch (err: any) {
    console.error("[WhatsApp] Error sending template message:", err.message)
    if (err.code) {
      console.error(`[WhatsApp] Twilio error code: ${err.code}`)
    }
    return false
  }
}