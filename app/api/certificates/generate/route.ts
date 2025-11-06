import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { PDFDocument, rgb, PDFPage } from "pdf-lib"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const certificatesCollection = db.collection("certificates")
    const usersCollection = db.collection("users")

    const certificate = await certificatesCollection.findOne({
      _id: new ObjectId(params),
      userId: new ObjectId(decoded.userId),
    })

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    const user = await usersCollection.findOne({
      _id: new ObjectId(decoded.userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const pdfBytes = await generateSimpleCertificate(certificate, user, {
      logoData: certificate.imageData || null,
      signatureData: certificate.signatureData || null,
    })

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${certificate.certificateId}.pdf"`,
        "Content-Length": pdfBytes.length.toString(),
      },
    })
  } catch (error) {
    console.error("Certificate generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateSimpleCertificate(
  certificate: any,
  user: any,
  options?: { logoData?: string | null; signatureData?: string | null },
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])

  const { width, height } = page.getSize()
  const margin = 45
  const contentMargin = margin + 30
  const innerWidth = width - 2 * margin
  const primaryBlue = rgb(0.15, 0.35, 0.65)
  const darkGray = rgb(0.2, 0.2, 0.2)
  const lightGray = rgb(0.3, 0.3, 0.3)

  page.drawRectangle({
    x: margin,
    y: margin,
    width: innerWidth,
    height: height - 2 * margin,
    borderColor: primaryBlue,
    borderWidth: 3,
  })

  page.drawRectangle({
    x: margin + 4,
    y: margin + 4,
    width: innerWidth - 8,
    height: height - 2 * (margin + 4),
    borderColor: primaryBlue,
    borderWidth: 1,
  })

  let currentY = height - margin - 20

  if (options?.logoData) {
    try {
      const logoImageBytes = Buffer.from(
        options.logoData.replace(/^data:image\/\w+;base64,/, ""),
        "base64",
      )
      const logoImage = await pdfDoc.embedPng(logoImageBytes)
      page.drawImage(logoImage, {
        x: contentMargin,
        y: currentY - 70,
        width: 70,
        height: 70,
      })
    } catch (err) {
      console.error("Error embedding logo:", err)
    }
  }

  page.drawText("CERTIFICATE OF", {
    x: contentMargin + 85,
    y: currentY - 10,
    size: 32,
    color: primaryBlue,
  })

  page.drawText("APPRECIATION", {
    x: contentMargin + 85,
    y: currentY - 35,
    size: 32,
    color: primaryBlue,
  })

  page.drawLine({
    start: { x: contentMargin + 85, y: currentY - 42 },
    end: { x: width - contentMargin, y: currentY - 42 },
    color: primaryBlue,
    thickness: 2,
  })

  currentY = currentY - 110

  page.drawText("This is to certify that", {
    x: contentMargin,
    y: currentY,
    size: 11,
    color: darkGray,
  })

  currentY -= 50

  page.drawText(user.name.toUpperCase(), {
    x: contentMargin,
    y: currentY,
    size: 30,
    color: primaryBlue,
  })

  currentY -= 48

  page.drawText("has generously donated blood and contributed to saving lives.", {
    x: contentMargin,
    y: currentY,
    size: 11,
    color: darkGray,
    maxWidth: innerWidth - 60,
  })

  currentY -= 70

  page.drawRectangle({
    x: width / 2 - 105,
    y: currentY - 30,
    width: 210,
    height: 34,
    color: primaryBlue,
  })

  page.drawText(`Total Donations: ${certificate.donationCount}`, {
    x: width / 2 - 105,
    y: currentY - 16,
    size: 15,
    color: rgb(1, 1, 1),
    maxWidth: 210,
    align: "center",
  })

  currentY -= 80

  const issuedDate = new Date(certificate.issuedDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  page.drawText(`Certificate ID: ${certificate.certificateId}`, {
    x: contentMargin,
    y: currentY,
    size: 8,
    color: lightGray,
  })

  page.drawText(`Issued Date: ${issuedDate}`, {
    x: contentMargin,
    y: currentY - 16,
    size: 8,
    color: lightGray,
  })

  page.drawText("Verification Token:", {
    x: contentMargin,
    y: currentY - 32,
    size: 8,
    color: primaryBlue,
  })

  page.drawText(certificate.verificationToken, {
    x: contentMargin,
    y: currentY - 42,
    size: 7,
    color: primaryBlue,
  })

  page.drawText("To Verify Certificate:", {
    x: width - contentMargin - 140,
    y: currentY,
    size: 9,
    color: darkGray,
  })

  page.drawText("Visit: /verify-certificate", {
    x: width - contentMargin - 140,
    y: currentY - 16,
    size: 8,
    color: primaryBlue,
  })

  currentY -= 80

  if (options?.signatureData) {
    try {
      const signatureImageBytes = Buffer.from(
        options.signatureData.replace(/^data:image\/\w+;base64,/, ""),
        "base64",
      )
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes)
      page.drawImage(signatureImage, {
        x: contentMargin,
        y: currentY,
        width: 115,
        height: 34,
      })
    } catch (err) {
      console.error("Error embedding signature:", err)
    }
  }

  page.drawLine({
    start: { x: contentMargin, y: currentY - 3 },
    end: { x: contentMargin + 200, y: currentY - 3 },
    color: rgb(0, 0, 0),
    thickness: 1.5,
  })

  page.drawText("Authorized Signature", {
    x: contentMargin,
    y: currentY - 20,
    size: 8,
    color: darkGray,
  })

  currentY -= 60

  page.drawLine({
    start: { x: margin + 20, y: currentY },
    end: { x: width - margin - 20, y: currentY },
    color: primaryBlue,
    thickness: 2,
  })

  currentY -= 28

  page.drawText("Samarpan Blood Donor Network", {
    x: margin + 20,
    y: currentY,
    size: 12,
    color: primaryBlue,
    maxWidth: innerWidth - 40,
    align: "center",
  })

  currentY -= 16

  page.drawText("Dedicated to Saving Lives Through Blood Donation", {
    x: margin + 20,
    y: currentY,
    size: 9,
    color: lightGray,
    maxWidth: innerWidth - 40,
    align: "center",
  })

  return await pdfDoc.save()
}
