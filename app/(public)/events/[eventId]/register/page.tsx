"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAppSelector } from "@/lib/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Calendar, MapPin, Users, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Event {
  _id: string
  title: string
  description: string
  eventDate: string
  startTime: string
  endTime: string
  location: string
  expectedAttendees: number
  volunteerSlotsNeeded: number
  registeredVolunteers: number
  eventType: string
  allowRegistrations?: boolean
  ngoName?: string
  ngoLogo?: string
  ngoWebsite?: string
  organizedBy?: string
}

// Generate 2-hour time slots based on event end time
const generateTimeSlots = (endTime: string): string[] => {
  const slots = []
  
  // Parse end time (format: "HH:MM" or "H:MM")
  let endHour = 17 // default to 5 PM
  if (endTime) {
    const [hourStr] = endTime.split(":")
    const hour = parseInt(hourStr)
    endHour = hour
  }
  
  // Generate slots from 9am, ensuring last slot doesn't exceed end time
  for (let hour = 9; hour < endHour; hour++) {
    const startHour = hour.toString().padStart(2, "0")
    const slotEndHour = (hour + 2).toString().padStart(2, "0")
    
    // Only add slot if it ends on or before the event end time
    const slotEndHourNum = hour + 2
    if (slotEndHourNum <= endHour) {
      slots.push(`${startHour}:00-${slotEndHour}:00`)
    }
  }
  
  return slots
}

