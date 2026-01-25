"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, QrCode, Camera, CheckCircle2, AlertCircle, Copy, User, Heart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface NgoQRCheckerProps {
  token: string
}

interface RegistrationDetails {
  _id: string
  alphanumericToken: string
  tokenVerified: boolean
  eventId: string
  userId?: string
  userName?: string
  userEmail?: string
  name?: string // Fallback
  email?: string // Fallback
  createdAt: string
  verifiedAt?: string
  type: "donor" | "volunteer" // Added by API
}

export function NgoQRChecker({ token }: NgoQRCheckerProps) {
  const [qrInput, setQrInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [registrationDetails, setRegistrationDetails] = useState<RegistrationDetails | null>(null)
  const [registrationType, setRegistrationType] = useState<"donor" | "volunteer" | null>(null)
  const [eventDetails, setEventDetails] = useState<any>(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  
  // QR Scanner states
  const [showScanner, setShowScanner] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const isCameraStartedRef = useRef(false) // Prevent double initialization
  const isScanningRef = useRef(false)
  const { toast } = useToast()

  // Initialize beep sound
  const initializeBeepSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContext) {
        const audioCtx = new AudioContext()
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)
      }
    } catch (error) {
      console.warn("Could not initialize audio context:", error)
    }
  }

  useEffect(() => {
    initializeBeepSound()
  }, [])

  // Initialize scanner when dialog opens - with double initialization guard
  useEffect(() => {
    if (!showScanner) {
      // Reset when dialog closes
      isCameraStartedRef.current = false
      cleanup()
      return
    }

    // Prevent double initialization (React Strict Mode fix)
    if (isCameraStartedRef.current) {
      console.log("Scanner already initialized, skipping...")
      return
    }

    isCameraStartedRef.current = true

    let retryCount = 0
    const maxRetries = 10

    const initializeScanner = () => {
      const element = document.getElementById('ngo-qr-reader')
      
      if (element && !html5QrCodeRef.current) {
        try {
          console.log("Initializing NGO QR scanner...")
          html5QrCodeRef.current = new Html5Qrcode("ngo-qr-reader")
          setCameraError("")
          console.log("Scanner initialized, ready for manual start")
        } catch (error) {
          console.error("Scanner initialization error:", error)
          setCameraError("Failed to initialize scanner")
          isCameraStartedRef.current = false
        }
      } else if (!element && retryCount < maxRetries) {
        retryCount++
        console.log(`Waiting for NGO QR reader element... (${retryCount}/${maxRetries})`)
        setTimeout(initializeScanner, 200)
      } else if (retryCount >= maxRetries) {
        console.error("NGO QR reader element not found after maximum retries")
        setCameraError("Scanner element not available. Please try closing and reopening.")
        isCameraStartedRef.current = false
      }
    }

    // Start initialization
    setTimeout(initializeScanner, 100)

    return () => {
      cleanup()
      isCameraStartedRef.current = false
    }
  }, [showScanner])

  const cleanup = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop()
        }
        html5QrCodeRef.current.clear()
      } catch (error) {
        console.warn("Failed to clear scanner:", error)
      }
      html5QrCodeRef.current = null
    }
    setIsCameraActive(false)
    isScanningRef.current = false
  }

  const startCamera = async () => {
    if (!html5QrCodeRef.current) {
      setCameraError("Scanner not initialized. Please try closing and reopening.")
      return
    }

    if (isCameraActive) {
      console.log("Camera already active")
      return
    }

    setIsStartingCamera(true)
    setCameraError("")

    try {
      // Request camera permission first
      await navigator.mediaDevices.getUserMedia({ video: true })
      
      const devices = await Html5Qrcode.getCameras()
      if (devices && devices.length) {
        const cameraId = devices[0].id
        
        // Double check if we're still trying to start camera
        if (!showScanner) return

        await html5QrCodeRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (!isScanningRef.current) {
              isScanningRef.current = true
              playBeep()
              setShowScanner(false)
              processScannedQR(decodedText)
            }
          },
          (errorMessage) => {
            // Ignore frame errors - they're normal during scanning
          }
        )
        
        setIsCameraActive(true)
        setCameraError("")
        console.log("Camera started successfully")
      } else {
        setCameraError("No cameras found on this device")
      }
    } catch (err: any) {
      console.error("Camera start error:", err)
      let errorMsg = "Failed to start camera"
      
      if (err.name === "NotAllowedError") {
        errorMsg = "Camera permission denied. Please allow camera access and ensure you're on HTTPS or localhost."
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
      setIsStartingCamera(false)
    }
  }

  const stopCamera = async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop()
        console.log("Camera stopped successfully")
      } catch (error) {
        console.warn("Error stopping camera:", error)
      }
    }
    setIsCameraActive(false)
    isScanningRef.current = false
  }

  const playBeep = () => {
    try {
      // Simple beep implementation
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContext) {
        const audioCtx = new AudioContext()
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime)
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
        
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.2)
      }
    } catch (error) {
      console.log("Beep!")
    }
  }

  const processScannedQR = async (qrData: string) => {
    try {
      let parsedData
      try {
        parsedData = JSON.parse(qrData)
      } catch {
        parsedData = { alphanumericToken: qrData.trim() }
      }

      const tokenToSearch = parsedData.alphanumericToken || parsedData.token || qrData.trim()
      setQrInput(tokenToSearch)
      await handleSearchQR(tokenToSearch)
    } catch (error) {
      setErrorMessage("Failed to process scanned QR code")
    } finally {
      isScanningRef.current = false
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
    setEventDetails(null)
    setRegistrationType(null)

    try {
      const response = await fetch(
        `/api/ngo/qr-verify?alphanumericToken=${encodeURIComponent(tokenToSearch)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok) {
        setRegistrationDetails(data.registration)
        setRegistrationType(data.type)
        setEventDetails(data.event)
        if (!qrToken) {
          setQrInput(tokenToSearch)
        }
      } else {
        setErrorMessage(data.error || "QR token not found or access denied")
      }
    } catch (err) {
      setErrorMessage("Error searching for QR code")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyQR = async () => {
    if (!registrationDetails || !registrationType) return

    setIsVerifying(true)
    try {
      const response = await fetch("/api/ngo/qr-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          registrationId: registrationDetails._id,
          type: registrationType
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage(data.message || "Verified successfully")
        setRegistrationDetails(prev => prev ? ({ ...prev, tokenVerified: true }) : null)
        toast({
          title: "Success",
          description: data.message,
          className: "bg-green-600 text-white",
        })
      } else {
        setErrorMessage(data.error || "Verification failed")
      }
    } catch (err) {
      setErrorMessage("Error verifying QR code")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCopyQR = () => {
    navigator.clipboard.writeText(qrInput)
    toast({ description: "Token copied to clipboard" })
  }

  return (
    <div className="space-y-6">
      {/* QR Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Volunteer & Donor Scanner
          </CardTitle>
          <CardDescription>
            Scan QR codes to verify volunteers and donors for your events
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

            <div className="flex gap-2 mb-3">
              <Button
                onClick={() => setShowScanner(true)}
                variant="outline"
                className="gap-2"
              >
                <Camera className="w-4 h-4" />
                Scan QR Code
              </Button>
              <span className="text-sm text-gray-500 flex items-center">or enter token manually</span>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Enter token (e.g., ABC123)"
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
      {registrationDetails && eventDetails && (
        <Card className={`border-2 ${registrationType === 'volunteer' ? 'border-purple-200 bg-purple-50' : 'border-blue-200 bg-blue-50'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                    {registrationType === 'volunteer' ? <User className="w-5 h-5 text-purple-600"/> : <Heart className="w-5 h-5 text-red-600"/>}
                    {registrationType === 'volunteer' ? 'Volunteer' : 'Donor'} Registration
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Token: {qrInput}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyQR}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="font-semibold text-gray-600">Name:</span>
                        <p>{registrationDetails.userName || registrationDetails.name}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600">Email:</span>
                        <p>{registrationDetails.userEmail || registrationDetails.email}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600">Event:</span>
                        <p>{eventDetails.title}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600">Date:</span>
                        <p>{new Date(eventDetails.eventDate).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Status Display */}
            {registrationDetails.tokenVerified && (
              <Alert className="bg-green-50 border-green-200 mt-4">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  This {registrationType} has already been verified.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            {!registrationDetails.tokenVerified && (
              <Button
                onClick={handleVerifyQR}
                disabled={isVerifying}
                className={`w-full mt-4 ${registrationType === 'volunteer' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
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
                    Mark as {registrationType === 'volunteer' ? 'Attended' : 'Donated'}
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
            {cameraError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            )}

            {/* QR Reader Container - Always rendered */}
            <div 
              id="ngo-qr-reader" 
              className="w-full aspect-square bg-black overflow-hidden rounded-lg"
            />
            
            {!isCameraActive && !isStartingCamera && (
              <div className="space-y-3">
                <Button
                  onClick={startCamera}
                  className="w-full gap-2"
                  disabled={isStartingCamera}
                >
                  <Camera className="w-4 h-4" />
                  Start Camera
                </Button>
                
                <p className="text-sm text-center text-muted-foreground">
                  Click "Start Camera" to begin scanning QR codes
                </p>
              </div>
            )}

            {isStartingCamera && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Starting camera...</span>
                </div>
              </div>
            )}

            {isCameraActive && (
              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground">
                  Point your camera at the QR code
                </p>
                
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="w-full gap-2"
                >
                  Stop Camera
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}