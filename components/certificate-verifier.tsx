"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle, Loader2, Search, Info, Eye, EyeOff } from "lucide-react"

interface VerificationResult {
  verified: boolean
  certificate?: {
    certificateId: string
    donationCount: number
    issuedDate: string
    status: string
    recipientName: string
    recipientEmail: string
  }
}

export function CertificateVerifier() {
  const [certificateId, setCertificateId] = useState("")
  const [verificationToken, setVerificationToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState("")

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setResult(null)
    setLoading(true)

    try {
      const response = await fetch("/api/certificates/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          certificateId: certificateId.trim(),
          verificationToken: verificationToken.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Failed to verify certificate")
      }
    } catch (err) {
      setError("Error verifying certificate. Please check your connection and try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Search className="w-6 h-6" />
              Verify Certificate
            </CardTitle>
            <CardDescription className="text-blue-100 text-base mt-2">
              Validate your blood donation certificate authenticity and view your details
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8">
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="certificateId" className="text-sm font-semibold text-gray-800">
                  Certificate ID
                </label>
                <Input
                  id="certificateId"
                  placeholder="e.g., CERT-1762435257159-YM0R1DNQD"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  disabled={loading}
                  className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">Format: CERT-TIMESTAMP-CODE</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="token" className="text-sm font-semibold text-gray-800">
                  Verification Token
                </label>
                <div className="relative">
                  <Input
                    id="token"
                    placeholder="Enter your 32-character verification token"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    disabled={loading}
                    type={showToken ? "text" : "password"}
                    className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={!verificationToken}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Found on your certificate PDF</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Where to find your details:</p>
                  <p className="text-xs">Your Certificate ID and Verification Token were sent to your email when the certificate was issued.</p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Verification Failed</p>
                    <p className="text-xs mt-1">{error}</p>
                    <p className="text-xs mt-2 font-medium">Possible reasons:</p>
                    <ul className="text-xs mt-1 space-y-1 list-disc list-inside">
                      <li>Certificate ID or token is incorrect</li>
                      <li>Certificate has been revoked or expired</li>
                      <li>Certificate does not exist in the system</li>
                    </ul>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !certificateId.trim() || !verificationToken.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying Certificate...
                  </>
                ) : (
                  "Verify Certificate"
                )}
              </Button>
            </form>

            {result && result.verified && result.certificate && (
              <div className="mt-8 space-y-4">
                <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-green-900 text-lg">Certificate Verified ✓</h3>
                    <p className="text-sm text-green-800 mt-1">This is a valid and authentic certificate issued by Samarpan Blood Donor Network</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Recipient Name</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{result.certificate.recipientName}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</p>
                      <p className="text-sm font-mono text-gray-700 mt-1 break-all">{result.certificate.recipientEmail}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Donations</p>
                      <p className="text-3xl font-bold text-blue-600 mt-1">{result.certificate.donationCount}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Issue Date</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {new Date(result.certificate.issuedDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Certificate ID</p>
                    <p className="text-xs font-mono bg-gray-100 p-3 rounded mt-2 break-all text-gray-700">
                      {result.certificate.certificateId}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</p>
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase tracking-wider">
                      {result.certificate.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-white rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Need Help?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Certificate ID not found?</strong> Check your email for the certificate notification sent when it was issued</li>
            <li>• <strong>Lost your token?</strong> Contact the Samarpan team for assistance in verifying your identity</li>
            <li>• <strong>Issues with verification?</strong> Ensure you've copied the exact Certificate ID and Verification Token</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
