import { NextRequest, NextResponse } from "next/server"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { amount, name, email, phone, message } = await request.json()
    if (!amount || amount <= 0 || !name || !email) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 })
    }

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
        receipt: `donation_${Date.now()}`,
        payment_capture: 1,
        notes: { donor_name: name, donor_email: email, donor_phone: phone || "", message: message || "" },
      }),
    })

    const data = await orderRes.json()
    if (!orderRes.ok) {
      return NextResponse.json({ error: data.error?.description || "Failed to create order" }, { status: 500 })
    }

    return NextResponse.json({ success: true, orderId: data.id, keyId })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}