"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAppSelector } from "@/lib/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Calendar, MapPin, Users, Building, ExternalLink, Heart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { EventRegistrationStatus } from "@/components/event-registration-status"

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
  locationType?: string
  participantCategories?: string[]
}

export default function VolunteerRegistrationPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const { toast } = useToast()

  const [event, setEvent] = useState<Event | null>(null)
  const [isLoadingEvent, setIsLoadingEvent] = useState(true)
  const [eventError, setEventError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true)
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState({
    isDonorRegistered: false,
    isVolunteerRegistered: false
  })
  
  // Form fields
  const [motivation, setMotivation] = useState("")
  const [experience, setExperience] = useState("")
  const [availability, setAvailability] = useState("")
  const [skills, setSkills] = useState("")

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

  // Check if user is already registered as volunteer or donor
  useEffect(() => {
    if (!eventId || !token) {
      setIsCheckingRegistration(false)
      return
    }

    const checkRegistrationStatus = async () => {
      try {
        // Check both donor and volunteer registrations
        const [donorResponse, volunteerResponse] = await Promise.all([
          fetch(`/api/event-registrations?eventId=${eventId}&checkUser=true`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/volunteer-registrations?eventId=${eventId}&checkUser=true`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ])

        let isDonorRegistered = false
        let isVolunteerRegistered = false

        if (donorResponse.ok) {
          const donorData = await donorResponse.json()
          isDonorRegistered = donorData.isRegistered || false
        }

        if (volunteerResponse.ok) {
          const volunteerData = await volunteerResponse.json()
          isVolunteerRegistered = volunteerData.isRegistered || false
        }

        // Set registration status - user is registered if they're registered as either donor or volunteer
        setIsAlreadyRegistered(isDonorRegistered || isVolunteerRegistered)
        
        // Store the specific registration types for display
        setRegistrationStatus({
          isDonorRegistered,
          isVolunteerRegistered
        })

      } catch (err) {
        console.error("Error checking registration status:", err)
      } finally {
        setIsCheckingRegistration(false)
      }
    }

    checkRegistrationStatus()
  }, [eventId, token])

  const handleSubmit = async () => {
    if (!token) {
      setSubmitError("Please login to register as volunteer")
      return
    }

    if (!motivation.trim()) {
      setSubmitError("Please provide your motivation for volunteering")
      return
    }

    if (!availability.trim()) {
      setSubmitError("Please specify your availability")
      return
    }

    if (!user?.name) {
      setSubmitError("User name not found. Please update your profile.")
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      const response = await fetch("/api/volunteer-registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          motivation: motivation.trim(),
          experience: experience.trim(),
          availability: availability.trim(),
          skills: skills.trim(),
          name: user.name,
          email: user.email,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsSuccess(true)
        toast({
          title: "Volunteer Registration Successful!",
          description: `You have been registered as a volunteer for ${event?.title}`,
          variant: "default",
        })
        
        // Redirect back to events after success
        setTimeout(() => {
          router.push("/events")
        }, 2000)
      } else {
        const data = await response.json()
        setSubmitError(data.error || "Failed to register as volunteer")
      }
    } catch (err) {
      setSubmitError("Error registering as volunteer")
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
    if (!type || typeof type !== 'string') {
      return 'Event';
    }
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const isNGOEvent = event?.ngoName && event.ngoName.trim() !== ""

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push("/events")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        <div className="space-y-6">
          {/* Event Details Card */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <h1 className="font-heading text-3xl font-bold">{event.title}</h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{formatEventType(event.eventType)}</Badge>
                      {isNGOEvent && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified NGO
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* NGO Information */}
                  {isNGOEvent && (
                    <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-blue-700" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-blue-900">Volunteer for</span>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex items-center gap-2">
                            {event.ngoWebsite ? (
                              <a
                                href={event.ngoWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-blue-800 hover:text-blue-900 hover:underline flex items-center gap-1"
                              >
                                {event.ngoName}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="font-semibold text-blue-800">{event.ngoName}</span>
                            )}
                          </div>
                        </div>
                        {event.ngoLogo && (
                          <div className="flex-shrink-0">
                            <img
                              src={event.ngoLogo}
                              alt={event.ngoName}
                              className="h-12 w-12 rounded-lg object-cover border border-blue-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-lg text-muted-foreground">{event.description}</p>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white/70 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(event.eventDate)}
                    </p>
                    {event.startTime && (
                      <p className="text-sm text-gray-600">{event.startTime}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                    <p className="font-medium text-gray-900 text-sm">{event.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Expected</p>
                    <p className="font-medium text-gray-900">{event.expectedAttendees} attendees</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Status Messages */}
          <EventRegistrationStatus 
            isAlreadyRegistered={isAlreadyRegistered}
            registrationStatus={registrationStatus}
          />

          {/* Success Message */}
          {isSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Volunteer registration successful! You will be redirected shortly...
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

          {/* Volunteer Registration Form */}
          {!isAlreadyRegistered && !isSuccess && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Volunteer Registration
                </CardTitle>
                <CardDescription>
                  Join us as a volunteer and make a difference in your community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Email Address</label>
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-filled from your profile
                    </p>
                  </div>
                </div>

                {/* Motivation */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Why do you want to volunteer for this event? <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Share your motivation and what drives you to volunteer..."
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Experience */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Previous Volunteering Experience
                  </label>
                  <Textarea
                    placeholder="Describe any previous volunteering experience (optional)..."
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Availability */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Your Availability <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Please specify your availability for this event (time slots, duration, etc.)..."
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    disabled={isSubmitting}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                {/* Skills */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Relevant Skills or Interests
                  </label>
                  <Textarea
                    placeholder="Any skills, interests, or areas where you'd like to help (optional)..."
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    disabled={isSubmitting}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !motivation.trim() || !availability.trim()}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Registering as Volunteer...
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      Register as Volunteer
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}