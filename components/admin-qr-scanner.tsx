"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, QrCode, Camera, X, AlertCircle, RotateCcw } from "lucide-react"
import jsQR from "jsqr"

interface AdminQRScannerProps {
  onScanSuccess: (qrData: string) => void
  onError?: (error: string) => void
  title?: string
}

interface CameraDevice {
  deviceId: string
  label: string
}

export function AdminQRScanner({ onScanSuccess, onError, title = "Scan QR Code" }: AdminQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [manualInput, setManualInput] = useState("")
  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const [showCameraList, setShowCameraList] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const scanLoopRef = useRef<number | null>(null)
  const lastScannedRef = useRef<{ qr: string; time: number } | null>(null)
  const isProcessingRef = useRef(false)
  const cleanupTimeoutRef = useRef<number | null>(null)

  // Initialize cameras
  useEffect(() => {
    if (!isOpen) return

    const initCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices
          .filter((d) => d.kind === "videoinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 5)}`,
          }))
        
        setCameraDevices(videoDevices)
        if (videoDevices.length > 0 && !selectedCamera) {
          // Prefer back camera on mobile
          const backCamera = videoDevices.find(
            (d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("environment")
          )
          setSelectedCamera(backCamera?.deviceId || videoDevices[0].deviceId)
        }
      } catch (err) {
        console.error("Failed to enumerate devices:", err)
      }
    }

    initCameras()
  }, [isOpen, selectedCamera])

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current)
      scanLoopRef.current = null
    }
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current)
      cleanupTimeoutRef.current = null
    }
    setIsCameraActive(false)
    isProcessingRef.current = false
  }

  const startCamera = async (deviceId?: string) => {
    // Ensure cleanup before starting new camera
    cleanup()
    setIsLoading(true)
    setError("")

    try {
      const cameraId = deviceId || selectedCamera
      if (!cameraId) {
        throw new Error("No camera selected")
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: cameraId },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: "environment",
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (!videoRef.current) {
        throw new Error("Video element not available")
      }

      videoRef.current.srcObject = stream
      streamRef.current = stream
      setIsCameraActive(true)
      setShowCameraList(false)
      setError("")

      // Start scanning once video is ready
      const onLoadedMetadata = () => {
        startScanning()
        videoRef.current?.removeEventListener("loadedmetadata", onLoadedMetadata)
      }

      videoRef.current.addEventListener("loadedmetadata", onLoadedMetadata)

      // Fallback timeout
      cleanupTimeoutRef.current = window.setTimeout(() => {
        if (!isCameraActive) {
          videoRef.current?.removeEventListener("loadedmetadata", onLoadedMetadata)
          startScanning()
        }
      }, 2000)
    } catch (err: any) {
      console.error("Camera error:", err)
      let errorMsg = "Failed to access camera"

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Camera permission denied. Check browser settings and refresh."
      } else if (err.name === "NotFoundError") {
        errorMsg = "No camera found on this device."
      } else if (err.name === "NotReadableError") {
        errorMsg = "Camera is in use by another app. Close other apps and retry."
      } else if (err.name === "OverconstrainedError") {
        errorMsg = "Camera constraints not supported. Try another camera."
      }

      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return

    let frameCount = 0
    const skipFrames = 2 // Process every 3rd frame

    const scan = () => {
      if (!isCameraActive || isProcessingRef.current) {
        if (isCameraActive) {
          scanLoopRef.current = requestAnimationFrame(scan)
        }
        return
      }

      frameCount++
      if (frameCount % (skipFrames + 1) !== 0) {
        scanLoopRef.current = requestAnimationFrame(scan)
        return
      }

      try {
        const video = videoRef.current
        const canvas = canvasRef.current

        if (!video || !canvas) return
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
          scanLoopRef.current = requestAnimationFrame(scan)
          return
        }

        // Scale canvas for performance
        const scale = 0.5
        canvas.width = video.videoWidth * scale
        canvas.height = video.videoHeight * scale

        if (canvas.width === 0 || canvas.height === 0) {
          scanLoopRef.current = requestAnimationFrame(scan)
          return
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) {
          scanLoopRef.current = requestAnimationFrame(scan)
          return
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        if (!imageData.data) {
          scanLoopRef.current = requestAnimationFrame(scan)
          return
        }

        // Decode QR
        let qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        })

        if (qrCode && qrCode.data) {
          const now = Date.now()

          // Prevent duplicate scans within 1 second
          if (
            !lastScannedRef.current ||
            now - lastScannedRef.current.time > 1000 ||
            lastScannedRef.current.qr !== qrCode.data
          ) {
            console.log("✓ QR Code scanned:", qrCode.data)
            isProcessingRef.current = true
            lastScannedRef.current = { qr: qrCode.data, time: now }

            cleanup()
            setIsOpen(false)
            onScanSuccess(qrCode.data)
            setManualInput("")
            return
          }
        }
      } catch (err) {
        console.error("Scan error:", err)
      }

      if (isCameraActive) {
        scanLoopRef.current = requestAnimationFrame(scan)
      }
    }

    scan()
  }

  const switchCamera = async (deviceId: string) => {
    setSelectedCamera(deviceId)
    setShowCameraList(false)
    await new Promise((r) => setTimeout(r, 200))
    await startCamera(deviceId)
  }

  const handleManualEntry = async () => {
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
    setShowCameraList(false)
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

            {/* Camera View */}
            {isCameraActive && (
              <div className="space-y-3">
                {/* Video */}
                <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "1" }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning overlay */}
                  <div className="absolute inset-2 border-2 border-green-500 rounded-lg opacity-75">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 border-2 border-green-400" />
                  </div>

                  {/* Corners */}
                  <div className="absolute top-1 left-1 w-4 h-4 border-l-2 border-t-2 border-green-500" />
                  <div className="absolute top-1 right-1 w-4 h-4 border-r-2 border-t-2 border-green-500" />
                  <div className="absolute bottom-1 left-1 w-4 h-4 border-l-2 border-b-2 border-green-500" />
                  <div className="absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-green-500" />
                </div>

                {/* Camera Controls */}
                {cameraDevices.length > 1 && (
                  <>
                    <Button
                      onClick={() => setShowCameraList(!showCameraList)}
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Switch Camera
                    </Button>

                    {showCameraList && (
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                        {cameraDevices.map((device) => (
                          <Button
                            key={device.deviceId}
                            onClick={() => switchCamera(device.deviceId)}
                            variant={selectedCamera === device.deviceId ? "default" : "outline"}
                            size="sm"
                            className="w-full justify-start text-left text-sm"
                          >
                            <Camera className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{device.label}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <Button
                  onClick={handleClose}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            )}

            {/* Manual Entry View */}
            {!isCameraActive && (
              <div className="space-y-3">
                {/* Start Camera Button */}
                {cameraDevices.length > 0 && (
                  <Button
                    onClick={() => startCamera()}
                    disabled={isLoading}
                    className="w-full gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Accessing Camera...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Start Camera
                      </>
                    )}
                  </Button>
                )}

                {/* Manual Entry Section */}
                <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Manual Entry</p>
                  <p className="text-xs text-blue-800">Paste QR token if camera is unavailable</p>
                </div>

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
                    variant="secondary"
                    className="w-full"
                  >
                    Verify Token
                  </Button>
                </div>

                {/* Camera Device Selector - Manual Start */}
                {cameraDevices.length > 1 && !isCameraActive && (
                  <div className="space-y-2 p-3 bg-gray-50 border rounded-lg">
                    <p className="text-xs font-medium text-gray-700">Select Camera:</p>
                    <div className="space-y-1">
                      {cameraDevices.map((device) => (
                        <Button
                          key={device.deviceId}
                          onClick={() => {
                            setSelectedCamera(device.deviceId)
                            setTimeout(() => startCamera(device.deviceId), 100)
                          }}
                          variant={selectedCamera === device.deviceId ? "default" : "outline"}
                          size="sm"
                          className="w-full justify-start text-left text-xs"
                        >
                          <Camera className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span className="truncate">{device.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}