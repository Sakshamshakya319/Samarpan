"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, QrCode, CheckCircle2, AlertCircle, Copy, RefreshCw } from "lucide-react"


interface AdminQRCheckerProps {
  token: string
}

interface RegistrationDetails {
  _id: string
  name: string
  registrationNumber: string
  email: string
  phone?: string
  timeSlot: string
  tokenVerified: boolean
  donationStatus: string
  createdAt: string
  event?: {
    title: string
    location: string
    date: string
  }
}

export function AdminQRChecker({ token }: AdminQRCheckerProps) {
  const [qrInput, setQrInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [registrationDetails, setRegistrationDetails] = useState<RegistrationDetails | null>(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSearchQR = async (qrToken?: string) => {
    const tokenToSearch = qrToken || qrInput.trim()
    
    if (!tokenToSearch) {
      setErrorMessage("Please enter a QR token")
      return
    }

    setIsLoading(true)
    setErrorMessage("")
    setSuccessMessage("")
    setRegistrationDetails(null)

    try {
      const response = await fetch(
        `/api/event-registrations/qr-verify?alphanumericToken=${encodeURIComponent(tokenToSearch)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRegistrationDetails(data.registration)
        if (!qrToken) {
          // Update input only if not from scanner
          setQrInput(tokenToSearch)
        }
      } else {
        const data = await response.json()
        setErrorMessage(data.error || "QR token not found")
      }
    } catch (err) {
      setErrorMessage("Error searching for QR code")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyQR = async () => {
    if (!registrationDetails) return

    setIsVerifying(true)
    setErrorMessage("")

    try {
      console.log("Verifying QR for registration:", registrationDetails._id)
      
      const response = await fetch("/api/event-registrations/qr-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          alphanumericToken: qrInput,
          registrationId: registrationDetails._id,
        }),
      })

      if (response.ok) {
        console.log("✓ QR verification successful")
        setSuccessMessage("✓ QR verified! Donation recorded successfully.")
        
        // Auto-clear after success for next scan
        setTimeout(() => {
          setRegistrationDetails(null)
          setQrInput("")
          setSuccessMessage("")
        }, 2500)
      } else {
        const data = await response.json()
        const errorMsg = data.error || "Failed to verify QR code"
        console.error("Verification failed:", errorMsg)
        setErrorMessage(errorMsg)
      }
    } catch (err) {
      console.error("Error verifying QR code:", err)
      setErrorMessage("Network error: Failed to verify QR code")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCopyQR = () => {
    navigator.clipboard.writeText(qrInput)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* QR Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Alphanumeric Token Verification
          </CardTitle>
          <CardDescription>
            Enter 6-digit alphanumeric tokens to verify blood donations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMessage && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <label className="block text-sm font-medium">Alphanumeric Token</label>

            {/* Input and Buttons */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter 6-digit token (e.g., ABC123)"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value.toUpperCase())}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && qrInput.trim()) {
                    handleSearchQR()
                  }
                }}
                className="font-mono flex-1"
                maxLength={6}
              />
              <Button
                onClick={() => handleSearchQR()}
                disabled={isLoading || !qrInput.trim()}
                title="Search for this alphanumeric token"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Details Card */}
      {registrationDetails && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Registration Details</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Token: {qrInput}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    registrationDetails.tokenVerified ? "default" : "secondary"
                  }
                >
                  {registrationDetails.donationStatus}
                </Badge>
                <Button
                  onClick={() => {
                    setRegistrationDetails(null)
                    setQrInput("")
                    setErrorMessage("")
                    setSuccessMessage("")
                  }}
                  variant="outline"
                  size="sm"
                  title="Clear and enter another token"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Registration Number</p>
                <p className="font-bold text-lg">{registrationDetails.registrationNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Full Name</p>
                <p className="font-semibold">{registrationDetails.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p>{registrationDetails.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p>{registrationDetails.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Time Slot</p>
                <p className="font-semibold">{registrationDetails.timeSlot}</p>
              </div>

              {registrationDetails.event && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Event</p>
                    <p className="font-semibold">{registrationDetails.event.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p>{registrationDetails.event.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Event Date</p>
                    <p>{formatDate(registrationDetails.event.date)}</p>
                  </div>
                </>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-1">Registration Date</p>
                <p>{formatDate(registrationDetails.createdAt)}</p>
              </div>
            </div>

            {/* Token Display */}
            <div className="bg-white p-3 rounded-lg border border-gray-200 mt-4">
              <p className="text-xs text-gray-600 mb-1 font-medium">Token:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm bg-gray-100 p-2 rounded overflow-auto">
                  {qrInput}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyQR}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Status Display */}
            {registrationDetails.tokenVerified && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  This donation has already been verified and recorded.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            {!registrationDetails.tokenVerified && (
              <Button
                onClick={handleVerifyQR}
                disabled={isVerifying}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}