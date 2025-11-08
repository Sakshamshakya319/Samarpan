/**
 * WhatsApp Cloud API Sender
 * Minimal helper to send WhatsApp messages via Meta Graph API.
 *
 * Env vars required:
 * - WHATSAPP_ENABLED=true|false
 * - WHATSAPP_TOKEN=EAAG...
 * - WHATSAPP_PHONE_NUMBER_ID=1234567890
 * - WHATSAPP_DEFAULT_COUNTRY_CODE=91 (optional)
 */

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
    const token = process.env.WHATSAPP_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (!token || !phoneNumberId) {
      console.warn("[WhatsApp] Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID")
      return false
    }

    const normalized = normalizePhone(to)
    if (!normalized) {
      console.warn(`[WhatsApp] Invalid phone number: ${to}`)
      return false
    }

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`
    const body = {
      messaging_product: "whatsapp",
      to: normalized,
      type: "text",
      text: { body: text, preview_url: false },
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      console.error(`[WhatsApp] Send failed (${res.status}):`, errText)
      return false
    }
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