"use client"

import { useState, useEffect } from "react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { Download, QrCode, Loader2, RefreshCw, CheckCircle2, XCircle, Copy } from "lucide-react"
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
  const [error, setError] = useState<string>("")
  const { toast } = useToast()

  // Auto-generate QR code when component mounts
  useEffect(() => {
    if (registrationId && alphanumericToken && userName && !qrCodeUrl) {
      generateQRCode()
    }
  }, [registrationId, alphanumericToken, userName])

  const generateQRCode = async () => {
    setIsGenerating(true)
    setError("")
    
    try {
      // Validate required data
      if (!registrationId || !alphanumericToken || !userName) {
        throw new Error("Missing required registration data")
      }

      // Create QR data object with enhanced structure
      const qrData = {
        type: "event-registration",
        version: "1.0",
        registrationId,
        token: alphanumericToken,
        user: {
          name: userName,
        },
        event: {
          title: eventTitle,
          date: eventDate,
          timeSlot: timeSlot,
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          platform: "samarpan",
        }
      }

      // Generate QR code with optimized settings for better scanning
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: "H", // High error correction for better reliability
        type: "image/png",
        quality: 0.95,
        margin: 2,
        color: {
          dark: "#1f2937", // Dark gray for better contrast
          light: "#ffffff",
        },
        width: 300, // Larger size for better scanning
      })

      if (!qrCodeDataUrl) {
        throw new Error("Failed to generate QR code data URL")
      }

      setQrCodeUrl(qrCodeDataUrl)
      
      // Success toast only on manual generation
      if (isGenerating) {
        toast({
          title: "QR Code Generated",
          description: "Your event registration QR code is ready!",
        })
      }
    } catch (error) {
      console.error("Error generating QR code:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate QR code"
      setError(errorMessage)
      toast({
        title: "QR Code Generation Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return

    try {
      const link = document.createElement("a")
      link.href = qrCodeUrl
      const fileName = `${eventTitle.replace(/[^a-zA-Z0-9]/g, "-")}-${alphanumericToken}.png`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Download Complete",
        description: "QR code saved to your device!",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download QR code. Please try again.",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async () => {
    if (!qrCodeUrl) return

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      
      toast({
        title: "Copied to Clipboard",
        description: "QR code copied! You can paste it anywhere.",
      })
    } catch (error) {
      // Fallback: copy the data URL as text
      try {
        await navigator.clipboard.writeText(qrCodeUrl)
        toast({
          title: "QR Code Data Copied",
          description: "QR code data copied as text.",
        })
      } catch (fallbackError) {
        toast({
          title: "Copy Failed",
          description: "Could not copy QR code. Please download instead.",
          variant: "destructive",
        })
      }
    }
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
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Registration Successful!</h3>
          </div>
          <p className="text-sm text-gray-600">Your QR code for event attendance</p>
        </div>

        {/* Event Details Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">{eventTitle}</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p><span className="font-medium">Date:</span> {formatDate(eventDate)}</p>
              <p><span className="font-medium">Time Slot:</span> {timeSlot}</p>
              <p><span className="font-medium">Participant:</span> {userName}</p>
              <p><span className="font-medium">Token:</span> <code className="bg-white px-2 py-1 rounded text-xs">{alphanumericToken}</code></p>
            </div>
          </div>
        </div>

        {/* QR Code Display */}
        {error ? (
          <div className="text-center py-8 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
            <p className="text-red-700 font-medium mb-2">QR Code Generation Failed</p>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button onClick={generateQRCode} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : qrCodeUrl ? (
          <div className="text-center space-y-4">
            <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-xl shadow-lg">
              <img
                src={qrCodeUrl}
                alt="Event Registration QR Code"
                className="w-64 h-64 mx-auto"
              />
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">
                ✓ QR Code Ready for Scanning
              </p>
              <p className="text-xs text-green-700 mt-1">
                Show this code to event staff for attendance verification
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            {isGenerating ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
                <p className="text-gray-600">Generating your QR code...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <QrCode className="w-16 h-16 mx-auto text-gray-300" />
                <p className="text-gray-500">QR code will be generated automatically</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {qrCodeUrl && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={downloadQRCode}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        )}

        {/* Manual Generation Button */}
        {!qrCodeUrl && !isGenerating && error && (
          <Button
            onClick={generateQRCode}
            className="w-full"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Generate QR Code
          </Button>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">Important Instructions:</h5>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Save this QR code to your device or take a screenshot</li>
            <li>• Present this code to event staff for attendance marking</li>
            <li>• Keep your device charged or print the QR code</li>
            <li>• Arrive at your selected time slot: {timeSlot}</li>
            <li>• Your token: <code className="bg-white px-1 rounded">{alphanumericToken}</code></li>
          </ul>
        </div>

        {/* Backup Information */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            If QR code doesn't work, show your token: <strong>{alphanumericToken}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}