"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, QrCode, Camera, X, CheckCircle2, AlertCircle } from "lucide-react"

interface QRScannerProps {
  onScanSuccess?: (qrData: string) => void
  onScanError?: (error: string) => void
  title?: string
  description?: string
}

export function QRScanner({ onScanSuccess, onScanError, title = "QR Code Scanner", description = "Enable camera to scan QR codes" }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [manualQRInput, setManualQRInput] = useState("")
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    setIsLoading(true)
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)

        // Start scanning
        scanQRCode()
      }
    } catch (err: any) {
      const errorMessage = err.name === "NotAllowedError"
        ? "Camera permission denied. Please enable camera access in your browser settings."
        : err.name === "NotFoundError"
        ? "No camera found on this device."
        : "Failed to access camera. Please try again."

      setError(errorMessage)
      onScanError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      setIsCameraActive(false)
    }
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          // Simple QR detection - look for specific patterns
          // In production, you'd use a library like jsQR or zxing-js
          const data = imageData.data
          if (data.length > 0) {
            // This is a placeholder for actual QR decoding
            // You'd need to integrate a proper QR code library
          }
        } catch (err) {
          console.error("QR scan error:", err)
        }
      }

      if (isCameraActive) {
        requestAnimationFrame(scan)
      }
    }

    scan()
  }

  const handleManualInput = () => {
    if (manualQRInput.trim()) {
      stopCamera()
      setIsOpen(false)
      onScanSuccess?.(manualQRInput.trim())
      setManualQRInput("")
    }
  }

  const handleClose = () => {
    stopCamera()
    setIsOpen(false)
    setManualQRInput("")
    setError("")
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Camera className="w-4 h-4" />
        Scan QR Code
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          handleClose()
        } else {
          setIsOpen(true)
        }
      }}>
        <DialogContent className="max-w-lg">
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

            {!isCameraActive ? (
              <div className="space-y-3">
                <Button
                  onClick={startCamera}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Requesting Camera Access...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Enable Camera
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or enter manually</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Paste QR token (EVT-...)"
                    value={manualQRInput}
                    onChange={(e) => setManualQRInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleManualInput()
                      }
                    }}
                    className="font-mono"
                  />
                  <Button
                    onClick={handleManualInput}
                    disabled={!manualQRInput.trim()}
                    className="w-full"
                  >
                    Verify QR Token
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  <div className="absolute inset-0 border-4 border-primary/50 rounded-lg">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    Point your camera at the QR code. The app will automatically scan it.
                  </p>
                </div>

                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close Scanner
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or enter manually</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Paste QR token (EVT-...)"
                    value={manualQRInput}
                    onChange={(e) => setManualQRInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleManualInput()
                      }
                    }}
                    className="font-mono"
                  />
                  <Button
                    onClick={handleManualInput}
                    disabled={!manualQRInput.trim()}
                    className="w-full"
                  >
                    Verify QR Token
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}