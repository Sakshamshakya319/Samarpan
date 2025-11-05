"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, QrCode, Camera, X, CheckCircle2, AlertCircle, RotateCcw, Settings2 } from "lucide-react"
import jsQR from "jsqr"

interface QRScannerProps {
  onScanSuccess?: (qrData: string) => void
  onScanError?: (error: string) => void
  title?: string
  description?: string
}

interface CameraDevice {
  deviceId: string
  label: string
}

export function QRScanner({ onScanSuccess, onScanError, title = "QR Code Scanner", description = "Enable camera to scan QR codes" }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [manualQRInput, setManualQRInput] = useState("")
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const [showCameraSelector, setShowCameraSelector] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const scanLoopRef = useRef<number | null>(null)
  const lastScannedRef = useRef<{ qr: string; time: number } | null>(null)
  const isProcessingRef = useRef(false)

  // Initialize available cameras and detect mobile
  useEffect(() => {
    const initializeCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices
          .filter((device) => device.kind === "videoinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${cameraDevices.length + 1}`,
          }))
        setCameraDevices(videoDevices)
        if (videoDevices.length > 0 && !selectedCamera) {
          setSelectedCamera(videoDevices[0].deviceId)
        }
      } catch (err) {
        console.error("Error enumerating devices:", err)
      }
    }

    // Detect mobile device
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }

    if (isOpen) {
      checkMobile()
      initializeCameras()
    }
  }, [isOpen])

  const startCamera = async (cameraId?: string) => {
    setIsLoading(true)
    setError("")
    setPermissionDenied(false)

    try {
      // Enhanced constraints for better mobile compatibility
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "environment", // Prefer back camera on mobile
          width: { ideal: 1920, max: 1920 }, // Limit resolution for better performance
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 }, // Limit frame rate
          ...(cameraId ? { deviceId: { exact: cameraId } } : {}),
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
        setShowCameraSelector(false)
        setError("")

        // Start scanning once video is ready
        videoRef.current.onloadedmetadata = () => {
          console.log("Video stream started")
          startScanning()
        }
      }
    } catch (err: any) {
      console.error("Camera error:", err)
      let errorMessage = "Failed to access camera. Please try again."

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage =
          "Camera permission denied.\n\n" +
          "Chrome/Edge:\n" +
          "Settings > Privacy > Camera\n\n" +
          "Firefox:\n" +
          "Preferences > Privacy > Camera\n\n" +
          "Safari:\n" +
          "Settings > Privacy > Camera\n\n" +
          "Mobile:\n" +
          "Allow camera access when prompted"
        setPermissionDenied(true)
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "No camera found. Check if device has a camera."
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera in use by another app. Close it and try again."
      } else if (err.name === "OverconstrainedError") {
        // Try with lower constraints for older devices
        try {
          const fallbackConstraints: MediaStreamConstraints = {
            video: {
              facingMode: "environment",
              width: { ideal: 1280, max: 1280 },
              height: { ideal: 720, max: 720 },
            },
            audio: false,
          }
          
          const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints)
          
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream
            streamRef.current = fallbackStream
            setIsCameraActive(true)
            setShowCameraSelector(false)
            setError("")

            videoRef.current.onloadedmetadata = () => {
              console.log("Video stream started with fallback constraints")
              startScanning()
            }
          }
          setIsLoading(false)
          return
        } catch (fallbackErr) {
          console.error("Fallback camera error:", fallbackErr)
          errorMessage = "Camera not supported on this device. Try manual entry."
        }
      } else {
        errorMessage = `Camera error: ${err.message || err.name}`
      }

      setError(errorMessage)
      onScanError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current)
      scanLoopRef.current = null
    }
    setIsCameraActive(false)
  }

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current || isProcessingRef.current) return

    let scanCount = 0
    const scanInterval = 3 // Scan every 3rd frame for better performance on mobile

    const scan = () => {
      if (!isCameraActive || isProcessingRef.current) {
        return
      }

      scanCount++
      
      // Skip frames for better performance
      if (scanCount % scanInterval !== 0) {
        if (isCameraActive) {
          scanLoopRef.current = requestAnimationFrame(scan)
        }
        return
      }

      try {
        const video = videoRef.current
        const canvas = canvasRef.current

        if (!video || !canvas) return

        // Check if video has data
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
          if (isCameraActive) {
            scanLoopRef.current = requestAnimationFrame(scan)
          }
          return
        }

        // Use smaller canvas for better mobile performance
        const maxDimension = 640 // Limit max dimension for mobile performance
        let canvasWidth = video.videoWidth
        let canvasHeight = video.videoHeight
        
        if (canvasWidth > maxDimension || canvasHeight > maxDimension) {
          const aspectRatio = canvasWidth / canvasHeight
          if (aspectRatio > 1) {
            canvasWidth = maxDimension
            canvasHeight = maxDimension / aspectRatio
          } else {
            canvasHeight = maxDimension
            canvasWidth = maxDimension * aspectRatio
          }
        }

        canvas.width = canvasWidth
        canvas.height = canvasHeight

        if (canvas.width === 0 || canvas.height === 0) {
          if (isCameraActive) {
            scanLoopRef.current = requestAnimationFrame(scan)
          }
          return
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          if (!imageData.data || imageData.data.length === 0) {
            if (isCameraActive) {
              scanLoopRef.current = requestAnimationFrame(scan)
            }
            return
          }

          // Try to decode QR code with optimized settings
          let qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          })

          // If QR code detected
          if (qrCode && qrCode.data) {
            const now = Date.now()

            // Prevent duplicate scans
            if (
              !lastScannedRef.current ||
              now - lastScannedRef.current.time > 1000 || // Reduced delay for faster scanning
              lastScannedRef.current.qr !== qrCode.data
            ) {
              console.log("✓ QR Code found:", qrCode.data)
              isProcessingRef.current = true
              lastScannedRef.current = { qr: qrCode.data, time: now }

              stopCamera()
              setIsOpen(false)
              onScanSuccess?.(qrCode.data)
              setManualQRInput("")
              return
            }
          }
        } catch (decodeErr) {
          console.error("Decode error:", decodeErr)
        }
      } catch (err) {
        console.error("Scan error:", err)
      }

      // Continue scanning
      if (isCameraActive) {
        scanLoopRef.current = requestAnimationFrame(scan)
      }
    }

    scan()
  }

  const switchCamera = async (cameraId: string) => {
    stopCamera()
    setSelectedCamera(cameraId)
    isProcessingRef.current = false
    await new Promise((resolve) => setTimeout(resolve, 200))
    await startCamera(cameraId)
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
    setPermissionDenied(false)
    isProcessingRef.current = false
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
        <Camera className="w-4 h-4" />
        {isMobile ? "Scan QR" : "Scan QR Code"}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          handleClose()
        } else {
          setIsOpen(true)
        }
      }}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-md p-3 sm:p-6 max-h-[95vh] overflow-y-auto">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>{title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 sm:space-y-3">
            {error && (
              <Alert variant="destructive" className="text-xs sm:text-sm">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                <AlertDescription className="ml-2 text-xs sm:text-sm whitespace-pre-line">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {permissionDenied && (
              <Alert className="bg-yellow-50 border-yellow-200 text-xs sm:text-sm">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <AlertDescription className="text-yellow-800 text-xs sm:text-sm ml-2">
                  <strong>Permission Denied:</strong> Allow camera in browser settings, then refresh.
                </AlertDescription>
              </Alert>
            )}

            {!isCameraActive ? (
              <div className="space-y-2 sm:space-y-3">
                {cameraDevices.length > 1 && showCameraSelector && (
                  <div className="space-y-1 sm:space-y-2 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <label className="block text-xs sm:text-sm font-medium">Select Camera:</label>
                    <div className="flex flex-col gap-1 sm:gap-2">
                      {cameraDevices.map((device) => (
                        <Button
                          key={device.deviceId}
                          onClick={() => switchCamera(device.deviceId)}
                          variant={selectedCamera === device.deviceId ? "default" : "outline"}
                          className="justify-start text-left text-xs sm:text-sm h-8 sm:h-10"
                          size="sm"
                        >
                          <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{device.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => startCamera(selectedCamera)}
                  disabled={isLoading}
                  className="w-full text-xs sm:text-sm h-8 sm:h-10"
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin flex-shrink-0" />
                      <span>Requesting Camera...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                      <span>Enable Camera</span>
                    </>
                  )}
                </Button>

                {cameraDevices.length > 1 && (
                  <Button
                    onClick={() => setShowCameraSelector(!showCameraSelector)}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs sm:text-sm h-8"
                  >
                    <Settings2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    {showCameraSelector ? "Hide" : "Show"} Options
                  </Button>
                )}

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-white text-gray-500 text-xs">Or enter manually</span>
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Input
                    placeholder="Paste QR token (EVT-...)"
                    value={manualQRInput}
                    onChange={(e) => setManualQRInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleManualInput()
                      }
                    }}
                    className="font-mono text-xs sm:text-sm h-8 sm:h-10"
                  />
                  <Button
                    onClick={handleManualInput}
                    disabled={!manualQRInput.trim()}
                    className="w-full text-xs sm:text-sm h-8 sm:h-10"
                    size="sm"
                  >
                    Verify QR Token
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {/* Video Container */}
                <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "1" }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning frame overlay */}
                  <div className="absolute inset-0 border-4 border-primary/50 rounded-lg">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                    <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-primary" />
                    <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-primary" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-primary" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-primary" />
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-xs sm:text-sm text-blue-900 space-y-0.5">
                    <div>✓ Point at QR code</div>
                    <div>✓ Keep within frame</div>
                    <div>✓ Auto-scans when detected</div>
                  </p>
                </div>

                {/* Camera switcher */}
                {cameraDevices.length > 1 && (
                  <>
                    <Button
                      onClick={() => setShowCameraSelector(!showCameraSelector)}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs sm:text-sm h-8 sm:h-10"
                    >
                      <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                      Switch Camera
                    </Button>

                    {showCameraSelector && (
                      <div className="space-y-1 p-2 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                        {cameraDevices.map((device) => (
                          <Button
                            key={device.deviceId}
                            onClick={() => switchCamera(device.deviceId)}
                            variant={selectedCamera === device.deviceId ? "default" : "outline"}
                            className="justify-start text-left w-full text-xs sm:text-sm h-8"
                            size="sm"
                          >
                            <Camera className="w-3 h-3 mr-2 flex-shrink-0" />
                            <span className="truncate text-xs">{device.label}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Close button */}
                <Button
                  onClick={handleClose}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs sm:text-sm h-8 sm:h-10"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  Close Scanner
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}