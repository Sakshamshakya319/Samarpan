"use client"

import { useState, useRef, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Camera, CameraOff, AlertCircle, CheckCircle2 } from "lucide-react"

export function QRTestSimple() {
  const [isScanning, setIsScanning] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState("")
  const [lastScan, setLastScan] = useState("")
  
  // Use refs to prevent React Strict Mode double initialization
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isInitializedRef = useRef(false)

  const startCamera = useCallback(async () => {
    // Prevent multiple starts (React Strict Mode fix)
    if (isInitializedRef.current || isStarting) {
      console.log("Already starting/started, ignoring...")
      return
    }

    setIsStarting(true)
    setError("")
    isInitializedRef.current = true

    try {
      // Check if element exists
      const element = document.getElementById("simple-qr-reader")
      if (!element) {
        throw new Error("Scanner element not found")
      }

      // Create scanner instance
      scannerRef.current = new Html5Qrcode("simple-qr-reader")

      // Start camera
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          console.log("QR Code scanned:", decodedText)
          setLastScan(decodedText)
          // Don't stop camera automatically - let user scan multiple codes
        },
        (errorMessage) => {
          // Ignore scan frame errors
        }
      )

      setIsScanning(true)
      console.log("✅ Camera started successfully")

    } catch (err: any) {
      console.error("❌ Camera start error:", err)
      
      // Reset initialization flag on error
      isInitializedRef.current = false
      
      let errorMsg = "Failed to access camera"
      
      if (err.name === "NotAllowedError") {
        errorMsg = "❌ Camera permission denied. Please allow camera access and ensure you're on HTTPS or localhost."
      } else if (err.name === "NotFoundError") {
        errorMsg = "❌ No camera found on this device."
      } else if (err.name === "NotReadableError") {
        errorMsg = "❌ Camera is already in use by another application."
      } else if (err.message) {
        errorMsg = `❌ ${err.message}`
      }
      
      setError(errorMsg)
    } finally {
      setIsStarting(false)
    }
  }, [isStarting])

  const stopCamera = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop()
        console.log("✅ Camera stopped successfully")
      } catch (error) {
        console.warn("⚠️ Error stopping camera:", error)
      }
    }
    
    // Clean up scanner instance
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
      } catch (error) {
        console.warn("⚠️ Error clearing scanner:", error)
      }
      scannerRef.current = null
    }
    
    // Reset all flags
    setIsScanning(false)
    isInitializedRef.current = false
    setError("")
  }, [])

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">QR Scanner Test (Simple)</h3>
      
      {/* Scanner Container */}
      <div 
        id="simple-qr-reader"
        className="w-full aspect-square bg-black rounded-lg overflow-hidden max-w-md mx-auto"
        style={{ minHeight: "300px" }}
      />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Last Scan Display */}
      {lastScan && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <strong>Last Scan:</strong> {lastScan}
          </AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        {!isScanning ? (
          <Button
            onClick={startCamera}
            disabled={isStarting}
            className="gap-2"
          >
            {isStarting ? (
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
        ) : (
          <Button
            onClick={stopCamera}
            variant="outline"
            className="gap-2"
          >
            <CameraOff className="w-4 h-4" />
            Stop Camera
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground">
        {!isScanning && !isStarting && (
          <p>Click "Start Camera" to test QR scanning</p>
        )}
        {isStarting && (
          <p>Requesting camera access...</p>
        )}
        {isScanning && (
          <p>Point camera at QR code. Camera will stay active for multiple scans.</p>
        )}
      </div>

      {/* Debug Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>🔧 Debug Info:</p>
        <p>• Initialized: {isInitializedRef.current ? "✅" : "❌"}</p>
        <p>• Scanning: {isScanning ? "✅" : "❌"}</p>
        <p>• Starting: {isStarting ? "✅" : "❌"}</p>
        <p>• URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
      </div>
    </div>
  )
}