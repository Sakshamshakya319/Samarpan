import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { PDFDocument, rgb, degrees } from "pdf-lib"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
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

    // Verify certificate exists and belongs to the user
    const certificate = await certificatesCollection.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(decoded.userId),
    })

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    // Get user details
    const user = await usersCollection.findOne({
      _id: new ObjectId(decoded.userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate PDF
    const pdfBytes = await generateCertificatePDF(certificate, user)

    // Return PDF as file download
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${certificate.certificateId}.pdf"`,
        "Content-Length": pdfBytes.length.toString(),
      },
    })
  } catch (error) {
    console.error("Download certificate error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateCertificatePDF(certificate: any, user: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size

  const { width, height } = page.getSize()
  const margin = 35
  const innerMargin = margin + 8
  const contentWidth = width - 2 * innerMargin

  // Background color - light cream
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(1, 0.98, 0.95),
  })

  // Certificate border - outer (dark red/maroon)
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - 2 * margin,
    height: height - 2 * margin,
    borderColor: rgb(0.5, 0.05, 0.05),
    borderWidth: 3,
  })

  // Certificate border - inner (lighter red)
  page.drawRectangle({
    x: innerMargin,
    y: innerMargin,
    width: contentWidth,
    height: height - 2 * innerMargin,
    borderColor: rgb(0.7, 0.2, 0.2),
    borderWidth: 1,
  })

  let currentY = height - 70

  // Optional Logo/Image at top
  if (certificate.imageData) {
    try {
      const imageData = certificate.imageData
      let imageBytes: Uint8Array
      
      if (imageData.startsWith("data:image")) {
        // Extract base64 from data URL
        const base64String = imageData.split(",")[1]
        imageBytes = Uint8Array.from(atob(base64String), c => c.charCodeAt(0))
      } else {
        imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0))
      }

      let image
      if (imageData.includes("image/png")) {
        image = await pdfDoc.embedPng(imageBytes)
      } else {
        image = await pdfDoc.embedJpg(imageBytes)
      }

      const imgWidth = 60
      const imgHeight = 60
      const imgX = width / 2 - imgWidth / 2
      page.drawImage(image, {
        x: imgX,
        y: currentY - imgHeight,
        width: imgWidth,
        height: imgHeight,
      })
      currentY -= imgHeight + 20
    } catch (err) {
      console.error("Error embedding image:", err)
    }
  }

  // Title with proper centering
  const titleSize = 32
  page.drawText("CERTIFICATE OF", {
    x: innerMargin,
    y: currentY,
    size: titleSize,
    color: rgb(0.5, 0.05, 0.05),
    maxWidth: contentWidth,
    align: "center",
  })
  currentY -= 40

  page.drawText("APPRECIATION", {
    x: innerMargin,
    y: currentY,
    size: titleSize,
    color: rgb(0.5, 0.05, 0.05),
    maxWidth: contentWidth,
    align: "center",
  })
  currentY -= 50

  // Decoration line under title
  const lineStartX = innerMargin + 80
  const lineEndX = width - innerMargin - 80
  page.drawLine({
    start: { x: lineStartX, y: currentY },
    end: { x: lineEndX, y: currentY },
    color: rgb(0.5, 0.05, 0.05),
    thickness: 2,
  })
  currentY -= 40

  // Body text - intro
  page.drawText("This is to certify that", {
    x: innerMargin,
    y: currentY,
    size: 11,
    color: rgb(0, 0, 0),
    maxWidth: contentWidth,
    align: "center",
  })
  currentY -= 35

  // Recipient name - large and prominent
  page.drawText(user.name.toUpperCase(), {
    x: innerMargin,
    y: currentY,
    size: 28,
    color: rgb(0.5, 0.05, 0.05),
    maxWidth: contentWidth,
    align: "center",
  })
  currentY -= 50

  // Achievement text
  page.drawText("has generously donated blood and contributed to saving lives.", {
    x: innerMargin + 10,
    y: currentY,
    size: 11,
    color: rgb(0, 0, 0),
    maxWidth: contentWidth - 20,
    align: "center",
  })
  currentY -= 45

  // Donation count - prominent
  page.drawText(`Total Donations: ${certificate.donationCount}`, {
    x: innerMargin,
    y: currentY,
    size: 13,
    color: rgb(0.5, 0.05, 0.05),
    maxWidth: contentWidth,
    align: "center",
  })
  currentY -= 50

  // Certificate details section
  page.drawText(`Certificate ID: ${certificate.certificateId}`, {
    x: innerMargin + 20,
    y: currentY,
    size: 9,
    color: rgb(0, 0, 0),
    maxWidth: contentWidth - 40,
  })
  currentY -= 20

  // Issued date
  const issuedDate = new Date(certificate.issuedDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  page.drawText(`Issued Date: ${issuedDate}`, {
    x: innerMargin + 20,
    y: currentY,
    size: 9,
    color: rgb(0, 0, 0),
    maxWidth: contentWidth - 40,
  })
  currentY -= 50

  // Signature line
  const signatureLineX1 = innerMargin + 100
  const signatureLineX2 = width - innerMargin - 100
  page.drawLine({
    start: { x: signatureLineX1, y: currentY },
    end: { x: signatureLineX2, y: currentY },
    color: rgb(0, 0, 0),
    thickness: 1,
  })
  currentY -= 20

  // Signature text
  page.drawText("Authorized Signature", {
    x: innerMargin,
    y: currentY,
    size: 9,
    color: rgb(0, 0, 0),
    maxWidth: contentWidth,
    align: "center",
  })

  // Footer section - at bottom
  page.drawText("Samarpan Blood Donor Network", {
    x: innerMargin,
    y: 65,
    size: 10,
    color: rgb(0.5, 0.05, 0.05),
    maxWidth: contentWidth,
    align: "center",
  })

  page.drawText("Dedicated to Saving Lives Through Blood Donation", {
    x: innerMargin,
    y: 40,
    size: 9,
    color: rgb(0, 0, 0),
    maxWidth: contentWidth,
    align: "center",
  })

  return await pdfDoc.save()
}