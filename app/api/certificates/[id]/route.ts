import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { generateCertificateDesign } from "@/lib/certificate-generator"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const certificates = db.collection("certificates")
    const users = db.collection("users")

    const certificate = await certificates.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(decoded.userId),
    })

    if (!certificate)
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })

    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 })

    const pdfBytes = await generateCertificateDesign(certificate, user, {
      logoData: certificate.imageData || null,
      signatureData: certificate.signatureData || null,
    })

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${certificate.certificateId}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Download certificate error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// design function moved to shared lib
