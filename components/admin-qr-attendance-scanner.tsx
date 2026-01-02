"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  CameraOff, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Download,
  Loader2,
  RotateCcw,
  X
} from "lucide-react"
import { playBeep, playSuccessBeep, playErrorBeep, initializeBeepSound } from "./beep-sound"
import { useToast } from "@/hooks/use-toast"

interface AttendanceRecord {
  registrationId: string
  alphanumericToken: string
  userName: string
  eventTitle: string
  timeSlot: string
  scannedAt: string
  status: "success" | "error" | "duplicate"
  errorMessage?: string
}

interface AdminQRAttendanceScannerProps {
  eventId: string
  eventTitle: string
  token: string
  onAttendanceUpdate?: (count: number) => void
}

export function AdminQRAttendanceScanner({
  eventId,
  eventTitle,
  token,
  onAttendanceUpdate,
}: AdminQRAttendanceScannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [manualInput, setManualInput] = useState("")
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const isScanningRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()

  // Initialize beep sound and camera devices
  useEffect(() => {
    initializeBeepSound()
    initializeCameras()
  }, [])

  // Initialize scanner when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Create scanner instance
      html5QrCodeRef.current = new Html5Qrcode("qr-reader")
      
      // Start scanner automatically
      startCamera()
    }
    
    return () => {
      cleanup()
    }
  }, [isOpen])

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
      html5QrCodeRef.current.stop().catch(() => {})
      html5QrCodeRef.current.clear()
      html5QrCodeRef.current = null
    }
    setIsCameraActive(false)
    isScanningRef.current = false
  }

  const startCamera = async (deviceId?: string) => {
    if (!html5QrCodeRef.current) return
    
    setIsLoading(true)
    setError("")

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
      setError("")
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

      setError(errorMsg)
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
    // Prevent duplicate scans - following QR module README pattern
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

      // Process QR code
      await processQRCode(decodedText)
      
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
      isScanningRef.current = false
    } finally {
      setIsProcessing(false)
    }
  }

  const onScanFailure = (error: string) => {
    // Ignore scan failures - they're normal during scanning (following QR module README)
    console.debug("QR scan attempt:", error)
  }

  const processQRCode = async (qrData: string) => {
    try {
      let parsedData
      
      // Try to parse as JSON first (new format)
      try {
        parsedData = JSON.parse(qrData)
      } catch {
        // If not JSON, treat as alphanumeric token (legacy format)
        parsedData = { alphanumericToken: qrData.trim() }
      }

      // Verify attendance via API
      const response = await fetch("/api/event-registrations/qr-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          alphanumericToken: parsedData.alphanumericToken || parsedData.token,
          registrationId: parsedData.registrationId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        // Success
        await playSuccessBeep()
        
        const attendanceRecord: AttendanceRecord = {
          registrationId: result.registration._id,
          alphanumericToken: parsedData.alphanumericToken || parsedData.token || "N/A",
          userName: result.registration.name,
          eventTitle: eventTitle,
          timeSlot: result.registration.timeSlot || "N/A",
          scannedAt: new Date().toISOString(),
          status: "success",
        }

        setAttendanceRecords(prev => [attendanceRecord, ...prev])
        onAttendanceUpdate?.(attendanceRecords.length + 1)
        
        toast({
          title: "Success",
          description: `✅ ${result.registration.name} - Attendance marked!`,
        })
      } else {
        throw new Error(result.error || "Verification failed")
      }
    } catch (error) {
      console.error("QR processing error:", error)
      await playErrorBeep()
      
      const errorMessage = error instanceof Error ? error.message : "Processing failed"
      
      const attendanceRecord: AttendanceRecord = {
        registrationId: "unknown",
        alphanumericToken: qrData,
        userName: "Unknown",
        eventTitle: eventTitle,
        timeSlot: "N/A",
        scannedAt: new Date().toISOString(),
        status: "error",
        errorMessage,
      }

      setAttendanceRecords(prev => [attendanceRecord, ...prev])
      toast({
        title: "Error",
        description: `❌ ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      // Reset processing state
      isScanningRef.current = false
    }
  }

  const handleManualEntry = async () => {
    const token = manualInput.trim()
    if (!token) return

    setIsProcessing(true)
    await processQRCode(token)
    setManualInput("")
    setIsProcessing(false)
  }

  const switchCamera = async (deviceId: string) => {
    setSelectedCamera(deviceId)
    if (isCameraActive) {
      await startCamera(deviceId)
    }
  }

  const exportToExcel = () => {
    if (attendanceRecords.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records to export",
        variant: "destructive",
      })
      return
    }

    // Create CSV content
    const headers = ["Name", "Token", "Time Slot", "Scanned At", "Status", "Error Message"]
    const csvContent = [
      headers.join(","),
      ...attendanceRecords.map(record => [
        `"${record.userName}"`,
        record.alphanumericToken,
        `"${record.timeSlot}"`,
        new Date(record.scannedAt).toLocaleString(),
        record.status,
        `"${record.errorMessage || ""}"`
      ].join(","))
    ].join("\n")

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${eventTitle.replace(/\s+/g, "-")}-attendance-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Success",
      description: "Attendance exported to CSV!",
    })
  }

  const handleClose = () => {
    cleanup()
    setIsOpen(false)
    setManualInput("")
    setError("")
  }

  const successCount = attendanceRecords.filter(r => r.status === "success").length
  const errorCount = attendanceRecords.filter(r => r.status === "error").length

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <QrCode className="w-4 h-4" />
        Scan Attendance
        {attendanceRecords.length > 0 && (
          <Badge variant="secondary" className="ml-2">
            {successCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Event Attendance Scanner
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{eventTitle}</p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{successCount}</div>
                  <div className="text-xs text-muted-foreground">Present</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold">{attendanceRecords.length}</div>
                  <div className="text-xs text-muted-foreground">Total Scans</div>
                </CardContent>
              </Card>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Camera View - QR Reader Container ALWAYS rendered */}
            <div 
              id="qr-reader" 
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
                {/* Scanning overlay */}
                <div className="absolute inset-4 border-2 border-green-500 rounded-lg opacity-75 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 border-2 border-green-400" />
                </div>

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </div>
                  </div>
                )}

                {/* Camera Controls */}
                <div className="flex gap-2">
                  {cameraDevices.length > 1 && (
                    <select
                      value={selectedCamera}
                      onChange={(e) => switchCamera(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                    >
                      {cameraDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  )}
                  <Button
                    onClick={() => setIsCameraActive(false)}
                    variant="outline"
                    size="sm"
                  >
                    <CameraOff className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Manual Entry View */}
            {!isCameraActive && (
              <div className="space-y-3">
                {error && (
                  <div className="text-center text-red-600 text-sm">
                    {error}
                  </div>
                )}
                
                <Button
                  onClick={() => startCamera()}
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
                      Start Camera Scanner
                    </>
                  )}
                </Button>

                {/* Manual Entry */}
                <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Manual Entry</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter token or paste QR data..."
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
                      disabled={!manualInput.trim() || isProcessing}
                      size="sm"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Records */}
            {attendanceRecords.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Recent Scans ({attendanceRecords.length})
                  </h3>
                  <Button
                    onClick={exportToExcel}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2">
                  {attendanceRecords.slice(0, 10).map((record, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        record.status === "success"
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{record.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {record.timeSlot} • {record.alphanumericToken}
                          </p>
                        </div>
                        <div className="text-right">
                          {record.status === "success" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.scannedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      {record.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">{record.errorMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}