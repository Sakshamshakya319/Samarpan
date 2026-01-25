"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAppSelector } from "@/lib/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Calendar, MapPin, Users, Clock, Building, ExternalLink } from "lucide-react"
import { EventRegistrationForm } from "@/components/event-registration-form"
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

export default function EventRegistrationPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [isLoadingEvent, setIsLoadingEvent] = useState(true)
  const [eventError, setEventError] = useState("")
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true)
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState({
    isDonorRegistered: false,
    isVolunteerRegistered: false
  })

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

  // Check if user is already registered for this event (as donor or volunteer)
  useEffect(() => {
    if (!eventId || !token) {
      setIsCheckingRegistration(false)
      return
    }

    const checkUserRegistration = async () => {
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

    checkUserRegistration()
  }, [eventId, token])

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

  const availableSlots = event ? event.volunteerSlotsNeeded - event.registeredVolunteers : 0
  const isFull = availableSlots <= 0
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
          <Card className="border-2 border-primary/20">
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
                  
                  {/* NGO Information - Prominent Display */}
                  {isNGOEvent && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-blue-900">Organized by</span>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex items-center gap-2">
                            {event.ngoWebsite ? (
                              <a
                                href={event.ngoWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1"
                              >
                                {event.ngoName}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="font-semibold text-blue-700">{event.ngoName}</span>
                            )}
                          </div>
                          {event.organizedBy && (
                            <p className="text-sm text-blue-600 mt-1">{event.organizedBy}</p>
                          )}
                        </div>
                        {event.ngoLogo && (
                          <div className="flex-shrink-0">
                            <img
                              src={event.ngoLogo}
                              alt={event.ngoName}
                              className="h-12 w-12 rounded-lg object-cover border border-blue-200"
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
            
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground">{event.description}</p>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(event.eventDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {event.startTime && (
                      <p className="text-sm text-gray-600">{event.startTime}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                    <p className="font-medium text-gray-900 text-sm">{event.location}</p>
                  </div>
                </div>
                
                {event.expectedAttendees > 0 && (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Expected</p>
                      <p className="font-medium text-gray-900">{event.expectedAttendees} attendees</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Volunteers</p>
                    <p className="font-medium text-gray-900">
                      {event.registeredVolunteers} / {event.volunteerSlotsNeeded}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.min((event.registeredVolunteers / event.volunteerSlotsNeeded) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Indicators for NGO Events */}
              {isNGOEvent && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Verified NGO Event</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    This event is organized by a verified NGO and has been approved by our admin team for quality and safety.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Status Messages */}
          <EventRegistrationStatus 
            isAlreadyRegistered={isAlreadyRegistered}
            registrationStatus={registrationStatus}
          />

          {isFull && !isAlreadyRegistered && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                All volunteer slots for this event are filled. Please check back later for other events.
              </AlertDescription>
            </Alert>
          )}

          {/* Registration Form */}
          {!isAlreadyRegistered && !isFull && (
            <EventRegistrationForm
              eventId={eventId}
              eventTitle={event.title}
              eventDate={event.eventDate}
              volunteerSlotsNeeded={event.volunteerSlotsNeeded}
              registeredVolunteers={event.registeredVolunteers}
              token={token}
              isAlreadyRegistered={isAlreadyRegistered}
              registrationStatus={registrationStatus}
            />
          )}
        </div>
      </div>
    </main>
  )
}