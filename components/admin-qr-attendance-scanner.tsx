"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Download,
  Loader2,
  X
} from "lucide-react"
import { QRScannerBase } from "./qr-scanner-base"
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
  const [manualInput, setManualInput] = useState("")
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  const isScanningRef = useRef(false)
  const { toast } = useToast()

  // Initialize beep sound
  React.useEffect(() => {
    initializeBeepSound()
  }, [])

  const processQRCode = async (qrData: string) => {
    // Prevent duplicate processing
    if (isScanningRef.current || isProcessing) {
      console.log("Already processing, ignoring...")
      return
    }

    isScanningRef.current = true
    setIsProcessing(true)

    try {
      let parsedData
      
      // Try to parse as JSON first (new format)
      try {
        parsedData = JSON.parse(qrData)
      } catch {
        // If not JSON, treat as alphanumeric token (legacy format)
        parsedData = { alphanumericToken: qrData.trim() }
      }

      // Play beep sound immediately
      await playBeep()

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

      const result = await response.json()

      // Handle Success
      if (response.ok && result.success) {
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
      } 
      // Handle Already Verified (409 Conflict)
      else if (response.status === 409 && result.registration) {
        await playErrorBeep() // Or a different beep for warning?

        const attendanceRecord: AttendanceRecord = {
          registrationId: result.registration._id,
          alphanumericToken: parsedData.alphanumericToken || parsedData.token || "N/A",
          userName: result.registration.name,
          eventTitle: eventTitle,
          timeSlot: result.registration.timeSlot || "N/A",
          scannedAt: new Date().toISOString(),
          status: "duplicate",
          errorMessage: "Already verified"
        }

        setAttendanceRecords(prev => [attendanceRecord, ...prev])
        
        toast({
          title: "Already Verified",
          description: `⚠️ ${result.registration.name} has already been verified.`,
          variant: "default", // or warning style if available
          className: "bg-yellow-100 border-yellow-200 text-yellow-900"
        })
      }
      // Handle Errors
      else {
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
      setIsProcessing(false)
      // Reset after a delay to allow for next scan
      setTimeout(() => {
        isScanningRef.current = false
      }, 2000)
    }
  }

  const handleManualEntry = async () => {
    const token = manualInput.trim()
    if (!token) return

    await processQRCode(token)
    setManualInput("")
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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

            {/* Processing indicator */}
            {isProcessing && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Processing QR code...</AlertDescription>
              </Alert>
            )}

            {/* QR Scanner */}
            <QRScannerBase
              onScanSuccess={processQRCode}
              elementId="admin-attendance-qr-reader"
              className="border rounded-lg p-4"
            />

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

            {/* Attendance Records */}
            {attendanceRecords.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-medium flex items-center gap-2">
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
                          : record.status === "duplicate"
                          ? "bg-yellow-50 border-yellow-200"
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
                          ) : record.status === "duplicate" ? (
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.scannedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      {record.errorMessage && (
                        <p className={`text-xs mt-1 ${
                          record.status === "duplicate" ? "text-yellow-700" : "text-red-600"
                        }`}>{record.errorMessage}</p>
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

// React import for useEffect
import React from "react"