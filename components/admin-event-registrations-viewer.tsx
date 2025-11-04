"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, AlertCircle, QrCode, Download, Check } from "lucide-react"
import QRCode from "qrcode.react"

interface Registration {
  _id: string
  registrationNumber: string
  name: string
  email: string
  timeSlot: string
  status: string
  qrToken?: string
  qrVerified?: boolean
  donationStatus?: string
  createdAt: string
}

interface AdminEventRegistrationsViewerProps {
  eventId: string | null
  token: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminEventRegistrationsViewer({
  eventId,
  token,
  open,
  onOpenChange,
}: AdminEventRegistrationsViewerProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [showQRDialog, setShowQRDialog] = useState(false)

  useEffect(() => {
    if (open && eventId) {
      fetchRegistrations()
    }
  }, [open, eventId])

  const fetchRegistrations = async () => {
    if (!eventId) return

    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/admin/event-registrations?eventId=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setRegistrations(data.registrations || [])
      } else {
        setError("Failed to fetch registrations")
      }
    } catch (err) {
      setError("Error fetching registrations")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewQR = (registration: Registration) => {
    setSelectedRegistration(registration)
    setShowQRDialog(true)
  }

  const handleDownloadQR = () => {
    if (!selectedRegistration) return
    
    const qrElement = document.getElementById(`qr-admin-${selectedRegistration._id}`)
    if (qrElement) {
      const canvas = qrElement.querySelector("canvas")
      if (canvas) {
        const link = document.createElement("a")
        link.href = canvas.toDataURL("image/png")
        link.download = `${selectedRegistration.registrationNumber}-qr.png`
        link.click()
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-amber-100 text-amber-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-4xl max-h-96 overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Event Registrations - QR Code Scanner</AlertDialogTitle>
            <AlertDialogDescription>
              View all volunteer registrations for this event ({registrations.length} registered). Click "View QR" to see scannable QR codes.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading registrations...</span>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No registrations yet</div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reg #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Donation</TableHead>
                    <TableHead>QR Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow key={reg._id}>
                      <TableCell className="font-medium text-sm">{reg.registrationNumber}</TableCell>
                      <TableCell className="text-sm">{reg.name}</TableCell>
                      <TableCell className="text-sm">{reg.email}</TableCell>
                      <TableCell className="text-sm">{reg.timeSlot}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(reg.donationStatus || "Pending")} variant="outline">
                          {reg.donationStatus || "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          onClick={() => handleViewQR(reg)}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <QrCode className="w-4 h-4" />
                          View QR
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <AlertDialogCancel>Close</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Display Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Donor QR Code
            </DialogTitle>
            <DialogDescription>Scan this code to verify donor check-in</DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-4">
              {/* Donor Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Registration #</p>
                  <p className="font-semibold">{selectedRegistration.registrationNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Donor Name</p>
                  <p className="font-semibold">{selectedRegistration.name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-semibold text-sm break-all">{selectedRegistration.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time Slot</p>
                  <p className="font-semibold">{selectedRegistration.timeSlot}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="flex items-center gap-1">
                    {selectedRegistration.qrVerified ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-semibold">Verified</span>
                      </>
                    ) : (
                      <Badge variant="outline" className={getStatusColor(selectedRegistration.donationStatus || "Pending")}>
                        {selectedRegistration.donationStatus || "Pending"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              {selectedRegistration.qrToken ? (
                <>
                  <div className="flex flex-col items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-gray-700">Scan for Check-in</p>
                    <div 
                      id={`qr-admin-${selectedRegistration._id}`} 
                      className="p-3 bg-white rounded-lg border-2 border-blue-300"
                    >
                      <QRCode
                        value={selectedRegistration.qrToken || ""}
                        size={250}
                        level="H"
                        includeMargin={true}
                        fgColor="#000000"
                        bgColor="#ffffff"
                      />
                    </div>
                    <div className="w-full">
                      <p className="text-xs text-gray-600 mb-2 font-medium">QR Token:</p>
                      <code className="text-xs bg-gray-100 p-2 rounded block border font-mono break-all">
                        {selectedRegistration.qrToken}
                      </code>
                    </div>
                  </div>

                  <Button 
                    onClick={handleDownloadQR} 
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">QR Code Not Available</p>
                    <p className="text-xs text-amber-800 mt-1">Please try refreshing or contacting support</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowQRDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}