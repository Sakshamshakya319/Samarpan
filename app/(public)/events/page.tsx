"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Calendar, MapPin, Users, Loader2 } from "lucide-react"

interface Event {
  _id: string
  title: string
  description: string
  eventDate: string
  startTime: string
  endTime: string
  location: string
  expectedAttendees: number
  eventType: string
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchEvents()
  }, [])

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
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Upcoming Events</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join us at our upcoming blood donation camps and community events.
          </p>
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
              {events.map((event) => (
                <Card key={event._id} className="p-8 hover:border-primary/50 transition">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold">{event.title}</h3>
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          {formatEventType(event.eventType)}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-4">{event.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar size={18} />
                          <span>
                            {new Date(event.eventDate).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          {event.startTime && <span className="ml-2 font-medium">{event.startTime}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin size={18} />
                          <span>{event.location}</span>
                        </div>
                        {event.expectedAttendees > 0 && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users size={18} />
                            <span>{event.expectedAttendees} expected attendees</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
