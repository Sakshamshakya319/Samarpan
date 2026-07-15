import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import crypto from "crypto"

// Generate unique certificate token and ID
function generateCertificateCredentials() {
  const certificateId = `VC-${Date.now().toString().slice(-8)}`
  const certificateToken = crypto.randomBytes(16).toString('hex').toUpperCase()
  return { certificateId, certificateToken }
}

export async function generateVolunteerCertificate(
  volunteer: any,
  event: any,
  ngo: any,
  options?: { 
    logoData?: string | null; 
    signatureData?: string | null;
    existingCertificateId?: string;
    existingToken?: string;
    issuedDate?: Date;
  }
): Promise<{ pdfBytes: Uint8Array; certificateId: string; certificateToken: string }> {
  try {
    const pdfDoc = await PDFDocument.create()
    
    // A4 Landscape dimensions in points
    const page = pdfDoc.addPage([841.89, 595.28])
    const { width, height } = page.getSize()

    // Generate certificate credentials (use existing if provided)
    const { certificateId, certificateToken } = options?.existingCertificateId && options?.existingToken 
      ? { certificateId: options.existingCertificateId, certificateToken: options.existingToken }
      : generateCertificateCredentials()

    // Safe margins and spacing
    const margin = 50
    const innerWidth = width - 2 * margin
    const contentWidth = innerWidth * 0.9 // Use 90% of inner width for content

    // Color palette
    const primaryBlue = rgb(0.11, 0.36, 0.70)
    const darkGray = rgb(0.22, 0.22, 0.22)
    const lightGray = rgb(0.45, 0.45, 0.45)
    const goldAccent = rgb(0.85, 0.65, 0.13)
    const lightBlue = rgb(0.96, 0.98, 1)

    // Embed fonts safely
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // === Decorative Border ===
    try {
      // Outer border
      page.drawRectangle({
        x: margin - 15,
        y: margin - 15,
        width: innerWidth + 30,
        height: height - 2 * (margin - 15),
        borderColor: goldAccent,
        borderWidth: 3,
      })
      
      // Inner border
      page.drawRectangle({
        x: margin - 5,
        y: margin - 5,
        width: innerWidth + 10,
        height: height - 2 * (margin - 5),
        borderColor: primaryBlue,
        borderWidth: 1.5,
      })
    } catch (borderError) {
      console.warn("Border drawing error:", borderError)
    }

    // === Header Section ===
    const headerHeight = 90
    const headerY = height - margin - headerHeight
    
    try {
      page.drawRectangle({
        x: margin,
        y: headerY,
        width: innerWidth,
        height: headerHeight,
        color: lightBlue,
      })
    } catch (headerError) {
      console.warn("Header background error:", headerError)
    }

    // === Certificate Title ===
    const title = "VOLUNTEER CERTIFICATE"
    const titleSize = 32
    const titleWidth = fontBold.widthOfTextAtSize(title, titleSize)
    const titleX = margin + (innerWidth - titleWidth) / 2
    const titleY = headerY + headerHeight / 2 + 8
    
    page.drawText(title, {
      x: titleX,
      y: titleY,
      size: titleSize,
      font: fontBold,
      color: primaryBlue,
    })

    // === Decorative Underline ===
    const underlineWidth = titleWidth * 0.6
    const underlineX = margin + (innerWidth - underlineWidth) / 2
    const underlineY = titleY - 6
    
    page.drawLine({
      start: { x: underlineX, y: underlineY },
      end: { x: underlineX + underlineWidth, y: underlineY },
      color: goldAccent,
      thickness: 2,
    })

    // === NGO Name in Header ===
    if (ngo?.name) {
      const ngoText = `Presented by ${ngo.name}`
      const ngoSize = 11
      const ngoWidth = font.widthOfTextAtSize(ngoText, ngoSize)
      page.drawText(ngoText, {
        x: margin + (innerWidth - ngoWidth) / 2,
        y: titleY - 22,
        size: ngoSize,
        font,
        color: darkGray,
      })
    }

    // === Main Content ===
    let currentY = headerY - 60

    // "This is to certify that"
    const certText = "This is to certify that"
    const certSize = 14
    const certWidth = font.widthOfTextAtSize(certText, certSize)
    page.drawText(certText, {
      x: margin + (innerWidth - certWidth) / 2,
      y: currentY,
      size: certSize,
      font,
      color: darkGray,
    })

    currentY -= 45

    // Volunteer Name
    const volunteerName = (volunteer.userName || volunteer.name || "Unknown Volunteer").toUpperCase()
    const nameSize = 28
    
    // Ensure name fits within content width
    let adjustedNameSize = nameSize
    let nameWidth = fontBold.widthOfTextAtSize(volunteerName, adjustedNameSize)
    
    while (nameWidth > contentWidth && adjustedNameSize > 16) {
      adjustedNameSize -= 1
      nameWidth = fontBold.widthOfTextAtSize(volunteerName, adjustedNameSize)
    }
    
    page.drawText(volunteerName, {
      x: margin + (innerWidth - nameWidth) / 2,
      y: currentY,
      size: adjustedNameSize,
      font: fontBold,
      color: primaryBlue,
    })

    currentY -= 50

    // Achievement Text
    const achievementText = "has successfully volunteered for the event"
    const achievementSize = 12
    const achievementWidth = font.widthOfTextAtSize(achievementText, achievementSize)
    page.drawText(achievementText, {
      x: margin + (innerWidth - achievementWidth) / 2,
      y: currentY,
      size: achievementSize,
      font,
      color: darkGray,
    })

    currentY -= 35

    // Event Name
    const eventName = `"${event.title || 'Event'}"`
    const eventNameSize = 16
    
    // Ensure event name fits
    let adjustedEventSize = eventNameSize
    let eventNameWidth = fontBold.widthOfTextAtSize(eventName, adjustedEventSize)
    
    while (eventNameWidth > contentWidth && adjustedEventSize > 12) {
      adjustedEventSize -= 1
      eventNameWidth = fontBold.widthOfTextAtSize(eventName, adjustedEventSize)
    }
    
    page.drawText(eventName, {
      x: margin + (innerWidth - eventNameWidth) / 2,
      y: currentY,
      size: adjustedEventSize,
      font: fontBold,
      color: primaryBlue,
    })

    currentY -= 40

    // Event Details
    const eventDate = event.eventDate ? 
      new Date(event.eventDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) : "Date TBD"
    
    const eventDetailsText = `held on ${eventDate} at ${event.location || 'Event Location'}`
    const eventDetailsSize = 11
    
    // Handle long event details
    const maxEventDetailsWidth = contentWidth
    let eventDetailsLines = []
    
    if (font.widthOfTextAtSize(eventDetailsText, eventDetailsSize) > maxEventDetailsWidth) {
      // Split into multiple lines if too long
      const words = eventDetailsText.split(' ')
      let currentLine = ''
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        if (font.widthOfTextAtSize(testLine, eventDetailsSize) <= maxEventDetailsWidth) {
          currentLine = testLine
        } else {
          if (currentLine) {
            eventDetailsLines.push(currentLine)
            currentLine = word
          } else {
            eventDetailsLines.push(word)
          }
        }
      }
      if (currentLine) {
        eventDetailsLines.push(currentLine)
      }
    } else {
      eventDetailsLines = [eventDetailsText]
    }
    
    // Draw event details lines
    for (let i = 0; i < eventDetailsLines.length; i++) {
      const lineWidth = font.widthOfTextAtSize(eventDetailsLines[i], eventDetailsSize)
      page.drawText(eventDetailsLines[i], {
        x: margin + (innerWidth - lineWidth) / 2,
        y: currentY - (i * 15),
        size: eventDetailsSize,
        font,
        color: darkGray,
      })
    }

    currentY -= (eventDetailsLines.length * 15) + 30

    // Appreciation Text
    const appreciationText = "We appreciate your dedication and commitment to making a positive impact in the community."
    const appreciationSize = 10
    const maxAppreciationWidth = contentWidth
    
    // Split appreciation text into lines
    const appreciationWords = appreciationText.split(' ')
    const appreciationLines = []
    let currentAppreciationLine = ''
    
    for (const word of appreciationWords) {
      const testLine = currentAppreciationLine ? `${currentAppreciationLine} ${word}` : word
      if (font.widthOfTextAtSize(testLine, appreciationSize) <= maxAppreciationWidth) {
        currentAppreciationLine = testLine
      } else {
        if (currentAppreciationLine) {
          appreciationLines.push(currentAppreciationLine)
          currentAppreciationLine = word
        } else {
          appreciationLines.push(word)
        }
      }
    }
    if (currentAppreciationLine) {
      appreciationLines.push(currentAppreciationLine)
    }
    
    // Draw appreciation lines
    for (let i = 0; i < appreciationLines.length; i++) {
      const lineWidth = font.widthOfTextAtSize(appreciationLines[i], appreciationSize)
      page.drawText(appreciationLines[i], {
        x: margin + (innerWidth - lineWidth) / 2,
        y: currentY - (i * 12),
        size: appreciationSize,
        font,
        color: darkGray,
      })
    }

    currentY -= (appreciationLines.length * 12) + 25

    // === Decorative Element ===
    const decorativeWidth = 100
    const decorativeX = margin + (innerWidth - decorativeWidth) / 2
    
    page.drawRectangle({
      x: decorativeX,
      y: currentY,
      width: decorativeWidth,
      height: 2,
      color: goldAccent,
    })

    // === Footer Section ===
    const footerY = margin + 50

    // Certificate Details (Left Side)
    const leftX = margin + 25
    const issuedDate = options?.issuedDate 
      ? options.issuedDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })

    const footerFontSize = 8
    const footerLineHeight = 12

    page.drawText(`Certificate ID: ${certificateId}`, {
      x: leftX,
      y: footerY + 36,
      size: footerFontSize,
      font,
      color: lightGray,
    })

    page.drawText(`Certificate Token: ${certificateToken}`, {
      x: leftX,
      y: footerY + 24,
      size: footerFontSize,
      font,
      color: lightGray,
    })

    page.drawText(`Issue Date: ${issuedDate}`, {
      x: leftX,
      y: footerY + 12,
      size: footerFontSize,
      font,
      color: lightGray,
    })

    if (ngo?.name) {
      page.drawText(`Issued by: ${ngo.name}`, {
        x: leftX,
        y: footerY,
        size: footerFontSize,
        font,
        color: lightGray,
      })
    }

    page.drawText("Verify at: /verify-certificate", {
      x: leftX,
      y: footerY - 12,
      size: footerFontSize,
      font,
      color: primaryBlue,
    })

    // === Signature Section (Right Side) ===
    const sigX = width - margin - 160
    const sigY = footerY + 10
    const sigWidth = 120
    const sigHeight = 35

    // Signature Line
    page.drawLine({
      start: { x: sigX, y: sigY },
      end: { x: sigX + sigWidth, y: sigY },
      color: darkGray,
      thickness: 0.8,
    })

    // Authorized Signature Text
    const sigText = ngo?.authorizedPerson || "Authorized Signature"
    const sigTextSize = 9
    const sigTextWidth = font.widthOfTextAtSize(sigText, sigTextSize)
    const sigTextX = sigX + (sigWidth - sigTextWidth) / 2

    page.drawText(sigText, {
      x: sigTextX,
      y: sigY - 12,
      size: sigTextSize,
      font,
      color: darkGray,
    })

    if (ngo?.name) {
      const ngoNameText = ngo.name
      const ngoNameSize = 7
      const ngoNameWidth = font.widthOfTextAtSize(ngoNameText, ngoNameSize)
      const ngoNameX = sigX + (sigWidth - ngoNameWidth) / 2

      page.drawText(ngoNameText, {
        x: ngoNameX,
        y: sigY - 22,
        size: ngoNameSize,
        font,
        color: lightGray,
      })
    }

    // Handle images safely
    if (options?.logoData) {
      try {
        const logoBytes = Buffer.from(
          options.logoData.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        )
        
        let logo
        if (options.logoData.startsWith("data:image/png")) {
          logo = await pdfDoc.embedPng(logoBytes)
        } else {
          logo = await pdfDoc.embedJpg(logoBytes)
        }
        
        const logoSize = 50
        page.drawImage(logo, {
          x: margin + 15,
          y: headerY + (headerHeight - logoSize) / 2,
          width: logoSize,
          height: logoSize,
        })
      } catch (logoError) {
        console.warn("Logo embedding error:", logoError)
      }
    }

    if (options?.signatureData) {
      try {
        const sigBytes = Buffer.from(
          options.signatureData.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        )
        
        let sigImg
        if (options.signatureData.startsWith("data:image/png")) {
          sigImg = await pdfDoc.embedPng(sigBytes)
        } else {
          sigImg = await pdfDoc.embedJpg(sigBytes)
        }

        page.drawImage(sigImg, {
          x: sigX,
          y: sigY + 5,
          width: sigWidth,
          height: sigHeight,
        })
      } catch (sigError) {
        console.warn("Signature embedding error:", sigError)
      }
    }

    const pdfBytes = await pdfDoc.save()
    
    return {
      pdfBytes,
      certificateId,
      certificateToken
    }
    
  } catch (error) {
    console.error("Certificate generation error:", error)
    throw new Error(`Failed to generate certificate: ${error.message}`)
  }
}