"use client"

import { useState, useEffect } from "react"
import { Scanner, useDevices } from "@yudiel/react-qr-scanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, QrCode, Camera, X, AlertCircle, Lightbulb, RotateCcw } from "lucide-react"

interface AdminQRScannerModernProps {
  onScanSuccess: (qrData: string) => void
  onError?: (error: string) => void
  title?: string
}

export function AdminQRScannerModern({ onScanSuccess, onError, title = "Scan QR Code" }: AdminQRScannerModernProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [manualInput, setManualInput] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  
  // Get available camera devices
  const devices = useDevices()
  const videoDevices = devices.filter(device => device.kind === 'videoinput')

  // Auto-select back camera on mobile
  useEffect(() => {
    if (videoDevices.length > 0 && !selectedDeviceId) {
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('environment')
      )
      setSelectedDeviceId(backCamera?.deviceId || videoDevices[0].deviceId)
    }
  }, [videoDevices, selectedDeviceId])

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const qrData = detectedCodes[0].rawValue
      console.log("✓ QR Code scanned:", qrData)
      
      // Stop scanning and close dialog
      setIsScanning(false)
      setIsOpen(false)
      setError("")
      
      // Call success callback
      onScanSuccess(qrData)
    }
  }

  const handleError = (error: any) => {
    console.error("Scanner error:", error)
    let errorMsg = "Failed to scan QR code"
    
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

  const handleManualEntry = () => {
    const token = manualInput.trim()
    if (!token) {
      setError("Please enter a QR token")
      return
    }

    setIsOpen(false)
    setManualInput("")
    setError("")
    onScanSuccess(token)
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsScanning(false)
    setError("")
    setManualInput("")
  }

  const switchCamera = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    setIsScanning(false)
    // Restart scanning with new camera after a brief delay
    setTimeout(() => setIsScanning(true), 100)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm" className="gap-2">
        <Camera className="w-4 h-4" />
        Scan QR
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
            <Alert className="bg-blue-50 border-blue-200">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                Position the QR code within the camera frame for best results. The scanner will automatically detect and read the code.
              </AlertDescription>
            </Alert>

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

            {/* QR Scanner */}
            {selectedDeviceId && (
              <div className="space-y-3">
                <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "1" }}>
                  <Scanner
                    onScan={handleScan}
                    onError={handleError}
                    constraints={{
                      deviceId: selectedDeviceId,
                      facingMode: "environment",
                      width: { ideal: 1920, max: 1920 },
                      height: { ideal: 1080, max: 1080 }
                    }}
                    scanDelay={500} // Scan every 500ms for better performance
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

                <Button
                  onClick={handleClose}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                >
                  <X className="w-4 h-4" />
                  Close Scanner
                </Button>
              </div>
            )}

            {/* Manual Entry Fallback */}
            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Manual Entry</p>
              <p className="text-xs text-blue-800">If camera is unavailable, paste the QR token below:</p>
              
              <div className="space-y-2">
                <Input
                  placeholder="Paste QR token (EVT-...)"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleManualEntry()
                    }
                  }}
                  className="font-mono"
                />
                <Button
                  onClick={handleManualEntry}
                  disabled={!manualInput.trim()}
                  size="sm"
                  className="w-full"
                >
                  Verify Token
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}