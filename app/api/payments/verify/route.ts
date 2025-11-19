import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
export const runtime = "nodejs"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donor } = await request.json()
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !donor?.amount || !donor?.email) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    const keyId = process.env.RAZORPAY_KEY_ID
    if (!keySecret || !keyId) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 })
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 400 })
    }

    let paymentDetails: any = null
    try {
      const pRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        },
      })
      if (pRes.ok) {
        paymentDetails = await pRes.json()
      }
    } catch {}

    const db = await getDatabase()
    const donations = db.collection("fundingDonations")

    const record = {
      name: donor.name || "",
      email: donor.email,
      phone: donor.phone || "",
      message: donor.message || "",
      amount: Number(donor.amount),
      currency: "INR",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      status: paymentDetails?.status || "captured",
      method: paymentDetails?.method || "",
      createdAt: new Date(),
      gatewayResponse: paymentDetails || null,
    }

    await donations.insertOne(record)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}