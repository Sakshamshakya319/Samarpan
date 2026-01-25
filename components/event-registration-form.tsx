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
import { QRCodeGenerator } from "./qr-code-generator"


interface EventRegistrationFormProps {
  eventId: string
  eventTitle: string
  eventDate: string
  volunteerSlotsNeeded: number
  registeredVolunteers: number
  token: string | null
  isAlreadyRegistered?: boolean
  registrationStatus?: {
    isDonorRegistered: boolean
    isVolunteerRegistered: boolean
  }
}

interface EventDetails {
  _id: string
  title: string
  eventDate: string
  locationType: string
  participantCategories: string[]
  volunteerSlotsNeeded: number
  registeredVolunteers: number
}

const LOCATION_TYPE_LABELS: Record<string, Record<string, string>> = {
  school: {
    students: "Students",
    staff: "Staff",
    others: "Others"
  },
  college: {
    students: "Students",
    faculty: "Faculty",
    staff: "Staff",
    others: "Others"
  },
  society: {
    children: "Children",
    men: "Men",
    women: "Women",
    elderly_men: "Elderly Men",
    elderly_women: "Elderly Women",
    others: "Others"
  },
  hospital: {
    patients: "Patients",
    staff: "Medical Staff",
    visitors: "Visitors",
    others: "Others"
  },
  corporate: {
    employees: "Employees",
    management: "Management",
    visitors: "Visitors",
    others: "Others"
  },
  public: {
    general_public: "General Public",
    others: "Others"
  }
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

// Helper functions for identifier labels and placeholders
const getIdentifierLabel = (locationType?: string, participantType?: string): string => {
  if (!locationType || !participantType) return "Identifier"
  
  const labelMap: Record<string, Record<string, string>> = {
    school: {
      students: "Student ID",
      staff: "Staff ID"
    },
    college: {
      students: "Registration Number",
      faculty: "Faculty ID",
      staff: "Staff ID"
    },
    corporate: {
      employees: "Employee ID",
      management: "Management ID"
    },
    hospital: {
      staff: "Staff ID"
    }
  }
  
  return labelMap[locationType]?.[participantType] || "Identifier"
}

const getIdentifierPlaceholder = (locationType?: string, participantType?: string): string => {
  if (!locationType || !participantType) return "Enter your identifier"
  
  const placeholderMap: Record<string, Record<string, string>> = {
    school: {
      students: "Enter your student ID",
      staff: "Enter your staff ID"
    },
    college: {
      students: "Enter your registration number",
      faculty: "Enter your faculty ID",
      staff: "Enter your staff ID"
    },
    corporate: {
      employees: "Enter your employee ID",
      management: "Enter your management ID"
    },
    hospital: {
      staff: "Enter your staff ID"
    }
  }
  
  return placeholderMap[locationType]?.[participantType] || "Enter your identifier"
}



export function EventRegistrationForm({
  eventId,
  eventTitle,
  eventDate,
  volunteerSlotsNeeded,
  registeredVolunteers,
  token,
  isAlreadyRegistered = false,
  registrationStatus = { isDonorRegistered: false, isVolunteerRegistered: false }
}: EventRegistrationFormProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("")
  const [participantType, setParticipantType] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [alphanumericToken, setAlphanumericToken] = useState("")
  const [registrationId, setRegistrationId] = useState("")
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null)
  const [isLoadingEvent, setIsLoadingEvent] = useState(false)

  const { user } = useAppSelector((state) => state.user)
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  const availableSlots = volunteerSlotsNeeded - registeredVolunteers
  const isFull = availableSlots <= 0
  const canRegister = isAuthenticated && token && !isFull && !registrationStatus.isDonorRegistered

  // Fetch event details to get participant categories
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return
      
      setIsLoadingEvent(true)
      try {
        const response = await fetch(`/api/events?id=${eventId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.length > 0) {
            setEventDetails(data[0])
          }
        }
      } catch (error) {
        console.error("Error fetching event details:", error)
      } finally {
        setIsLoadingEvent(false)
      }
    }

    fetchEventDetails()
  }, [eventId])



  const handleSubmit = async () => {
    if (!token) {
      setError("Please login to register")
      return
    }

    if (!participantType) {
      setError("Please select participant type")
      return
    }

    // Check if identifier is required for this participant type
    const requiresIdentifier = eventDetails?.locationType === 'school' && (participantType === 'students' || participantType === 'staff') ||
                              eventDetails?.locationType === 'college' && (participantType === 'students' || participantType === 'faculty' || participantType === 'staff') ||
                              eventDetails?.locationType === 'corporate' && (participantType === 'employees' || participantType === 'management')

    if (requiresIdentifier && !registrationNumber.trim()) {
      let errorMessage = "Identifier is required for this participant type"
      if (eventDetails?.locationType === 'school' && participantType === 'students') {
        errorMessage = "Student ID is required"
      } else if (eventDetails?.locationType === 'school' && participantType === 'staff') {
        errorMessage = "Staff ID is required"
      } else if (eventDetails?.locationType === 'college' && participantType === 'students') {
        errorMessage = "Registration number is required"
      } else if (eventDetails?.locationType === 'college' && participantType === 'faculty') {
        errorMessage = "Faculty ID is required"
      } else if (eventDetails?.locationType === 'college' && participantType === 'staff') {
        errorMessage = "Staff ID is required"
      } else if (eventDetails?.locationType === 'corporate' && participantType === 'employees') {
        errorMessage = "Employee ID is required"
      } else if (eventDetails?.locationType === 'corporate' && participantType === 'management') {
        errorMessage = "Management ID is required"
      }
      setError(errorMessage)
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
          participantType,
          name: user.name,
          timeSlot: selectedTimeSlot,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAlphanumericToken(data.alphanumericToken)
        setRegistrationId(data.registrationId)
        setSuccess(true)
        setShowDialog(false)
        setRegistrationNumber("")
        setParticipantType("")
        setSelectedTimeSlot("")
        // Don't reload page - let user see QR code immediately
        // window.location.reload()
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

            {registrationStatus.isDonorRegistered && (
              <div className="p-3 bg-blue-100 text-blue-800 rounded-md text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <div>
                  <p className="font-medium">You're already registered as a donor for this event!</p>
                  <p className="text-xs mt-1">You cannot register as both donor and volunteer for the same event.</p>
                </div>
              </div>
            )}

            {isFull && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                All volunteer slots for this event are filled
              </div>
            )}

            {success && (
              <div className="space-y-4">
                <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Registration successful!</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Your QR code has been generated below. Show this QR code at the event for attendance verification.
                  </p>
                </div>
                
                {/* QR Code Generator - Main Focus */}
                {alphanumericToken && registrationId && user?.name && (
                  <QRCodeGenerator
                    registrationId={registrationId}
                    alphanumericToken={alphanumericToken}
                    userName={user.name}
                    eventTitle={eventTitle}
                    eventDate={eventDate}
                    timeSlot={selectedTimeSlot}
                  />
                )}
              </div>
            )}

            <Button
              onClick={() => setShowDialog(true)}
              disabled={!canRegister}
              className="w-full"
              size="lg"
            >
              {registrationStatus.isDonorRegistered 
                ? "Already Registered as Donor" 
                : isFull 
                ? "Event is Full" 
                : "Register as Volunteer"
              }
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

            {/* Participant Type Selection */}
            <div>
              <label className="text-sm font-medium">Participant Type *</label>
              {isLoadingEvent ? (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading participant types...</span>
                </div>
              ) : eventDetails?.participantCategories ? (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {eventDetails.participantCategories.map((category) => {
                    const label = LOCATION_TYPE_LABELS[eventDetails.locationType]?.[category] || category
                    return (
                      <div key={category} className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`pt-${category}`}
                          name="participantType"
                          checked={participantType === category}
                          onChange={() => setParticipantType(category)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`pt-${category}`} className="text-sm cursor-pointer">
                          {label}
                        </label>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground mt-2">
                  No participant categories available
                </div>
              )}
            </div>

            <div>
              {participantType && participantType !== "others" && participantType !== "general_public" ? (
                <>
                  <label className="text-sm font-medium">
                    {getIdentifierLabel(eventDetails?.locationType, participantType)} *
                  </label>
                  <Input
                    type="text"
                    placeholder={getIdentifierPlaceholder(eventDetails?.locationType, participantType)}
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                  />
                </>
              ) : participantType === "others" || participantType === "general_public" ? (
                <>
                  <label className="text-sm font-medium">Identifier</label>
                  <Input
                    type="text"
                    placeholder="(Optional)"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                  />
                </>
              ) : null}
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