"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Loader2, Building, CheckCircle, ExternalLink } from "lucide-react"
import { useAppSelector } from "@/lib/store/hooks"
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
  const { token, isAuthenticated } = useAppSelector((state) => state.auth)
  const router = useRouter()

  useEffect(() => {
    fetchEvents()
  }, [])

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
    } finally {
      setIsLoading(false)
    }
  }

  const formatEventType = (type: string) => {
    if (!type || typeof type !== 'string') return 'Event';
    return type.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Upcoming Events</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
            Join us at our upcoming blood donation camps and community events. Step forward and make a tangible impact.
          </p>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 px-4 py-2 rounded-full border border-green-200">
            <CheckCircle className="w-4 h-4" />
            <span>Organized by verified NGOs and trusted partners</span>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <span className="text-slate-500 font-medium">Loading events...</span>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center font-medium">{error}</div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-900 font-semibold text-lg">No upcoming events right now.</p>
              <p className="text-slate-500 mt-2">Please check back soon for new opportunities to help.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {events.map((event) => {
                const availableSlots = event.volunteerSlotsNeeded - event.registeredVolunteers
                const isFull = availableSlots <= 0
                const registrationsOpen = event.allowRegistrations !== false
                const registrationInfo = userRegistrations[event._id]
                const isRegistered = registrationInfo?.isRegistered || false
                const registrationType = registrationInfo?.type
                const buttonDisabled = !registrationsOpen || isFull || isRegistered
                
                const buttonClass = isRegistered || !registrationsOpen 
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200" 
                  : isFull 
                    ? "bg-orange-100 text-orange-700 hover:bg-orange-100" 
                    : "bg-red-600 hover:bg-red-700 text-white"
                
                const buttonLabel = isRegistered
                  ? (registrationType === 'volunteer' ? "Registered as Volunteer" : "Registered as Donor")
                  : !registrationsOpen
                    ? "Registrations Closed"
                    : isFull
                      ? "Event Full"
                      : "Register as Donor"
                
                const isNGOEvent = event.ngoName && event.ngoName.trim() !== ""
                
                return (
                  <Card key={event._id} className="overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl">
                    <div className="p-6 sm:p-8">
                      {/* Event Header */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <h3 className="text-2xl font-bold text-slate-900">{event.title}</h3>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                                {formatEventType(event.eventType)}
                              </span>
                              {isNGOEvent && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Verified NGO
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* NGO Block */}
                          {isNGOEvent && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 flex items-start gap-4">
                              {event.ngoLogo ? (
                                <img
                                  src={event.ngoLogo}
                                  alt={event.ngoName}
                                  className="h-12 w-12 rounded-lg object-cover border border-slate-200 bg-white flex-shrink-0"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg border border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
                                  <Building className="w-6 h-6 text-slate-400" />
                                </div>
                              )}
                              <div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Organized By</div>
                                {event.ngoWebsite ? (
                                  <a
                                    href={event.ngoWebsite}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-slate-900 hover:text-red-600 transition-colors flex items-center gap-1.5"
                                  >
                                    {event.ngoName}
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <div className="font-bold text-slate-900">{event.ngoName}</div>
                                )}
                                {event.organizedBy && (
                                  <div className="text-sm text-slate-600 mt-0.5">{event.organizedBy}</div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{event.description}</p>
                        </div>

                        {/* Registration Block */}
                        {event.volunteerSlotsNeeded > 0 && (
                          <div className="flex flex-col gap-3 md:min-w-[220px] md:flex-shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {/* Status Indicators */}
                            <div className="space-y-2 mb-2">
                              {!registrationsOpen && (
                                <div className="text-xs font-bold text-red-600 uppercase tracking-wide flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> Closed
                                </div>
                              )}
                              {registrationsOpen && isFull && (
                                <div className="text-xs font-bold text-orange-600 uppercase tracking-wide flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-orange-600 rounded-full"></div> Event Full
                                </div>
                              )}
                              {isRegistered && (
                                <div className="text-xs font-bold text-green-700 uppercase tracking-wide flex items-center gap-2">
                                  <CheckCircle className="w-3.5 h-3.5" /> Registered
                                </div>
                              )}
                              {registrationsOpen && !isFull && !isRegistered && (
                                <div className="text-xs font-bold text-green-600 uppercase tracking-wide flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Open Now
                                </div>
                              )}
                            </div>
                            
                            <Button
                              onClick={() => {
                                if (!registrationsOpen || isFull || isRegistered) return
                                if (!isAuthenticated) router.push("/login")
                                else router.push(`/events/${event._id}/register`)
                              }}
                              disabled={buttonDisabled}
                              className={`w-full font-semibold ${buttonClass}`}
                            >
                              {buttonLabel}
                            </Button>
                            
                            {isNGOEvent && registrationsOpen && !isFull && !isRegistered && (
                              <Button
                                onClick={() => {
                                  if (!isAuthenticated) router.push("/login")
                                  else router.push(`/events/${event._id}/volunteer-register`)
                                }}
                                variant="outline"
                                className="w-full font-semibold border-slate-300 text-slate-700 hover:bg-slate-100"
                              >
                                Register as Volunteer
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            <Calendar className="w-4 h-4" /> Date & Time
                          </div>
                          <p className="font-semibold text-slate-900">
                            {new Date(event.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          {event.startTime && (
                            <p className="text-sm text-slate-600 font-medium">{event.startTime}</p>
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            <MapPin className="w-4 h-4" /> Location
                          </div>
                          <p className="font-semibold text-slate-900 text-sm leading-tight">{event.location}</p>
                        </div>
                        
                        {event.expectedAttendees > 0 && (
                          <div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              <Users className="w-4 h-4" /> Expected
                            </div>
                            <p className="font-semibold text-slate-900">{event.expectedAttendees} Attendees</p>
                          </div>
                        )}
                        
                        {event.volunteerSlotsNeeded > 0 && (
                          <div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              <Users className="w-4 h-4" /> Volunteers
                            </div>
                            <p className="font-semibold text-slate-900 mb-1.5">
                              {event.registeredVolunteers} / {event.volunteerSlotsNeeded} Filled
                            </p>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-slate-900 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min((event.registeredVolunteers / event.volunteerSlotsNeeded) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
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
