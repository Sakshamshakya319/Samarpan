"use client"

import { useState, useEffect, useRef } from "react"
import { Scanner, useDevices } from "@yudiel/react-qr-scanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { QrCode, Camera, CameraOff, RotateCcw, AlertTriangle, CheckCircle, Lightbulb, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminQRScannerEnhancedProps {
  onScanSuccess: (qrData: string) => void
  onError?: (error: string) => void
  title?: string
}

export function AdminQRScannerEnhanced({
  onScanSuccess,
  onError,
  title = "Scan QR Code",
}: AdminQRScannerEnhancedProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [manualInput, setManualInput] = useState("")
  const [scannerKey, setScannerKey] = useState(0)
  const [flashOn, setFlashOn] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>()
  const processingRef = useRef(false)
  const lastScannedRef = useRef<{ qr: string; time: number } | null>(null)
  
  // Get available video devices
  const videoDevices = useDevices({ deviceType: "videoinput" })

  // Auto-select back camera on mobile
  useEffect(() => {
    if (videoDevices.length > 0 && !selectedDeviceId) {
      const backCamera = videoDevices.find(device => 
        device.label?.toLowerCase().includes('back') || 
        device.label?.toLowerCase().includes('rear')
      )
      setSelectedDeviceId(backCamera?.deviceId || videoDevices[0].deviceId)
    }
  }, [videoDevices, selectedDeviceId])

  const switchCamera = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    // Reset scanner to apply new device
    setScannerKey(prev => prev + 1)
  }

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes.length === 0) return
    
    const qrCode = detectedCodes[0].rawValue
    
    // Prevent duplicate scans within 2 seconds
    const now = Date.now()
    if (processingRef.current || 
        (lastScannedRef.current && 
         lastScannedRef.current.qr === qrCode && 
         now - lastScannedRef.current.time < 2000)) {
      return
    }
    
    processingRef.current = true
    lastScannedRef.current = { qr: qrCode, time: now }
    setIsCameraActive(false)
    onScanSuccess(qrCode)
    
    // Reset processing after a short delay
    setTimeout(() => {
      processingRef.current = false
    }, 500)
  }

  const handleScanError = (error: any) => {
    console.error("Scanner error:", error)
    let errorMsg = "Failed to access camera"
    
    if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
      errorMsg = "Camera permission denied. Please allow camera access and try again."
    } else if (error?.name === "NotFoundError") {
      errorMsg = "No camera found on this device."
    } else if (error?.name === "NotReadableError") {
      errorMsg = "Camera is in use by another application. Close other apps and try again."
    } else if (error?.name === "OverconstrainedError") {
      errorMsg = "Camera settings not supported. Try switching cameras."
    } else if (error?.message) {
      errorMsg = error.message
    }
    
    setError(errorMsg)
    onError?.(errorMsg)
  }

  const cleanup = () => {
    setIsCameraActive(false)
    processingRef.current = false
    setFlashOn(false)
  }

  const startCamera = () => {
    setIsLoading(true)
    setError("")
    try {
      setIsCameraActive(true)
      setScannerKey((k) => k + 1) // Force remount of scanner
    } catch (err: any) {
      const errorMsg = err.message || "Failed to access camera"
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualEntry = () => {
    const token = manualInput.trim()
    if (!token) return

    cleanup()
    setIsOpen(false)
    setManualInput("")
    onScanSuccess(token)
  }

  const handleClose = () => {
    cleanup()
    setIsOpen(false)
    setManualInput("")
    setError("")
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm" className="gap-2">
        <Camera className="w-4 h-4" />
        Scan QR
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              {title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Tips */}
            {!isCameraActive && (
              <Alert className="bg-blue-50 border-blue-200">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  Position the QR code within the camera frame for best results.
                </AlertDescription>
              </Alert>
            )}

            {/* QR Scanner View */}
            {isCameraActive && (
              <div className="space-y-3">
                {/* Camera Selection */}
                {videoDevices.length > 1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Camera:</label>
                    <div className="flex gap-2 flex-wrap">
                      {videoDevices.map((device) => (
                        <Button
                          key={device.deviceId}
                          onClick={() => switchCamera(device.deviceId)}
                          variant={selectedDeviceId === device.deviceId ? "default" : "outline"}
                          size="sm"
                          className="gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className="relative w-full bg-black rounded-lg overflow-hidden"
                  style={{ aspectRatio: "1" }}
                >
                  <Scanner
                    key={scannerKey}
                    onScan={handleScan}
                    onError={handleScanError}
                    constraints={{
                      deviceId: selectedDeviceId,
                      facingMode: "environment",
                      width: { ideal: 1280, max: 1920 },
                      height: { ideal: 720, max: 1080 },
                    }}
                    scanDelay={300} // Scan every 300ms for better responsiveness
                    components={{
                      audio: false, // Disable audio beep
                      tracker: (detectedCodes, ctx) => {
                        // Draw custom tracking overlay
                        detectedCodes.forEach((code) => {
                          const { boundingBox, cornerPoints } = code
                          
                          // Draw bounding box
                          ctx.strokeStyle = '#00FF00'
                          ctx.lineWidth = 3
                          ctx.strokeRect(
                            boundingBox.x,
                            boundingBox.y,
                            boundingBox.width,
                            boundingBox.height
                          )

                          // Draw corner points
                          ctx.fillStyle = '#FF0000'
                          cornerPoints.forEach((point) => {
                            ctx.beginPath()
                            ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI)
                            ctx.fill()
                          })
                        })
                      }
                    }}
                    styles={{
                      container: {
                        width: '100%',
                        height: '100%',
                      },
                      video: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }
                    }}
                  />
                </div>

                <Button onClick={handleClose} variant="outline" size="sm" className="w-full">
                  <X className="w-4 h-4 mr-2" />
                  Close Scanner
                </Button>
              </div>
            )}

            {/* Manual Entry View */}
            {!isCameraActive && (
              <div className="space-y-3">
                {/* Start Camera Button */}
                <Button
                  onClick={startCamera}
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting Camera...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Start Camera
                    </>
                  )}
                </Button>

                {/* Manual Entry Section */}
                <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Manual Entry</p>
                  <p className="text-xs text-blue-800">
                    Paste QR code data or token directly
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Paste QR code data here..."
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleManualEntry()
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleManualEntry}
                      disabled={!manualInput.trim()}
                      size="sm"
                      className="px-4"
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}