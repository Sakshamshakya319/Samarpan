import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { sendWhatsAppNotification } from "@/lib/whatsapp"
import { sendEmail } from "@/lib/email"
import { generateCertificateDesign } from "@/lib/certificate-generator"
import crypto from "crypto"

function generateVerificationToken(): string {
  return crypto.randomBytes(16).toString("hex")
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || !["admin", "superadmin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const db = await getDatabase()
    const adminsCollection = db.collection("admins")
    const admin = await adminsCollection.findOne({
      _id: new ObjectId(decoded.adminId),
    })

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    const { userId, donationCount, imageData, signatureData } = await request.json()

    if (!userId || !donationCount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const certificatesCollection = db.collection("certificates")
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const verificationToken = generateVerificationToken()

    const certificateData: any = {
      userId: new ObjectId(userId),
      certificateId,
      verificationToken,
      donationCount,
      issuedDate: new Date(),
      createdBy: new ObjectId(decoded.adminId),
      status: "active",
    }

    if (imageData) {
      certificateData.imageData = imageData
    }

    if (signatureData) {
      certificateData.signatureData = signatureData
    }

    const result = await certificatesCollection.insertOne(certificateData)

    const notificationsCollection = db.collection("notifications")
    await notificationsCollection.insertOne({
      userId: new ObjectId(userId),
      title: "Certificate Generated",
      message: `Your donation certificate #${certificateId} has been generated for ${donationCount} donations.`,
      read: false,
      createdAt: new Date(),
    })

    // Fetch user details
    const usersCollection = db.collection("users")
    const userDoc = await usersCollection.findOne({ _id: new ObjectId(userId) })

    // Send Email with PDF Attachment
    if (userDoc && userDoc.email) {
      try {
        console.log(`[Certificates] Generating PDF for ${userDoc.email}...`)
        const pdfBytes = await generateCertificateDesign(certificateData, userDoc, {
          logoData: imageData,
          signatureData: signatureData
        })
        
        console.log(`[Certificates] Sending email to ${userDoc.email}...`)
        await sendEmail({
          to: userDoc.email,
          subject: "Your Blood Donation Certificate - Samarpan",
          html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h2>Blood Donation Certificate</h2>
              <p>Dear ${userDoc.name},</p>
              <p>Thank you for your generous contribution of ${donationCount} blood donations.</p>
              <p>Your commitment to saving lives is truly inspiring. Please find your certificate attached to this email.</p>
              <p>Certificate ID: <strong>${certificateId}</strong></p>
              <p>You can also view and download this certificate from your <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard">Dashboard</a>.</p>
              <br/>
              <p>Warm regards,</p>
              <p><strong>The Samarpan Team</strong></p>
            </div>
          `,
          attachments: [{
            filename: `Certificate-${certificateId}.pdf`,
            content: Buffer.from(pdfBytes),
            contentType: "application/pdf"
          }]
        })
        console.log(`[Certificates] Email sent successfully to ${userDoc.email}`)
      } catch (emailErr) {
        console.error("[Certificates] Email send error:", emailErr)
      }
    }

    // Send WhatsApp to user (best-effort)
    try {
      if (userDoc?.phone) {
        await sendWhatsAppNotification({
          phone: userDoc.phone,
          title: "Certificate Generated",
          message: `Your donation certificate #${certificateId} has been generated for ${donationCount} donations. Check your email or dashboard!`,
        })
      }
    } catch (waErr) {
      console.error("[Certificates] WhatsApp send error:", waErr)
    }

    return NextResponse.json(
      {
        message: "Certificate generated successfully",
        certificateId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Generate certificate error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
