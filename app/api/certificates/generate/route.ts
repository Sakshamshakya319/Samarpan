import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { PDFDocument, rgb, PDFPage, StandardFonts } from "pdf-lib"

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
  // Use custom landscape size (2000 × 1545) for digital certificates
  const page = pdfDoc.addPage([2000, 1545])

  const { width, height } = page.getSize()
  const BASE_HEIGHT = 841.89
  const scale = height / BASE_HEIGHT
  const margin = 60 * scale
  const contentMargin = margin + 24 * scale
  const innerWidth = width - 2 * margin
  const primaryBlue = rgb(0.15, 0.35, 0.65)
  const darkGray = rgb(0.22, 0.22, 0.22)
  const lightGray = rgb(0.45, 0.45, 0.45)

  // Embed standard fonts for consistent bold/regular text across environments
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Frame
  page.drawRectangle({
    x: margin,
    y: margin,
    width: innerWidth,
    height: height - 2 * margin,
    borderColor: primaryBlue,
    borderWidth: 2,
  })

  // Top accent bar
  const barHeight = 90 * scale
  page.drawRectangle({
    x: margin,
    y: height - margin - barHeight,
    width: innerWidth,
    height: barHeight,
    color: rgb(0.95, 0.97, 1),
    borderColor: primaryBlue,
    borderWidth: 0.5 * scale,
  })

  let currentY = height - margin - 20 * scale

  // Logo in bar (left)
  if (options?.logoData) {
    try {
      const isPng = options.logoData.startsWith("data:image/png")
      const logoImageBytes = Buffer.from(
        options.logoData.replace(/^data:image\/\w+;base64,/, ""),
        "base64",
      )
      const logoImage = isPng
        ? await pdfDoc.embedPng(logoImageBytes)
        : await pdfDoc.embedJpg(logoImageBytes)
      page.drawImage(logoImage, {
        x: margin + 18 * scale,
        y: height - margin - barHeight + 10 * scale,
        width: 70 * scale,
        height: 70 * scale,
      })
    } catch (err) {
      console.error("Error embedding logo:", err)
    }
  }

  // Centered title
  const title = "CERTIFICATE OF APPRECIATION"
  const titleSize = 58 * scale
  const titleWidth = fontBold.widthOfTextAtSize(title, titleSize)
  const titleX = margin + (innerWidth - titleWidth) / 2
  const titleY = height - margin - barHeight / 2 + 12 * scale
  page.drawText(title, {
    x: titleX,
    y: titleY,
    size: titleSize,
    font: fontBold,
    color: primaryBlue,
  })

  currentY = height - margin - barHeight - 80 * scale

  // Subtitle centered
  const subtitle = "This is to certify that"
  const subtitleSize = 14 * scale
  const subtitleWidth = font.widthOfTextAtSize(subtitle, subtitleSize)
  page.drawText(subtitle, {
    x: margin + (innerWidth - subtitleWidth) / 2,
    y: currentY,
    size: subtitleSize,
    font,
    color: darkGray,
  })

  currentY -= 44 * scale

  const nameText = (user.name || "").toUpperCase()
  const nameSize = 44 * scale
  const nameWidth = fontBold.widthOfTextAtSize(nameText, nameSize)
  page.drawText(nameText, {
    x: margin + (innerWidth - nameWidth) / 2,
    y: currentY,
    size: nameSize,
    font: fontBold,
    color: primaryBlue,
  })

  currentY -= 54 * scale

  const bodyText = "has generously donated blood and contributed to saving lives."
  const bodySize = 14 * scale
  const bodyWidth = font.widthOfTextAtSize(bodyText, bodySize)
  page.drawText(bodyText, {
    x: margin + (innerWidth - bodyWidth) / 2,
    y: currentY,
    size: bodySize,
    font,
    color: darkGray,
  })

  currentY -= 60 * scale

  // Donations pill centered
  const pillWidth = 360 * scale
  const pillHeight = 48 * scale
  const pillX = margin + (innerWidth - pillWidth) / 2
  const pillY = currentY - pillHeight
  page.drawRectangle({ x: pillX, y: pillY, width: pillWidth, height: pillHeight, color: primaryBlue })
  const pillText = `Total Donations: ${certificate.donationCount}`
  const pillTextSize = 20 * scale
  const pillTextWidth = fontBold.widthOfTextAtSize(pillText, pillTextSize)
  page.drawText(pillText, {
    x: margin + (innerWidth - pillTextWidth) / 2,
    y: pillY + 14 * scale,
    size: pillTextSize,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  currentY -= 92 * scale

  const issuedDate = new Date(certificate.issuedDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  page.drawText(`Certificate ID: ${certificate.certificateId}`, {
    x: margin + 20 * scale,
    y: currentY,
    size: 12 * scale,
    font,
    color: lightGray,
  })

  page.drawText(`Issued Date: ${issuedDate}`, {
    x: margin + 20 * scale,
    y: currentY - 18 * scale,
    size: 12 * scale,
    font,
    color: lightGray,
  })

  page.drawText("Verification Token:", {
    x: margin + 20 * scale,
    y: currentY - 38 * scale,
    size: 12 * scale,
    font,
    color: primaryBlue,
  })

  page.drawText(certificate.verificationToken, {
    x: margin + 20 * scale,
    y: currentY - 52 * scale,
    size: 10 * scale,
    font,
    color: primaryBlue,
  })

  page.drawText("To Verify Certificate:", {
    x: width - margin - 300 * scale,
    y: currentY,
    size: 12 * scale,
    font,
    color: darkGray,
  })

  page.drawText("Visit: /verify-certificate", {
    x: width - margin - 300 * scale,
    y: currentY - 18 * scale,
    size: 12 * scale,
    font,
    color: primaryBlue,
  })

  // Reduce whitespace before signature block
  currentY -= 52 * scale

  if (options?.signatureData) {
    try {
      const isSigPng = options.signatureData.startsWith("data:image/png")
      const signatureImageBytes = Buffer.from(
        options.signatureData.replace(/^data:image\/\w+;base64,/, ""),
        "base64",
      )
      const signatureImage = isSigPng
        ? await pdfDoc.embedPng(signatureImageBytes)
        : await pdfDoc.embedJpg(signatureImageBytes)
      page.drawImage(signatureImage, {
        x: contentMargin,
        y: currentY,
        width: 140 * scale,
        height: 40 * scale,
      })
    } catch (err) {
      console.error("Error embedding signature:", err)
    }
  }

  page.drawLine({
    start: { x: margin + 20 * scale, y: currentY - 3 * scale },
    end: { x: margin + 220 * scale, y: currentY - 3 * scale },
    color: rgb(0, 0, 0),
    thickness: 1.5 * scale,
  })

  page.drawText("Authorized Signature", {
    x: margin + 20 * scale,
    y: currentY - 22 * scale,
    size: 10 * scale,
    font,
    color: darkGray,
  })

  // Reduce spacing before footer line
  currentY -= 38 * scale

  page.drawLine({
    start: { x: margin + 20 * scale, y: currentY },
    end: { x: width - margin - 20 * scale, y: currentY },
    color: primaryBlue,
    thickness: 2 * scale,
  })

  currentY -= 28 * scale

  const org = "Samarpan Blood Donor Network"
  const orgSize = 14 * scale
  const orgWidth = fontBold.widthOfTextAtSize(org, orgSize)
  page.drawText(org, {
    x: margin + (innerWidth - orgWidth) / 2,
    y: currentY,
    size: orgSize,
    font: fontBold,
    color: primaryBlue,
  })

  currentY -= 16 * scale

  const tagline = "Dedicated to Saving Lives Through Blood Donation"
  const tagSize = 10 * scale
  const tagWidth = font.widthOfTextAtSize(tagline, tagSize)
  page.drawText(tagline, {
    x: margin + (innerWidth - tagWidth) / 2,
    y: currentY,
    size: tagSize,
    font,
    color: lightGray,
  })

  return await pdfDoc.save()
}
