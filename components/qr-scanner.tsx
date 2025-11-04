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
  const streamRef = useRef<MediaStream | null>(null)
  const scanLoopRef = useRef<number | null>(null)
  const lastScannedRef = useRef<{ qr: string; time: number } | null>(null)

  // Initialize available cameras
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

    if (isOpen) {
      initializeCameras()
    }
  }, [isOpen])

  const startCamera = async (cameraId?: string) => {
    setIsLoading(true)
    setError("")
    setPermissionDenied(false)

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
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

        // Wait for video to be loaded before starting scan
        videoRef.current.onloadedmetadata = () => {
          scanQRCode()
        }
      }
    } catch (err: any) {
      let errorMessage = "Failed to access camera. Please try again."

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage =
          "Camera permission denied. Please enable camera access in your browser settings:\n\n" +
          "• Chrome/Edge: Settings > Privacy and security > Site settings > Camera\n" +
          "• Firefox: About:preferences > Privacy > Permissions > Camera\n" +
          "• Safari: Settings > Privacy > Camera"
        setPermissionDenied(true)
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "No camera found on this device. Please check that your device has a camera and it's not in use by another application."
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application. Please close other apps using the camera and try again."
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Camera constraints not supported. Attempting with relaxed settings..."
        // Retry with less strict constraints
        try {
          const relaxedStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          })
          if (videoRef.current) {
            videoRef.current.srcObject = relaxedStream
            streamRef.current = relaxedStream
            setIsCameraActive(true)
            setError("")
            videoRef.current.onloadedmetadata = () => {
              scanQRCode()
            }
          }
        } catch (retryErr) {
          setError("Failed to access camera with any settings.")
          onScanError?.("Failed to access camera with any settings.")
        }
      }

      if (errorMessage !== "Camera constraints not supported. Attempting with relaxed settings..." || error) {
        setError(errorMessage)
        onScanError?.(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setIsCameraActive(false)
    }
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current)
      scanLoopRef.current = null
    }
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d", { willReadFrequently: true })

    if (!ctx) return

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          })

          if (qrCode) {
            const now = Date.now()
            // Prevent duplicate scans within 1 second
            if (!lastScannedRef.current || now - lastScannedRef.current.time > 1000 || lastScannedRef.current.qr !== qrCode.data) {
              lastScannedRef.current = { qr: qrCode.data, time: now }
              stopCamera()
              setIsOpen(false)
              onScanSuccess?.(qrCode.data)
              setManualQRInput("")
              setError("")
            }
          }
        } catch (err) {
          console.error("QR scan error:", err)
        }
      }

      if (isCameraActive) {
        scanLoopRef.current = requestAnimationFrame(scan)
      }
    }

    scan()
  }

  const switchCamera = async (cameraId: string) => {
    stopCamera()
    setSelectedCamera(cameraId)
    await new Promise((resolve) => setTimeout(resolve, 100))
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
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <AlertDescription className="ml-2 text-sm whitespace-pre-line">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {permissionDenied && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <AlertDescription className="text-yellow-800 text-sm">
                  <strong>Permission Denied:</strong> After allowing camera access in your browser settings, refresh this page and try again.
                </AlertDescription>
              </Alert>
            )}

            {!isCameraActive ? (
              <div className="space-y-3">
                {cameraDevices.length > 1 && showCameraSelector && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Select Camera:</label>
                    <div className="flex flex-col gap-2">
                      {cameraDevices.map((device) => (
                        <Button
                          key={device.deviceId}
                          onClick={() => switchCamera(device.deviceId)}
                          variant={selectedCamera === device.deviceId ? "default" : "outline"}
                          className="justify-start text-left"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {device.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => startCamera(selectedCamera)}
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

                {cameraDevices.length > 1 && (
                  <Button
                    onClick={() => setShowCameraSelector(!showCameraSelector)}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    <Settings2 className="w-4 h-4 mr-2" />
                    {showCameraSelector ? "Hide" : "Show"} Camera Options
                  </Button>
                )}

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
                    muted
                    className="w-full h-64 object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 border-4 border-primary/50 rounded-lg">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                    {/* Corner markers for QR detection area */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary" />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    ✓ Point your camera at the QR code<br />
                    ✓ Keep the code within the frame<br />
                    ✓ The app will automatically scan it
                  </p>
                </div>

                {cameraDevices.length > 1 && (
                  <Button
                    onClick={() => setShowCameraSelector(!showCameraSelector)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Switch Camera
                  </Button>
                )}

                {showCameraSelector && cameraDevices.length > 1 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cameraDevices.map((device) => (
                      <Button
                        key={device.deviceId}
                        onClick={() => switchCamera(device.deviceId)}
                        variant={selectedCamera === device.deviceId ? "default" : "outline"}
                        className="justify-start text-left w-full"
                        size="sm"
                      >
                        <Camera className="w-3 h-3 mr-2 flex-shrink-0" />
                        {device.label}
                      </Button>
                    ))}
                  </div>
                )}

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