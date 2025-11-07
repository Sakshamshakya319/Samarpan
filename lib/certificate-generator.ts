import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export async function generateCertificateDesign(
  certificate: any,
  user: any,
  options?: { logoData?: string | null; signatureData?: string | null },
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([2000, 1545])
  const { width, height } = page.getSize()

  const scale = height / 841.89
  const margin = 90 * scale
  const innerWidth = width - 2 * margin

  const primaryBlue = rgb(0.11, 0.36, 0.70)
  const darkGray = rgb(0.22, 0.22, 0.22)
  const lightGray = rgb(0.45, 0.45, 0.45)
  const white = rgb(1, 1, 1)

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // === Outer Frames ===
  page.drawRectangle({
    x: margin - 20 * scale,
    y: margin - 20 * scale,
    width: innerWidth + 40 * scale,
    height: height - 2 * (margin - 20 * scale),
    borderColor: primaryBlue,
    borderWidth: 3 * scale,
  })
  page.drawRectangle({
    x: margin - 8 * scale,
    y: margin - 8 * scale,
    width: innerWidth + 16 * scale,
    height: height - 2 * (margin - 8 * scale),
    borderColor: primaryBlue,
    borderWidth: 1 * scale,
  })

  // === Header Bar ===
  const barHeight = 120 * scale
  page.drawRectangle({
    x: margin,
    y: height - margin - barHeight,
    width: innerWidth,
    height: barHeight,
    color: rgb(0.96, 0.98, 1),
  })

  // === Logo ===
  if (options?.logoData) {
    try {
      const isPng = options.logoData.startsWith("data:image/png")
      const logoBytes = Buffer.from(
        options.logoData.replace(/^data:image\/\w+;base64,/, ""),
        "base64",
      )
      const logo = isPng ? await pdfDoc.embedPng(logoBytes) : await pdfDoc.embedJpg(logoBytes)
      page.drawImage(logo, {
        x: margin + 30 * scale,
        y: height - margin - barHeight + 10 * scale,
        width: 100 * scale,
        height: 100 * scale,
      })
    } catch (err) {
      console.error("Error embedding logo:", err)
    }
  }

  // === Title ===
  const title = "CERTIFICATE OF APPRECIATION"
  const titleSize = 60
  const titleWidth = fontBold.widthOfTextAtSize(title, titleSize)
  const titleX = margin + (innerWidth - titleWidth) / 2
  const titleY = height - margin - barHeight / 2 + 10 * scale
  page.drawText(title, {
    x: titleX,
    y: titleY,
    size: titleSize,
    font: fontBold,
    color: primaryBlue,
  })

  // Underline Accent
  const underlineWidth = titleWidth * 0.55
  const underlineX = margin + (innerWidth - underlineWidth) / 2
  const underlineY = titleY - 10 * scale
  page.drawLine({
    start: { x: underlineX, y: underlineY },
    end: { x: underlineX + underlineWidth, y: underlineY },
    color: primaryBlue,
    thickness: 2 * scale,
  })

  // === Body Section ===
  let currentY = height - margin - barHeight - 110 * scale

  const subtitle = "This is to certify that"
  const subtitleSize = 16 * scale
  const subtitleWidth = font.widthOfTextAtSize(subtitle, subtitleSize)
  page.drawText(subtitle, {
    x: margin + (innerWidth - subtitleWidth) / 2,
    y: currentY,
    size: subtitleSize,
    font,
    color: darkGray,
  })

  currentY -= 60 * scale

  const name = (user.name || "").toUpperCase()
  const nameSize = 50 * scale
  const nameWidth = fontBold.widthOfTextAtSize(name, nameSize)
  page.drawText(name, {
    x: margin + (innerWidth - nameWidth) / 2,
    y: currentY,
    size: nameSize,
    font: fontBold,
    color: primaryBlue,
  })

  currentY -= 70 * scale

  const bodyText = "has generously donated blood and contributed to saving lives."
  const bodySize = 16 * scale
  const bodyWidth = font.widthOfTextAtSize(bodyText, bodySize)
  page.drawText(bodyText, {
    x: margin + (innerWidth - bodyWidth) / 2,
    y: currentY,
    size: bodySize,
    font,
    color: darkGray,
  })

  currentY -= 90 * scale

  // === Donation Box ===
  const pillWidth = 360 * scale
  const pillHeight = 45 * scale
  const pillX = margin + (innerWidth - pillWidth) / 2
  const pillY = currentY - pillHeight
  page.drawRectangle({
    x: pillX,
    y: pillY,
    width: pillWidth,
    height: pillHeight,
    color: primaryBlue,
  })
  const pillText = `Total Donations: ${certificate.donationCount}`
  const pillTextSize = 18 * scale
  const pillTextWidth = fontBold.widthOfTextAtSize(pillText, pillTextSize)
  page.drawText(pillText, {
    x: margin + (innerWidth - pillTextWidth) / 2,
    y: pillY + 12 * scale,
    size: pillTextSize,
    font: fontBold,
    color: white,
  })

  // === Footer Section ===
  currentY -= 130 * scale
  const leftX = margin + 25 * scale
  const issuedDate = new Date(certificate.issuedDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Certificate details block
  page.drawText(`Certificate ID: ${certificate.certificateId}`, {
    x: leftX,
    y: currentY,
    size: 12 * scale,
    font,
    color: lightGray,
  })

  if (certificate.verificationToken) {
    page.drawText(`Verification Token: ${certificate.verificationToken}`, {
      x: leftX,
      y: currentY - 18 * scale,
      size: 12 * scale,
      font,
      color: lightGray,
    })
    currentY -= 18 * scale
  }

  page.drawText(`Issued Date: ${issuedDate}`, {
    x: leftX,
    y: currentY - 22 * scale,
    size: 12 * scale,
    font,
    color: lightGray,
  })

  page.drawText("Verify Certificate: /verify-certificate", {
    x: leftX,
    y: currentY - 44 * scale,
    size: 12 * scale,
    font,
    color: primaryBlue,
  })

  // === Signature (Updated alignment) ===
  if (options?.signatureData) {
    try {
      const isPng = options.signatureData.startsWith("data:image/png")
      const sigBytes = Buffer.from(
        options.signatureData.replace(/^data:image\/\w+;base64,/, ""),
        "base64",
      )
      const sigImg = isPng
        ? await pdfDoc.embedPng(sigBytes)
        : await pdfDoc.embedJpg(sigBytes)

      // Aligned image and text perfectly on the same horizontal line
      const sigWidth = 180 * scale
      const sigHeight = 60 * scale
      const sigX = width - margin - 270 * scale
      const sigY = margin + 60 * scale

      // Draw the signature image
      page.drawImage(sigImg, {
        x: sigX,
        y: sigY,
        width: sigWidth,
        height: sigHeight,
      })

      // Draw “Authorized Signature” aligned horizontally beside image bottom edge
      const text = "Authorized Signature"
      const textSize = 12 * scale
      const textWidth = font.widthOfTextAtSize(text, textSize)
      const textX = sigX + (sigWidth - textWidth) / 2 // horizontally centered under signature
      const textY = sigY - 10 * scale // adjusted upward so line alignment matches image bottom

      page.drawText(text, {
        x: textX,
        y: textY,
        size: textSize,
        font,
        color: darkGray,
      })
    } catch (err) {
      console.error("Error embedding signature:", err)
    }
  }

  return await pdfDoc.save()
}
