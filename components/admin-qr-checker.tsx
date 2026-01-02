"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Loader2, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  Camera,
  X
} from "lucide-react"
import { playBeep, playErrorBeep, initializeBeepSound } from "./beep-sound"
import { useToast } from "@/hooks/use-toast"


interface AdminQRCheckerProps {
  token: string
}

interface RegistrationDetails {
  _id: string
  name: string
  registrationNumber: string
  email: string
  phone?: string
  participantType?: "student" | "staff" | "other"
  timeSlot: string
  tokenVerified: boolean
  donationStatus: string
  createdAt: string
  event?: {
    title: string
    location: string
    date: string
  }
}

export function AdminQRChecker({ token }: AdminQRCheckerProps) {
  const [qrInput, setQrInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [registrationDetails, setRegistrationDetails] = useState<RegistrationDetails | null>(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  
  // QR Scanner states
  const [showScanner, setShowScanner] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const isScanningRef = useRef(false)
  const { toast } = useToast()

  // Initialize beep sound and camera devices
  useEffect(() => {
    initializeBeepSound()
    initializeCameras()
  }, [])

  // Initialize scanner when dialog opens
  useEffect(() => {
    if (!showScanner) return

    let retryCount = 0
    const maxRetries = 10 // Maximum 1 second wait (10 * 100ms)

    const initializeScanner = () => {
      const element = document.getElementById('admin-qr-reader')
      
      if (element && !html5QrCodeRef.current) {
        try {
          console.log("Initializing QR scanner...")
          html5QrCodeRef.current = new Html5Qrcode("admin-qr-reader")
          
          // Small delay before starting camera to ensure scanner is ready
          setTimeout(() => {
            if (html5QrCodeRef.current) {
              startCamera()
            }
          }, 200)
        } catch (error) {
          console.error("Scanner initialization error:", error)
          setCameraError("Failed to initialize scanner")
        }
      } else if (!element && retryCount < maxRetries) {
        // Retry after a short delay if element not found
        retryCount++
        console.log(`Waiting for QR reader element... (${retryCount}/${maxRetries})`)
        setTimeout(initializeScanner, 100)
      } else if (retryCount >= maxRetries) {
        console.error("QR reader element not found after maximum retries")
        setCameraError("Scanner element not available")
      }
    }
    
    // Start initialization with a small delay to ensure DOM is ready
    setTimeout(initializeScanner, 50)
    
    return () => {
      cleanup()
    }
  }, [showScanner])

  const initializeCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === "videoinput")
      setCameraDevices(videoDevices)
      
      if (videoDevices.length > 0 && !selectedCamera) {
        // Prefer back camera on mobile
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes("back") || 
          device.label.toLowerCase().includes("environment")
        )
        setSelectedCamera(backCamera?.deviceId || videoDevices[0].deviceId)
      }
    } catch (err) {
      console.error("Failed to enumerate devices:", err)
    }
  }

  const cleanup = () => {
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop().catch(() => {})
        html5QrCodeRef.current.clear()
      } catch (error) {
        console.warn("Error during scanner cleanup:", error)
      } finally {
        html5QrCodeRef.current = null
      }
    }
    setIsCameraActive(false)
    isScanningRef.current = false
  }

  const startCamera = async (deviceId?: string) => {
    // Ensure scanner is initialized and DOM element exists
    if (!html5QrCodeRef.current) {
      console.warn("Scanner not initialized yet")
      return
    }
    
    const element = document.getElementById('admin-qr-reader')
    if (!element) {
      console.warn("QR reader element not found")
      setCameraError("Scanner element not ready")
      return
    }
    
    setIsLoading(true)
    setCameraError("")

    try {
      const cameraId = deviceId || selectedCamera || "environment"
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      }

      const constraints = cameraId === "environment" 
        ? { facingMode: "environment" }
        : { deviceId: { exact: cameraId } }

      // Reset scanning state
      isScanningRef.current = false

      await html5QrCodeRef.current.start(
        constraints,
        config,
        onScanSuccess,
        onScanFailure
      )

      setIsCameraActive(true)
      setCameraError("")
    } catch (err: any) {
      console.error("Camera error:", err)
      let errorMsg = "Failed to access camera"

      if (err.name === "NotAllowedError") {
        errorMsg = "Camera permission denied. Please allow camera access."
      } else if (err.name === "NotFoundError") {
        errorMsg = "No camera found on this device."
      } else if (err.name === "NotReadableError") {
        errorMsg = "Camera is in use by another app."
      }

      setCameraError(errorMsg)
      toast({
        title: "Camera Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onScanSuccess = async (decodedText: string) => {
    // Prevent duplicate scans
    if (isScanningRef.current || isProcessing) return
    
    isScanningRef.current = true
    setIsProcessing(true)

    try {
      // Play beep sound immediately
      await playBeep()
      
      // Stop scanner immediately to prevent multiple scans
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop()
        setIsCameraActive(false)
      }

      // Close scanner dialog
      setShowScanner(false)

      // Process QR code
      await processScannedQR(decodedText)
      
      toast({
        title: "Success",
        description: "QR Code scanned successfully!",
      })
    } catch (error) {
      console.error("Error processing QR code:", error)
      await playErrorBeep()
      toast({
        title: "Error",
        description: "Failed to process QR code",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      isScanningRef.current = false
    }
  }

  const onScanFailure = (error: string) => {
    // Ignore scan failures - they're normal during scanning
    console.debug("QR scan attempt:", error)
  }

  const processScannedQR = async (qrData: string) => {
    try {
      let parsedData
      
      // Try to parse as JSON first (new format)
      try {
        parsedData = JSON.parse(qrData)
      } catch {
        // If not JSON, treat as alphanumeric token (legacy format)
        parsedData = { alphanumericToken: qrData.trim() }
      }

      const tokenToSearch = parsedData.alphanumericToken || parsedData.token || qrData.trim()
      
      // Update input field and search
      setQrInput(tokenToSearch)
      await handleSearchQR(tokenToSearch)
      
    } catch (error) {
      console.error("Error processing scanned QR:", error)
      setErrorMessage("Failed to process scanned QR code")
    }
  }

  const handleSearchQR = async (qrToken?: string) => {
    const tokenToSearch = qrToken || qrInput.trim()
    
    if (!tokenToSearch) {
      setErrorMessage("Please enter a QR token")
      return
    }

    setIsLoading(true)
    setErrorMessage("")
    setSuccessMessage("")
    setRegistrationDetails(null)

    try {
      const response = await fetch(
        `/api/event-registrations/qr-verify?alphanumericToken=${encodeURIComponent(tokenToSearch)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRegistrationDetails(data.registration)
        if (!qrToken) {
          // Update input only if not from scanner
          setQrInput(tokenToSearch)
        }
      } else {
        const data = await response.json()
        setErrorMessage(data.error || "QR token not found")
      }
    } catch (err) {
      setErrorMessage("Error searching for QR code")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyQR = async () => {
    if (!registrationDetails) return

    setIsVerifying(true)
    setErrorMessage("")

    try {
      console.log("Verifying QR for registration:", registrationDetails._id)
      
      const response = await fetch("/api/event-registrations/qr-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          alphanumericToken: qrInput,
          registrationId: registrationDetails._id,
        }),
      })

      if (response.ok) {
        console.log("✓ QR verification successful")
        setSuccessMessage("✓ QR verified! Donation recorded successfully.")
        
        // Auto-clear after success for next scan
        setTimeout(() => {
          setRegistrationDetails(null)
          setQrInput("")
          setSuccessMessage("")
        }, 2500)
      } else {
        const data = await response.json()
        const errorMsg = data.error || "Failed to verify QR code"
        console.error("Verification failed:", errorMsg)
        setErrorMessage(errorMsg)
      }
    } catch (err) {
      console.error("Error verifying QR code:", err)
      setErrorMessage("Network error: Failed to verify QR code")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCopyQR = () => {
    navigator.clipboard.writeText(qrInput)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* QR Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code Verification
          </CardTitle>
          <CardDescription>
            Scan QR codes or enter tokens manually to verify event attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMessage && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <label className="block text-sm font-medium">QR Code / Token</label>

            {/* QR Scanner Button */}
            <div className="flex gap-2 mb-3">
              <Button
                onClick={() => setShowScanner(true)}
                variant="outline"
                className="gap-2"
              >
                <Camera className="w-4 h-4" />
                Scan QR Code
              </Button>
              <span className="text-sm text-gray-500 flex items-center">or enter token manually below</span>
            </div>

            {/* Input and Buttons */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter token (e.g., ABC123) or scan QR code"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && qrInput.trim()) {
                    handleSearchQR()
                  }
                }}
                className="font-mono flex-1"
                maxLength={6}
              />
              <Button
                onClick={() => handleSearchQR()}
                disabled={isLoading || !qrInput.trim()}
                title="Search for this token"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Details Card */}
      {registrationDetails && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Registration Details</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Token: {qrInput}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    registrationDetails.tokenVerified ? "default" : "secondary"
                  }
                >
                  {registrationDetails.donationStatus}
                </Badge>
                <Button
                  onClick={() => {
                    setRegistrationDetails(null)
                    setQrInput("")
                    setErrorMessage("")
                    setSuccessMessage("")
                  }}
                  variant="outline"
                  size="sm"
                  title="Clear and enter another token"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Registration Number</p>
                <p className="font-bold text-lg">{registrationDetails.registrationNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Full Name</p>
                <p className="font-semibold">{registrationDetails.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Participant Type</p>
                <p className="capitalize font-semibold">
                  {registrationDetails.participantType || "other"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p>{registrationDetails.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p>{registrationDetails.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Time Slot</p>
                <p className="font-semibold">{registrationDetails.timeSlot}</p>
              </div>

              {registrationDetails.event && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Event</p>
                    <p className="font-semibold">{registrationDetails.event.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p>{registrationDetails.event.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Event Date</p>
                    <p>{formatDate(registrationDetails.event.date)}</p>
                  </div>
                </>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-1">Registration Date</p>
                <p>{formatDate(registrationDetails.createdAt)}</p>
              </div>
            </div>

            {/* Token Display */}
            <div className="bg-white p-3 rounded-lg border border-gray-200 mt-4">
              <p className="text-xs text-gray-600 mb-1 font-medium">Token:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm bg-gray-100 p-2 rounded overflow-auto">
                  {qrInput}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyQR}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Status Display */}
            {registrationDetails.tokenVerified && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  This donation has already been verified and recorded.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            {!registrationDetails.tokenVerified && (
              <Button
                onClick={handleVerifyQR}
                disabled={isVerifying}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={(open) => !open && setShowScanner(false)}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Scan QR Code
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Error Alert */}
            {cameraError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            )}

            {/* QR Reader Container - Always rendered */}
            <div 
              id="admin-qr-reader" 
              className="w-full bg-black rounded-lg overflow-hidden"
              style={{ 
                aspectRatio: "1",
                maxWidth: "400px",
                margin: "0 auto",
                minHeight: "300px"
              }}
            />

            {isCameraActive && (
              <div className="space-y-3">
                {/* Processing indicator */}
                {isProcessing && (
                  <div className="text-center">
                    <div className="bg-white rounded-lg p-4 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Processing QR code...</span>
                    </div>
                  </div>
                )}

                {/* Camera Controls */}
                {cameraDevices.length > 1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Camera:</label>
                    <select
                      value={selectedCamera}
                      onChange={(e) => startCamera(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      {cameraDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button
                  onClick={() => {
                    cleanup()
                    setShowScanner(false)
                  }}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <X className="w-4 h-4" />
                  Close Scanner
                </Button>
              </div>
            )}

            {/* Manual Entry View */}
            {!isCameraActive && cameraError && (
              <div className="space-y-3">
                <div className="text-center text-red-600 text-sm">
                  {cameraError}
                </div>
                
                <Button
                  onClick={() => startCamera()}
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Retry Camera
                    </>
                  )}
                </Button>

                {/* Camera Device Selector */}
                {cameraDevices.length > 1 && (
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
    </div>
  )
}