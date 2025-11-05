"use client"

import { useState, useRef, useEffect } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, QrCode, Camera, X, AlertCircle, Lightbulb } from "lucide-react"

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
  const processingRef = useRef(false)
  const lastScannedRef = useRef<{ qr: string; time: number } | null>(null)

  const handleScan = (result: string) => {
    if (processingRef.current) return

    const now = Date.now()

    // Prevent duplicate scans within 1 second
    if (
      !lastScannedRef.current ||
      now - lastScannedRef.current.time > 1000 ||
      lastScannedRef.current.qr !== result
    ) {
      console.log("✓ QR Code scanned:", result)
      processingRef.current = true
      lastScannedRef.current = { qr: result, time: now }

      cleanup()
      setIsOpen(false)
      onScanSuccess(result)
      setManualInput("")
    }
  }

  const handleScanError = (error: string) => {
    // Don't show errors from scanner - it's normal during scanning
    console.debug("Scanner debug:", error)
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
                <div
                  className="relative w-full bg-black rounded-lg overflow-hidden"
                  style={{ aspectRatio: "1" }}
                >
                  <Scanner
                    key={scannerKey}
                    onDecode={(result) => handleScan(result.getText())}
                    onError={handleScanError}
                    constraints={{
                      facingMode: "environment",
                      width: { ideal: 1280, max: 1920 },
                      height: { ideal: 720, max: 1080 },
                    }}
                    containerStyle={{
                      width: "100%",
                      height: "100%",
                    }}
                    videoStyle={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    ViewFinder={() => (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Corner marks */}
                        <div className="absolute inset-2 border-2 border-green-500 rounded-lg opacity-75">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 border-2 border-green-400" />
                        </div>

                        {/* Corners */}
                        <div className="absolute top-1 left-1 w-4 h-4 border-l-2 border-t-2 border-green-500" />
                        <div className="absolute top-1 right-1 w-4 h-4 border-r-2 border-t-2 border-green-500" />
                        <div className="absolute bottom-1 left-1 w-4 h-4 border-l-2 border-b-2 border-green-500" />
                        <div className="absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-green-500" />
                      </div>
                    )}
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