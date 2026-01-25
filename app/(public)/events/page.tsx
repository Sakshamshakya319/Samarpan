"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Loader2, Building, CheckCircle, ExternalLink } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"
import { useRouter } from "next/navigation"

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

export default function Events() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [userRegistrations, setUserRegistrations] = useState<Record<string, { isRegistered: boolean, type?: 'donor' | 'volunteer' }>>({})
  const { token } = useAppSelector((state) => state.auth)
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  const router = useRouter()

  useEffect(() => {
    fetchEvents()
  }, [])

  // Check registration status for each event if user is authenticated
  useEffect(() => {
    if (isAuthenticated && token && events.length > 0) {
      checkUserRegistrations()
    }
  }, [isAuthenticated, token, events.length])

  const checkUserRegistrations = async () => {
    try {
      const registrations: Record<string, { isRegistered: boolean, type?: 'donor' | 'volunteer' }> = {}
      
      await Promise.all(events.map(async (event) => {
        try {
          // Check both donor and volunteer registrations in parallel
          const [donorRes, volunteerRes] = await Promise.all([
            fetch(`/api/event-registrations?eventId=${event._id}&checkUser=true`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`/api/volunteer-registrations?eventId=${event._id}&checkUser=true`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          ])

          let isRegistered = false
          let type: 'donor' | 'volunteer' | undefined

          if (donorRes.ok) {
            const data = await donorRes.json()
            if (data.isRegistered) {
              isRegistered = true
              type = 'donor'
            }
          }

          if (!isRegistered && volunteerRes.ok) {
            const data = await volunteerRes.json()
            if (data.isRegistered) {
              isRegistered = true
              type = 'volunteer'
            }
          }

          if (isRegistered) {
            registrations[event._id] = { isRegistered, type }
          }
        } catch (err) {
          console.error(`Error checking registration for event ${event._id}:`, err)
        }
      }))
      
      setUserRegistrations(registrations)
    } catch (err) {
      console.error("Error checking registration status:", err)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      } else {
        setError("Failed to load events")
      }
    } catch (err) {
      setError("Error loading events")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatEventType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6">Upcoming Events</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Join us at our upcoming blood donation camps and community events.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Events organized by verified NGOs and trusted partners</span>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading events...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md text-center">{error}</div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No upcoming events at this moment.</p>
              <p className="text-muted-foreground text-sm mt-2">Check back soon for new events!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((event) => {
                const availableSlots = event.volunteerSlotsNeeded - event.registeredVolunteers
                const isFull = availableSlots <= 0
                const registrationsOpen = event.allowRegistrations !== false
                const registrationInfo = userRegistrations[event._id]
                const isRegistered = registrationInfo?.isRegistered || false
                const registrationType = registrationInfo?.type
                const buttonDisabled = !registrationsOpen || isFull || isRegistered
                const buttonClass = isRegistered || !registrationsOpen ? "bg-gray-400" : isFull ? "" : "bg-green-600 hover:bg-green-700"
                const buttonLabel = isRegistered
                  ? (registrationType === 'volunteer' ? "Registered as Volunteer" : "Registered as Donor")
                  : !registrationsOpen
                    ? "Registrations Closed"
                    : isFull
                      ? "Event Full"
                      : "Register as Donor"
                
                // Check if this is an NGO event
                const isNGOEvent = event.ngoName && event.ngoName.trim() !== ""
                
                return (
                  <Card key={event._id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
                    <div className="p-6 sm:p-8">
                      {/* Event Header with NGO Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                            <h3 className="font-heading text-2xl font-bold text-gray-900">{event.title}</h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                {formatEventType(event.eventType)}
                              </Badge>
                              {isNGOEvent && (
                                <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">
                                  <CheckCircle className="w-3 h-3 mr-1" />
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
                                    <CheckCircle className="w-4 h-4 text-green-600" />
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
                          
                          <p className="text-gray-600 mb-4 leading-relaxed">{event.description}</p>
                        </div>

                        {/* Registration Status and Buttons */}
                        {event.volunteerSlotsNeeded > 0 && (
                          <div className="flex flex-col gap-3 sm:min-w-[200px]">
                            {/* Registration Status Indicators */}
                            <div className="space-y-2">
                              {!registrationsOpen && (
                                <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  Registrations Closed
                                </div>
                              )}
                              {registrationsOpen && isFull && (
                                <div className="flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  Event is Full
                                </div>
                              )}
                              {isRegistered && (
                                <div className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${registrationType === 'volunteer' ? "text-blue-700 bg-blue-50" : "text-green-600 bg-green-50"}`}>
                                  <CheckCircle className="w-4 h-4" />
                                  {registrationType === 'volunteer' ? "Registered as Volunteer" : "Registered as Donor"}
                                </div>
                              )}
                              {registrationsOpen && !isFull && !isRegistered && (
                                <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  Registration Open
                                </div>
                              )}
                            </div>
                            
                            {/* Registration Buttons */}
                            <div className="space-y-2">
                              <Button
                                onClick={() => {
                                  if (!registrationsOpen || isFull || isRegistered) {
                                    return
                                  }
                                  if (!isAuthenticated) {
                                    router.push("/login")
                                  } else {
                                    router.push(`/events/${event._id}/register`)
                                  }
                                }}
                                disabled={buttonDisabled}
                                size="lg"
                                className={`w-full ${buttonClass}`}
                              >
                                {buttonLabel}
                              </Button>
                              
                              {/* Volunteer Registration Button for NGO Events */}
                              {isNGOEvent && registrationsOpen && !isFull && !isRegistered && (
                                <Button
                                  onClick={() => {
                                    if (!isAuthenticated) {
                                      router.push("/login")
                                    } else {
                                      router.push(`/events/${event._id}/volunteer-register`)
                                    }
                                  }}
                                  variant="outline"
                                  size="lg"
                                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                  Register as Volunteer
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

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
                        
                        {event.volunteerSlotsNeeded > 0 && (
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
                        )}
                      </div>

                      {/* Trust Indicators for NGO Events */}
                      {isNGOEvent && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-green-800">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Verified NGO Event</span>
                          </div>
                          <p className="text-xs text-green-700 mt-1">
                            This event is organized by a verified NGO and has been approved by our admin team for quality and safety.
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
