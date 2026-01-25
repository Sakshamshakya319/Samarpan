"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Edit,
  Search,
  Filter,
  X,
} from "lucide-react"
import { NGOEventCreationForm } from "./ngo-event-creation-form"
import { getEventTypeLabel } from "@/lib/constants/event-types"

interface NGOEvent {
  _id: string
  title: string
  description: string
  eventDate: string
  startTime?: string
  endTime?: string
  location: string
  expectedAttendees: number
  volunteerSlotsNeeded: number
  registeredVolunteers: number
  eventTypes: string[] // Changed from eventType to eventTypes array
  locationType: string
  participantCategories: string[]
  status: "pending_approval" | "active" | "rejected" | "completed" | "cancelled"
  allowRegistrations: boolean
  createdAt: string
  approvedAt?: string
  rejectionReason?: string
  ngoName: string
}

interface NGOEventsManagerProps {
  token: string
}

const STATUS_CONFIG = {
  pending_approval: {
    label: "Pending Approval",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: AlertCircle
  },
  active: {
    label: "Active",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle
  },
  completed: {
    label: "Completed",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle2
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: XCircle
  }
}

const PARTICIPANT_CATEGORY_LABELS: Record<string, string> = {
  students: "Students",
  faculty: "Faculty",
  staff: "Staff",
  children: "Children",
  men: "Men",
  women: "Women",
  elderly_men: "Elderly Men",
  elderly_women: "Elderly Women",
  patients: "Patients",
  visitors: "Visitors",
  employees: "Employees",
  management: "Management",
  general_public: "General Public",
  others: "Others"
}

export function NGOEventsManager({ token }: NGOEventsManagerProps) {
  const [events, setEvents] = useState<NGOEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<NGOEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [success, setSuccess] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [token])

  // Filter events based on search term, event types, and statuses
  useEffect(() => {
    let filtered = events

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by event types
    if (selectedEventTypes.length > 0) {
      filtered = filtered.filter(event => {
        // Check if any of the event's types match the selected types
        const eventTypes = Array.isArray(event.eventTypes) ? event.eventTypes : [event.eventTypes || 'donation_camp']
        return eventTypes.some(type => selectedEventTypes.includes(type))
      })
    }

    // Filter by statuses
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(event => selectedStatuses.includes(event.status))
    }

    setFilteredEvents(filtered)
  }, [events, searchTerm, selectedEventTypes, selectedStatuses])

  const eventTypeOptions = [
    { value: "donation_camp", label: "Blood Donation Camp" },
    { value: "platelet_drive", label: "Platelet Donation Drive" },
    { value: "awareness_seminar", label: "Awareness Seminar" },
    { value: "donor_appreciation", label: "Donor Appreciation Event" },
    { value: "emergency_camp", label: "Emergency Blood Camp" },
    { value: "health_checkup", label: "Health Checkup Camp" },
    { value: "community_outreach", label: "Community Outreach" }
  ]

  const statusOptions = [
    { value: "pending_approval", label: "Pending Approval" },
    { value: "active", label: "Active" },
    { value: "rejected", label: "Rejected" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" }
  ]

  const handleEventTypeToggle = (eventType: string) => {
    setSelectedEventTypes(prev => 
      prev.includes(eventType)
        ? prev.filter(type => type !== eventType)
        : [...prev, eventType]
    )
  }

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const clearAllFilters = () => {
    setSelectedEventTypes([])
    setSelectedStatuses([])
    setSearchTerm("")
  }

  const fetchEvents = async () => {
    if (!token) return
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/ngo/events", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to fetch events")
      }
    } catch (err) {
      setError("Error fetching events")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return ""
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getParticipantCategoryLabels = (categories: string[]) => {
    return categories.map(cat => PARTICIPANT_CATEGORY_LABELS[cat] || cat)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Events Management</h2>
          <p className="text-muted-foreground">
            Create and manage your blood donation events
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchEvents} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? "Cancel" : "Create Event"}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Create Event Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>
              Create a blood donation event with custom participant categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NGOEventCreationForm 
              token={token} 
              onEventCreated={() => {
                setShowCreateForm(false)
                fetchEvents()
                setSuccess("Event created successfully! It's now pending admin approval.")
              }} 
            />
          </CardContent>
        </Card>
      )}

      {/* Filters Section */}
      {events.length > 0 && (
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search events by title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Event Type Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by Event Type</span>
              </div>
              {(selectedEventTypes.length > 0 || searchTerm.trim()) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {eventTypeOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ngo-event-${option.value}`}
                    checked={selectedEventTypes.includes(option.value)}
                    onCheckedChange={() => handleEventTypeToggle(option.value)}
                  />
                  <label
                    htmlFor={`ngo-event-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>

            {/* Active Filters Display */}
            {selectedEventTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">Active filters:</span>
                {selectedEventTypes.map((type) => {
                  const option = eventTypeOptions.find(opt => opt.value === type)
                  return (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-red-100"
                      onClick={() => handleEventTypeToggle(type)}
                    >
                      {option?.label}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          {/* Results Summary */}
          {events.length > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {filteredEvents.length} of {events.length} events
              </span>
            </div>
          )}
        </div>
      )}

      {/* Events List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 mr-2" />
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No events found. Create your first event to get started!
            </p>
          </CardContent>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No events match your filters</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => {
            const statusConfig = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG]
            const StatusIcon = statusConfig?.icon || AlertCircle

            return (
              <Card key={event._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(event.eventDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.registeredVolunteers}/{event.volunteerSlotsNeeded} registered
                        </div>
                      </div>
                    </div>
                    <Badge className={statusConfig?.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig?.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Expected Attendees</p>
                        <p className="font-medium">{event.expectedAttendees}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Volunteer Slots</p>
                        <p className="font-medium">{event.volunteerSlotsNeeded}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time</p>
                        <p className="font-medium">
                          {event.startTime && event.endTime 
                            ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
                            : "Not specified"
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Event Types</p>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(event.eventTypes) ? event.eventTypes : [event.eventTypes || 'donation_camp']).map((type, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {getEventTypeLabel(type)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Participant Categories */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Participant Categories</p>
                      <div className="flex flex-wrap gap-1">
                        {getParticipantCategoryLabels(event.participantCategories).map((label, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    {event.status === "rejected" && event.rejectionReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{event.rejectionReason}</p>
                      </div>
                    )}

                    {/* Status Messages */}
                    {event.status === "pending_approval" && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          Your event is pending admin approval. You'll receive an email notification once it's reviewed.
                        </p>
                      </div>
                    )}

                    {event.status === "active" && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          Your event is live! Users can now register as volunteers.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}