export default function EventRegistrationPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const { toast } = useToast()

  const [event, setEvent] = useState<Event | null>(null)
  const [isLoadingEvent, setIsLoadingEvent] = useState(true)
  const [eventError, setEventError] = useState("")

  const [registrationNumber, setRegistrationNumber] = useState("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("")
  const [participantType, setParticipantType] = useState<"student" | "staff" | "other" | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true)
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false)

  const { data: user } = useAppSelector((state) => state.user)
  const { isAuthenticated, token } = useAppSelector((state) => state.auth)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  // Fetch event details
  useEffect(() => {
    if (!eventId) return

    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events?id=${eventId}`)
        if (response.ok) {
          const data = await response.json()
          const eventData = data.events?.find((e: Event) => e._id === eventId)
          if (eventData) {
            setEvent(eventData)
            // Generate time slots based on event end time
            const slots = generateTimeSlots(eventData.endTime)
            setTimeSlots(slots)
          } else {
            setEventError("Event not found")
          }
        } else {
          setEventError("Failed to load event details")
        }
      } catch (err) {
        setEventError("Error loading event")
        console.error(err)
      } finally {
        setIsLoadingEvent(false)
      }
    }

    fetchEvent()
  }, [eventId])

  // Fetch user profile to get phone number
  useEffect(() => {
    if (!token) return

    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setPhoneNumber(data.user?.phone || "")
        }
      } catch (err) {
        console.error("Error fetching user profile:", err)
      }
    }

    fetchUserProfile()
  }, [token])

  // Check if user is already registered for this event
  useEffect(() => {
    if (!eventId || !token) {
      setIsCheckingRegistration(false)
      return
    }

    const checkUserRegistration = async () => {
      try {
        const response = await fetch(`/api/event-registrations?eventId=${eventId}&checkUser=true`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setIsAlreadyRegistered(data.isRegistered || false)
        }
      } catch (err) {
        console.error("Error checking registration status:", err)
      } finally {
        setIsCheckingRegistration(false)
      }
    }

    checkUserRegistration()
  }, [eventId, token])

  const handleSubmit = async () => {
    if (!token) {
      setSubmitError("Please login to register")
      return
    }

    if (!participantType) {
      setSubmitError("Please select participant type")
      return
    }

    if ((participantType === "student" || participantType === "staff") && !registrationNumber.trim()) {
      setSubmitError(participantType === "student" ? "Registration number is required for LPU Student" : "UID is required for LPU Staff")
      return
    }

    if (!selectedTimeSlot) {
      setSubmitError("Please select a time slot")
      return
    }

    if (!user?.name) {
      setSubmitError("User name not found. Please update your profile.")
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

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
        setIsSuccess(true)
        toast({
          title: "Registration Successful!",
          description: `You have been registered for ${event?.title}`,
          variant: "default",
        })
        
        // Redirect to confirmation page with registration ID
        setTimeout(() => {
          router.push(
            `/events/${eventId}/register/confirmation?registrationId=${data.registrationId}`
          )
        }, 1500)
      } else {
        const data = await response.json()
        setSubmitError(data.error || "Failed to register")
      }
    } catch (err) {
      setSubmitError("Error registering for event")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatEventType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const availableSlots = event ? event.volunteerSlotsNeeded - event.registeredVolunteers : 0
  const isFull = availableSlots <= 0
  const identifierLabel = participantType === "student" ? "Registration Number" : participantType === "staff" ? "UID" : "Identifier (optional)"

  if (isLoadingEvent) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background py-20 md:py-32">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading event details...</span>
          </div>
        </div>
      </main>
    )
  }

  if (eventError || !event) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background py-20 md:py-32">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="outline"
            onClick={() => router.push("/events")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{eventError || "Event not found"}</AlertDescription>
          </Alert>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push("/events")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Event Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Event Card */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{event.title}</h1>
                    <Badge variant="secondary">{formatEventType(event.eventType)}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg text-muted-foreground">{event.description}</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date</p>
                      <p className="text-lg font-semibold">{formatDate(event.eventDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Time</p>
                      <p className="text-lg font-semibold">{event.startTime || "TBA"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="text-lg font-semibold">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Volunteers</p>
                      <p className="text-lg font-semibold">
                        {event.registeredVolunteers} / {event.volunteerSlotsNeeded}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Volunteer Slots Filled</span>
                    <span className="text-sm font-semibold text-primary">
                      {Math.round((event.registeredVolunteers / event.volunteerSlotsNeeded) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          (event.registeredVolunteers / event.volunteerSlotsNeeded) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* NGO Details Section */}
                {(event.ngoName || event.ngoLogo || event.organizedBy) && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Event Organizer Information</h3>
                    <div className="space-y-4">
                      {event.ngoLogo && (
                        <div className="flex justify-center">
                          <img
                            src={event.ngoLogo}
                            alt={event.ngoName || "NGO Logo"}
                            className="h-16 w-auto rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none"
                            }}
                          />
                        </div>
                      )}
                      {event.ngoName && (
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground mb-1">NGO Name</p>
                          {event.ngoWebsite ? (
                            <a
                              href={event.ngoWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lg font-semibold text-blue-600 hover:underline"
                            >
                              {event.ngoName}
                            </a>
                          ) : (
                            <p className="text-lg font-semibold">{event.ngoName}</p>
                          )}
                        </div>
                      )}
                      {event.organizedBy && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Organised By</p>
                          <p className="text-muted-foreground whitespace-pre-wrap">{event.organizedBy}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Registration Form */}
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Registration</CardTitle>
                <CardDescription>
                  Fill in the details below to register as a volunteer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Already Registered Message */}
                {isAlreadyRegistered && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      You are already registered for this event. Thank you for your participation!
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success Message */}
                {isSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Registration successful! You will be redirected shortly...
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Message */}
                {submitError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                {/* Full Event Message */}
                {isFull && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      All volunteer slots for this event are filled. Please check back later for other events.
                    </AlertDescription>
                  </Alert>
                )}

                {!isFull && !isAlreadyRegistered && (
                  <>
                    {/* Participant Type Selection - FIRST */}
                    <div>
                      <label className="text-sm font-semibold mb-3 block">
                        Participant Type <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <label className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover:border-primary/50">
                          <Checkbox
                            checked={participantType === "student"}
                            onCheckedChange={(checked) => setParticipantType(checked ? "student" : "")}
                            disabled={isSubmitting}
                          />
                          <span className="text-sm font-medium">LPU Student</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover:border-primary/50">
                          <Checkbox
                            checked={participantType === "staff"}
                            onCheckedChange={(checked) => setParticipantType(checked ? "staff" : "")}
                            disabled={isSubmitting}
                          />
                          <span className="text-sm font-medium">LPU Staff</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover:border-primary/50">
                          <Checkbox
                            checked={participantType === "other"}
                            onCheckedChange={(checked) => setParticipantType(checked ? "other" : "")}
                            disabled={isSubmitting}
                          />
                          <span className="text-sm font-medium">Others</span>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Select your participant category. Identifier is required for Students and Staff.
                      </p>
                    </div>

                    {/* Registration Identifier - SECOND (shown only for Student/Staff) */}
                    {(participantType === "student" || participantType === "staff") && (
                      <div>
                        <label className="text-sm font-semibold mb-2 block">
                          {identifierLabel} <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          placeholder={participantType === "student" ? "Enter your registration number" : "Enter your UID"}
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    )}

                    {/* Your Name - SECOND */}
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Your Name</label>
                      <Input
                        type="text"
                        value={user?.name || ""}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-filled from your profile
                      </p>
                    </div>

                    {/* Event Date - THIRD */}
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Event Date</label>
                      <Input
                        type="text"
                        value={formatDate(event.eventDate)}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-filled from event
                      </p>
                    </div>

                    {/* Participant Type Selection - FOURTH */}
                    <div>
                      <label className="text-sm font-semibold mb-3 block">
                        Participant Type <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setParticipantType("student")}
                          disabled={isSubmitting}
                          className={`p-3 text-sm border-2 rounded-lg font-medium transition-all ${
                            participantType === "student"
                              ? "bg-primary text-primary-foreground border-primary shadow-lg"
                              : "bg-background border-border hover:border-primary/50 hover:shadow-md"
                          }`}
                        >
                          LPU Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setParticipantType("staff")}
                          disabled={isSubmitting}
                          className={`p-3 text-sm border-2 rounded-lg font-medium transition-all ${
                            participantType === "staff"
                              ? "bg-primary text-primary-foreground border-primary shadow-lg"
                              : "bg-background border-border hover:border-primary/50 hover:shadow-md"
                          }`}
                        >
                          LPU Staff
                        </button>
                        <button
                          type="button"
                          onClick={() => setParticipantType("other")}
                          disabled={isSubmitting}
                          className={`p-3 text-sm border-2 rounded-lg font-medium transition-all ${
                            participantType === "other"
                              ? "bg-primary text-primary-foreground border-primary shadow-lg"
                              : "bg-background border-border hover:border-primary/50 hover:shadow-md"
                          }`}
                        >
                          Others
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {participantType === "student"
                          ? "For LPU Students, enter your Registration Number"
                          : participantType === "staff"
                          ? "For LPU Staff, enter your UID"
                          : "For others, identifier is optional"}
                      </p>
                    </div>

                    {/* Phone Number - FOURTH */}
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Phone Number</label>
                      <Input
                        type="tel"
                        value={phoneNumber}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-filled from your profile
                      </p>
                    </div>

                    {/* Time Slot Selection */}
                    <div>
                      <label className="text-sm font-semibold mb-3 block">
                        Select Time Slot (2 hours) <span className="text-red-500">*</span>
                      </label>
                      {timeSlots.length === 0 ? (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                          No time slots available for this event
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedTimeSlot(slot)}
                              disabled={isSubmitting}
                              className={`p-3 text-sm border-2 rounded-lg font-medium transition-all ${
                                selectedTimeSlot === slot
                                  ? "bg-primary text-primary-foreground border-primary shadow-lg"
                                  : "bg-background border-border hover:border-primary/50 hover:shadow-md"
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        isSubmitting ||
                        !participantType ||
                        !selectedTimeSlot ||
                        ((participantType === "student" || participantType === "staff") && !registrationNumber.trim())
                      }
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Registering...
                        </>
                      ) : (
                        "Complete Registration"
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div>
            <Card className="sticky top-20 bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Registration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <p className="text-muted-foreground">Registration Number</p>
                  <p className="font-semibold text-base">
                    {registrationNumber || "Not entered"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground">Participant Type</p>
                  <p className="font-semibold text-base">
                    {participantType ? (participantType === "student" ? "LPU Student" : participantType === "staff" ? "LPU Staff" : "Others") : "Not selected"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground">Your Name</p>
                  <p className="font-semibold text-base">{user?.name || "-"}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground">Phone Number</p>
                  <p className="font-semibold text-base">{phoneNumber || "-"}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground">Selected Time Slot</p>
                  <p className="font-semibold text-base">
                    {selectedTimeSlot || "Not selected"}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={isSuccess ? "default" : "outline"} className="mt-1">
                    {isSuccess ? "Registered" : "Pending"}
                  </Badge>
                </div>

                {isFull && (
                  <div className="border-t pt-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Event is full</AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground">
                    Available Slots: <span className="font-semibold text-primary">{Math.max(0, availableSlots)}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}