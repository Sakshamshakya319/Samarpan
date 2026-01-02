"use client"

import { useState } from "react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { Download, QrCode, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QRCodeGeneratorProps {
  registrationId: string
  alphanumericToken: string
  userName: string
  eventTitle: string
  eventDate: string
  timeSlot: string
}

export function QRCodeGenerator({
  registrationId,
  alphanumericToken,
  userName,
  eventTitle,
  eventDate,
  timeSlot,
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const generateQRCode = async () => {
    setIsGenerating(true)
    try {
      // Create QR data object following the module specification
      const qrData = {
        registrationId,
        alphanumericToken,
        userName,
        eventTitle,
        eventDate,
        timeSlot,
        type: "event-registration",
        generatedAt: new Date().toISOString(),
      }

      // Validate required data
      if (!registrationId || !alphanumericToken || !userName) {
        throw new Error("Missing required registration data")
      }

      // Generate QR code with high error correction for better scanning
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: "M",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 256,
      })

      if (!qrCodeDataUrl) {
        throw new Error("Failed to generate QR code data URL")
      }

      setQrCodeUrl(qrCodeDataUrl)
      toast({
        title: "Success",
        description: "QR code generated successfully!",
      })
    } catch (error) {
      console.error("Error generating QR code:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate QR code"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return

    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `${userName.replace(/\s+/g, "-")}-${alphanumericToken}-qr.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast({
      title: "Success",
      description: "QR code downloaded!",
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-4">
        {/* Event Details */}
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm">
            <p className="font-medium">{eventTitle}</p>
            <p className="text-gray-600">{formatDate(eventDate)}</p>
            <p className="text-gray-600">Time: {timeSlot}</p>
          </div>
        </div>

        {/* QR Code Display */}
        {qrCodeUrl ? (
          <div className="text-center space-y-3">
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
              <img
                src={qrCodeUrl}
                alt="Event Registration QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-xs text-gray-500">
              Keep this QR code safe and show it during the event
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <QrCode className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Generate your QR code to get started</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!qrCodeUrl ? (
            <Button
              onClick={generateQRCode}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Generate QR Code
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={downloadQRCode}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Present this QR code to the admin during the event</p>
          <p>• Keep your phone charged or download the image</p>
          <p>• Your attendance will be marked when the admin scans this QR code</p>
        </div>
      </div>
    </div>
  )
}