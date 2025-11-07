import { writeFileSync } from "fs"
import path from "path"
import { generateCertificateDesign } from "@/lib/certificate-generator"

async function main() {
  const certificate = {
    certificateId: "CERT-TEST-12345",
    donationCount: 3,
    issuedDate: new Date().toISOString(),
    verificationToken: "TOK-ABC123XYZ789",
    imageData: null,
    signatureData: null,
  }

  const user = {
    name: "Test User",
    email: "test@example.com",
  }

  const pdfBytes = await generateCertificateDesign(certificate, user, {})
  const outPath = path.join(process.cwd(), "test-certificate.pdf")
  writeFileSync(outPath, pdfBytes)
  console.log(`Wrote: ${outPath}`)
}

main().catch((err) => {
  console.error("Failed to render certificate:", err)
  process.exit(1)
})