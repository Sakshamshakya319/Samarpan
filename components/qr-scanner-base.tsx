"use client"

import { useState, useRef, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Camera, CameraOff, AlertCircle } from "lucide-react"

interface QRScannerBaseProps {
  onScanSuccess: (decodedText: string) => void
  onScanError?: (error: string) => void
  className?: string
  elementId?: string
}

export function QRScannerBase({ 
  onScanSuccess, 
  onScanError, 
  className = "",
  elementId = "qr-scanner-base"
}: QRScannerBaseProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState("")
  
  // Use refs to prevent React Strict Mode double initialization
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isInitializedRef = useRef(false)
  const isScanningRef = useRef(false)

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg)
    onScanError?.(errorMsg)
  }, [onScanError])

  const startCamera = useCallback(async () => {
    // Prevent multiple starts (React Strict Mode fix)
    if (isInitializedRef.current || isScanningRef.current || isStarting) {
      console.log("Camera already starting/started, ignoring...")
      return
    }

    setIsStarting(true)
    setError("")

    try {
      // Check if element exists
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error("Scanner element not found. Please refresh the page.")
      }

      // Mark as initializing to prevent double init
      isInitializedRef.current = true

      // Create scanner instance
      scannerRef.current = new Html5Qrcode(elementId)

      // Start camera with environment facing (back camera)
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Prevent multiple scans
          if (!isScanningRef.current) {
            isScanningRef.current = true
            console.log("QR Code scanned:", decodedText)
            onScanSuccess(decodedText)
            // Reset after processing
            setTimeout(() => {
              isScanningRef.current = false
            }, 1000)
          }
        },
        (errorMessage) => {
          // Ignore scan frame errors - they're normal
        }
      )

      setIsScanning(true)
      console.log("Camera started successfully")

    } catch (err: any) {
      console.error("Camera start error:", err)
      
      // Reset initialization flag on error
      isInitializedRef.current = false
      
      let errorMsg = "Failed to access camera"
      
      if (err.name === "NotAllowedError") {
        errorMsg = "Camera permission denied. Please allow camera access and ensure you're on HTTPS or localhost."
      } else if (err.name === "NotFoundError") {
        errorMsg = "No camera found on this device."
      } else if (err.name === "NotReadableError") {
        errorMsg = "Camera is already in use by another application."
      } else if (err.name === "OverconstrainedError") {
        errorMsg = "Camera constraints not supported."
      } else if (err.message) {
        errorMsg = err.message
      }
      
      handleError(errorMsg)
    } finally {
      setIsStarting(false)
    }
  }, [elementId, onScanSuccess, handleError, isStarting])

  const stopCamera = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop()
        console.log("Camera stopped successfully")
      } catch (error) {
        console.warn("Error stopping camera:", error)
      }
    }
    
    // Clean up scanner instance
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
      } catch (error) {
        console.warn("Error clearing scanner:", error)
      }
      scannerRef.current = null
    }
    
    // Reset all flags
    setIsScanning(false)
    isInitializedRef.current = false
    isScanningRef.current = false
    setError("")
  }, [])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Scanner Container - Always rendered */}
      <div 
        id={elementId}
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
                Start Camera Scanner
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
          <p>Click "Start Camera Scanner" to begin scanning QR codes</p>
        )}
        {isStarting && (
          <p>Requesting camera access...</p>
        )}
        {isScanning && (
          <p>Point your camera at a QR code to scan</p>
        )}
      </div>
    </div>
  )
}

// React import for useEffect
import React from "react"