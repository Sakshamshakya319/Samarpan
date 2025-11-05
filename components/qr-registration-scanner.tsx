"use client"

import { useState } from "react"
import { QrScanner } from "@yudiel/react-qr-scanner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, QrCode, Camera, X, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react"

interface QRRegistrationData {
  registrationNumber: string
  name: string
  email?: string
  phone?: string
  bloodType?: string
}

interface QRRegistrationScannerProps {
  onScanSuccess?: (data: QRRegistrationData) => void
  onScanError?: (error: string) => void
  title?: string
  description?: string
}

export function QRRegistrationScanner({
  onScanSuccess,
  onScanError,
  title = "QR Code Registration Scanner",
  description = "Scan QR code to auto-fill registration details"
}: QRRegistrationScannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const [lastScannedData, setLastScannedData] = useState<QRRegistrationData | null>(null)

  const handleScan = (result: string[]) => {
    if (result.length > 0 && result[0]) {
      const qrData = result[0]
      console.log("QR Code scanned:", qrData)

      try {
        // Try to parse as JSON first
        const parsedData = JSON.parse(qrData) as QRRegistrationData

        // Validate required fields
        if (!parsedData.registrationNumber || !parsedData.name) {
          throw new Error("Invalid QR code format: missing required fields")
        }

        setLastScannedData(parsedData)
        setError("")
        setIsScanning(false)
        setIsOpen(false)
        onScanSuccess?.(parsedData)
      } catch (parseError) {
        // If not JSON, try to parse as simple text format: "REG:12345|NAME:John Doe|EMAIL:john@example.com"
        try {
          const parts = qrData.split('|')
          const data: QRRegistrationData = {
            registrationNumber: '',
            name: ''
          }

          parts.forEach(part => {
            const [key, value] = part.split(':')
            if (key && value) {
              const trimmedKey = key.trim().toUpperCase()
              const trimmedValue = value.trim()

              switch (trimmedKey) {
                case 'REG':
                case 'REGISTRATION':
                case 'REGNO':
                  data.registrationNumber = trimmedValue
                  break
                case 'NAME':
                case 'FULLNAME':
                  data.name = trimmedValue
                  break
                case 'EMAIL':
                  data.email = trimmedValue
                  break
                case 'PHONE':
                case 'MOBILE':
                  data.phone = trimmedValue
                  break
                case 'BLOODTYPE':
                case 'BLOOD':
                  data.bloodType = trimmedValue
                  break
              }
            }
          })

          if (!data.registrationNumber || !data.name) {
            throw new Error("Invalid QR code format: missing registration number or name")
          }

          setLastScannedData(data)
          setError("")
          setIsScanning(false)
          setIsOpen(false)
          onScanSuccess?.(data)
        } catch (textParseError) {
          const errorMsg = "Invalid QR code format. Expected JSON or 'REG:123|NAME:John|EMAIL:john@example.com' format"
          setError(errorMsg)
          onScanError?.(errorMsg)
          console.error("QR parsing error:", textParseError)
        }
      }
    }
  }

  const handleError = (error: any) => {
    console.error("QR Scanner error:", error)
    let errorMessage = "Failed to access camera. Please try again."

    if (error?.message) {
      errorMessage = error.message
    }

    setError(errorMessage)
    onScanError?.(errorMessage)
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsScanning(false)
    setError("")
  }

  const startScanning = () => {
    setIsOpen(true)
    setIsScanning(true)
    setError("")
  }

  return (
    <>
      <Button
        onClick={startScanning}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <QrCode className="w-4 h-4" />
        Scan QR Code
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {lastScannedData && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-1">
                    <p><strong>Registration:</strong> {lastScannedData.registrationNumber}</p>
                    <p><strong>Name:</strong> {lastScannedData.name}</p>
                    {lastScannedData.email && <p><strong>Email:</strong> {lastScannedData.email}</p>}
                    {lastScannedData.phone && <p><strong>Phone:</strong> {lastScannedData.phone}</p>}
                    {lastScannedData.bloodType && <p><strong>Blood Type:</strong> {lastScannedData.bloodType}</p>}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {isScanning && (
              <div className="relative">
                <QrScanner
                  onDecode={handleScan}
                  onError={handleError}
                  constraints={{
                    facingMode: "environment",
                    aspectRatio: 1,
                  }}
                  scanDelay={300}
                  styles={{
                    container: {
                      width: "100%",
                      height: "300px",
                    },
                    video: {
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    },
                  }}
                />
                <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-32 h-32 border-2 border-primary rounded-lg bg-transparent"></div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground">
              Position QR code within the frame to scan
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}