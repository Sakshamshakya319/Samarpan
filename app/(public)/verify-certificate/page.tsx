import { CertificateVerifier } from "@/components/certificate-verifier"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verify Certificate | Samarpan Blood Donor Network",
  description: "Verify the authenticity of your blood donation certificate",
}

export default function VerifyCertificatePage() {
  return <CertificateVerifier />
}
