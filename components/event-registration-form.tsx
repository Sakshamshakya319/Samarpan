"use client"

import { useState, useEffect } from "react"
import { useAppSelector } from "@/lib/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Loader2, QrCode } from "lucide-react"
import { QRRegistrationScanner } from "@/components/qr-registration-scanner"

interface EventRegistrationFormProps {
  eventId: string
  eventTitle: string
  eventDate: string
  volunteerSlotsNeeded: number
  registeredVolunteers: number
  token: string | null
}

// Generate 2-hour time slots from 9am to 5pm
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 9; hour < 17; hour++) {
    const startHour = hour.toString().padStart(2, "0")
    const endHour = (hour + 2).toString().padStart(2, "0")
    slots.push(`${startHour}:00-${endHour}:00`)
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

interface QRRegistrationData {
  registrationNumber: string
  name: string
  email?: string
  phone?: string
  bloodType?: string
}

export function EventRegistrationForm({
  eventId,
  eventTitle,
  eventDate,
  volunteerSlotsNeeded,
  registeredVolunteers,
  token,
}: EventRegistrationFormProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [scannedData, setScannedData] = useState<QRRegistrationData | null>(null)

  const { user } = useAppSelector((state) => state.user)
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  const availableSlots = volunteerSlotsNeeded - registeredVolunteers
  const isFull = availableSlots <= 0
  const canRegister = isAuthenticated && token && !isFull

  const handleQRScanSuccess = (data: QRRegistrationData) => {
    setScannedData(data)
    setRegistrationNumber(data.registrationNumber)
    setError("")
  }

  const handleQRScanError = (error: string) => {
    setError(`QR Scan Error: ${error}`)
  }

  const handleSubmit = async () => {
    if (!token) {
      setError("Please login to register")
      return
    }

    if (!registrationNumber.trim()) {
      setError("Registration number is required")
      return
    }

    if (!selectedTimeSlot) {
      setError("Please select a time slot")
      return
    }

    if (!user?.name) {
      setError("User name not found. Please update your profile.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/event-registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          registrationNumber,
          name: user.name,
          timeSlot: selectedTimeSlot,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setShowDialog(false)
        setRegistrationNumber("")
        setSelectedTimeSlot("")
        setScannedData(null)
        // Refresh page to show updated registration count
        window.location.reload()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to register")
      }
    } catch (err) {
      setError("Error registering for event")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (!isAuthenticated) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-800">Please log in to register as a volunteer for this event.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Volunteer Registration</CardTitle>
          <CardDescription>Sign up to volunteer for this event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(eventDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Available Slots</p>
                <p className="font-medium">
                  {availableSlots > 0 ? (
                    <span className="text-green-600">{availableSlots} / {volunteerSlotsNeeded}</span>
                  ) : (
                    <span className="text-red-600">Full</span>
                  )}
                </p>
              </div>
            </div>

            {isFull && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                All volunteer slots for this event are filled
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Registration successful!
              </div>
            )}

            <Button
              onClick={() => setShowDialog(true)}
              disabled={!canRegister}
              className="w-full"
              size="lg"
            >
              {isFull ? "Event is Full" : "Register as Volunteer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registration Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Register as Volunteer</AlertDialogTitle>
            <AlertDialogDescription>
              Register for {eventTitle} on {formatDate(eventDate)}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Your Name</label>
              <Input
                type="text"
                value={user?.name || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Auto-filled from your profile</p>
            </div>

            <div>
              <label className="text-sm font-medium">Event Date</label>
              <Input
                type="text"
                value={formatDate(eventDate)}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Auto-filled from event</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Registration Number *</label>
                <QRRegistrationScanner
                  onScanSuccess={handleQRScanSuccess}
                  onScanError={handleQRScanError}
                  title="Scan Registration QR Code"
                  description="Scan the QR code from your registration card"
                />
              </div>
              <Input
                type="text"
                placeholder="Enter your registration number or scan QR code"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className={scannedData ? "border-green-500 bg-green-50" : ""}
              />
              {scannedData && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>QR code scanned successfully</span>
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    <strong>Scanned:</strong> {scannedData.name} ({scannedData.registrationNumber})
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Select Time Slot (2 hours) *</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`p-2 text-sm border rounded transition-colors ${
                      selectedTimeSlot === slot
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/50"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting || !registrationNumber.trim() || !selectedTimeSlot}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}