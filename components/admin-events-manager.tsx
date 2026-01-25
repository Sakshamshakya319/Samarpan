"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { AdminEventRegistrationsViewer } from "@/components/admin-event-registrations-viewer"
import { AdminQRAttendanceScanner } from "@/components/admin-qr-attendance-scanner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Calendar,
  MapPin,
  Users,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Clock,
  Download,
  FileText,
  Search,
  Filter,
  X,
} from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"
import { EVENT_TYPES, getEventTypeLabels, getEventTypeLabel } from "@/lib/constants/event-types"

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
  eventTypes: string[] // Changed from eventType to eventTypes array
  status: string
  createdAt: string
  allowRegistrations?: boolean
  ngoName?: string
  ngoLogo?: string
  ngoWebsite?: string
  organizedBy?: string
  isNgoEvent?: boolean // Flag to identify NGO events
  eventSource?: "admin" | "ngo" // Source of the event
  canModify?: boolean // Whether current user can modify this event
  registeredVolunteers?: number
  registeredDonors?: number
}

interface AdminEventsManagerProps {
  token: string
}

export function AdminEventsManager({ token }: AdminEventsManagerProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showRegistrationsDialog, setShowRegistrationsDialog] = useState(false)
  const [registrationEventId, setRegistrationEventId] = useState<string | null>(null)
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showNgoEvents, setShowNgoEvents] = useState(true) // Toggle to show/hide NGO events
  const [eventSourceFilter, setEventSourceFilter] = useState<"all" | "admin" | "ngo">("all")

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    location: "",
    expectedAttendees: "",
    volunteerSlotsNeeded: "",
    eventTypes: ["donation_camp"] as string[], // Changed to array
    allowRegistrations: true,
    ngoName: "",
    ngoLogo: "",
    ngoWebsite: "",
    organizedBy: "",
  })

  useEffect(() => {
    fetchEvents()
  }, [token])

  // Filter events based on selected event types, search term, and event source
  useEffect(() => {
    let filtered = events

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.ngoName && event.ngoName.toLowerCase().includes(searchTerm.toLowerCase()))
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

    // Filter by event source
    if (eventSourceFilter !== "all") {
      filtered = filtered.filter(event => event.eventSource === eventSourceFilter)
    }

    setFilteredEvents(filtered)
  }, [events, selectedEventTypes, searchTerm, eventSourceFilter])

  const eventTypeOptions = EVENT_TYPES

  const handleEventTypeToggle = (eventType: string) => {
    setSelectedEventTypes(prev => 
      prev.includes(eventType)
        ? prev.filter(type => type !== eventType)
        : [...prev, eventType]
    )
  }

  const clearAllFilters = () => {
    setSelectedEventTypes([])
    setSearchTerm("")
    setEventSourceFilter("all")
  }

  const fetchEvents = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/events?status=active", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      } else {
        setError("Failed to fetch events")
      }
    } catch (err) {
      setError("Error fetching events")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      eventDate: "",
      startTime: "",
      endTime: "",
      location: "",
      expectedAttendees: "",
      volunteerSlotsNeeded: "",
      eventTypes: ["donation_camp"], // Changed to array
      allowRegistrations: true,
      ngoName: "",
      ngoLogo: "",
      ngoWebsite: "",
      organizedBy: "",
    })
    setIsEditing(false)
    setSelectedEvent(null)
  }

  const handleEdit = (event: Event) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      eventDate: event.eventDate ? event.eventDate.split("T")[0] : "",
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      expectedAttendees: event.expectedAttendees.toString(),
      volunteerSlotsNeeded: event.volunteerSlotsNeeded.toString(),
      eventTypes: Array.isArray(event.eventTypes) ? event.eventTypes : [event.eventTypes || 'donation_camp'], // Handle both old and new format
      allowRegistrations: event.allowRegistrations !== false,
      ngoName: event.ngoName || "",
      ngoLogo: event.ngoLogo || "",
      ngoWebsite: event.ngoWebsite || "",
      organizedBy: event.organizedBy || "",
    })
    setIsEditing(true)
    setShowDialog(true)
  }

  const handleNewEvent = () => {
    resetForm()
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.eventDate || !formData.location) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const method = isEditing ? "PUT" : "POST"
      const body: any = {
        title: formData.title,
        description: formData.description,
        eventDate: formData.eventDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        expectedAttendees: parseInt(formData.expectedAttendees) || 0,
        volunteerSlotsNeeded: parseInt(formData.volunteerSlotsNeeded) || 0,
        eventTypes: formData.eventTypes, // Changed from eventType
        allowRegistrations: formData.allowRegistrations,
        ngoName: formData.ngoName,
        ngoLogo: formData.ngoLogo,
        ngoWebsite: formData.ngoWebsite,
        organizedBy: formData.organizedBy,
      }

      if (isEditing && selectedEvent) {
        body.eventId = selectedEvent._id
      }

      const response = await fetch("/api/admin/events", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setSuccess(isEditing ? "Event updated successfully!" : "Event created successfully!")
        setShowDialog(false)
        await fetchEvents()
        resetForm()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to save event")
      }
    } catch (err) {
      setError("Error saving event")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    setDeletingId(eventId)
    try {
      const response = await fetch(`/api/admin/events?eventId=${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setSuccess("Event deleted successfully!")
        await fetchEvents()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError("Failed to delete event")
      }
    } catch (err) {
      setError("Error deleting event")
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownloadRegistrations = async (eventId: string) => {
    try {
      const response = await fetch(`/api/admin/event-registrations?eventId=${eventId}&format=excel`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `registrations-${eventId}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setSuccess("Registrations downloaded successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError("Failed to download registrations")
      }
    } catch (err) {
      setError("Error downloading registrations")
      console.error(err)
    }
  }

  const handleViewRegistrations = (eventId: string) => {
    setRegistrationEventId(eventId)
    setShowRegistrationsDialog(true)
  }

  const toggleRegistrationStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/events`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          allowRegistrations: !currentStatus
        }),
      })

      if (response.ok) {
        // Update the local state immediately for better UX
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event._id === eventId 
              ? { ...event, allowRegistrations: !currentStatus }
              : event
          )
        )
        setSuccess(`Registration ${!currentStatus ? 'enabled' : 'disabled'} successfully!`)
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update registration status')
      }
    } catch (err) {
      setError('Error updating registration status')
      console.error(err)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading events...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Manage Events
            </CardTitle>
            <CardDescription>Create and manage upcoming blood donation events</CardDescription>
          </div>
          <Button onClick={handleNewEvent} className="gap-2">
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters Section */}
          <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search events by title, description, location, or NGO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 sm:h-10"
              />
            </div>

            {/* Event Type Filters */}
            <div className="space-y-3">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter by Event Type</span>
                </div>
                {(selectedEventTypes.length > 0 || searchTerm.trim() || eventSourceFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs h-8 px-2 sm:h-9 sm:px-3 w-full xs:w-auto"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {eventTypeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50">
                    <Checkbox
                      id={option.value}
                      checked={selectedEventTypes.includes(option.value)}
                      onCheckedChange={() => handleEventTypeToggle(option.value)}
                    />
                    <label
                      htmlFor={option.value}
                      className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* Active Filters Display */}
              {selectedEventTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500">Active event type filters:</span>
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

            {/* Event Source Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by Event Source</span>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant={eventSourceFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEventSourceFilter("all")}
                  className="text-xs"
                >
                  All Events
                </Button>
                <Button
                  variant={eventSourceFilter === "admin" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEventSourceFilter("admin")}
                  className="text-xs"
                >
                  Admin Created
                </Button>
                <Button
                  variant={eventSourceFilter === "ngo" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEventSourceFilter("ngo")}
                  className="text-xs"
                >
                  NGO Created
                </Button>
              </div>

              {/* Event Source Filter Display */}
              {eventSourceFilter !== "all" && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500">Active source filter:</span>
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-red-100"
                    onClick={() => setEventSourceFilter("all")}
                  >
                    {eventSourceFilter === "admin" ? "Admin Created" : "NGO Created"}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm mb-4">{success}</div>}

          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {events.length === 0 ? (
                <>
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No events found</p>
                  <p className="text-sm">Create your first event to get started</p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No events match your filters</p>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  Showing {filteredEvents.length} of {events.length} events
                </p>
              </div>
              {filteredEvents.map((event) => (
                <div key={event._id} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition">
                  <div className="flex flex-col gap-3">
                    {/* Header Section */}
                    <div className="flex flex-col xs:flex-row xs:items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-1">
                          <h3 className="font-heading text-base sm:text-lg font-semibold text-gray-900 truncate">{event.title}</h3>
                          <div className="flex gap-1 flex-wrap">
                            {event.isNgoEvent && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                NGO Event
                              </Badge>
                            )}
                            {!event.isNgoEvent && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                Admin Event
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                        {event.ngoName && (
                          <p className="text-xs text-purple-600 mt-1 truncate">Organized by: {event.ngoName}</p>
                        )}
                      </div>
                      
                      {/* Registration Status */}
                      <div className="flex items-center gap-2 px-2 xs:px-3 py-1 rounded-full border bg-white flex-shrink-0">
                        <span className={`text-xs sm:text-sm font-medium ${event.allowRegistrations ? 'text-green-700' : 'text-gray-600'}`}>
                          {event.allowRegistrations ? "Open" : "Closed"}
                        </span>
                        <Switch
                          checked={event.allowRegistrations === true}
                          onCheckedChange={() => toggleRegistrationStatus(event._id, event.allowRegistrations === true)}
                          className="data-[state=checked]:bg-green-600 scale-75 xs:scale-100"
                        />
                      </div>
                    </div>

                    {/* Event Types */}
                    <div className="flex gap-1 flex-wrap">
                      {(Array.isArray(event.eventTypes) ? event.eventTypes : [event.eventTypes || 'donation_camp']).map((type, index) => (
                        <Badge key={index} className="bg-blue-100 text-blue-800 capitalize text-xs">
                          {getEventTypeLabel(type)}
                        </Badge>
                      ))}
                    </div>

                    {/* Event Details Grid */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 mt-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{new Date(event.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      {event.startTime && event.endTime && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{event.startTime} - {event.endTime}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Expected: {event.expectedAttendees || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.eventDate).toLocaleDateString()}
                      {event.startTime && <span className="ml-2">{event.startTime}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                    {event.expectedAttendees > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {event.expectedAttendees} expected attendees
                      </div>
                    )}
                    {event.endTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        Ends at {event.endTime}
                      </div>
                    )}
                  </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col xs:flex-row gap-2 xs:justify-end mt-3 pt-3 border-t border-gray-100">
                      {event.volunteerSlotsNeeded > 0 && (
                        <div className="flex flex-col xs:flex-row gap-2">
                          <AdminQRAttendanceScanner
                            eventId={event._id}
                            eventTitle={event.title}
                            token={token}
                          />
                          <Button
                            onClick={() => handleViewRegistrations(event._id)}
                            size="sm"
                            variant="outline"
                            className="gap-1 xs:gap-2 h-8 px-2 xs:h-9 xs:px-3 text-xs xs:text-sm"
                          >
                            <Users className="w-3 h-3 xs:w-4 xs:h-4" />
                            <span className="hidden xs:inline">View Registrations</span>
                            <span className="xs:hidden">Registrations</span>
                          </Button>
                          <Button
                            onClick={() => handleDownloadRegistrations(event._id)}
                            size="sm"
                            variant="outline"
                            className="gap-1 xs:gap-2 h-8 px-2 xs:h-9 xs:px-3 text-xs xs:text-sm"
                          >
                            <Download className="w-3 h-3 xs:w-4 xs:h-4" />
                            <span className="hidden xs:inline">Export Excel</span>
                            <span className="xs:hidden">Export</span>
                          </Button>
                        </div>
                      )}
                      {event.canModify && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(event)}
                            size="sm"
                            variant="outline"
                            className="gap-1 xs:gap-2 h-8 px-2 xs:h-9 xs:px-3 text-xs xs:text-sm flex-1 xs:flex-none"
                            disabled={deletingId === event._id}
                          >
                            <Edit2 className="w-3 h-3 xs:w-4 xs:h-4" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            onClick={() => handleDelete(event._id)}
                            size="sm"
                            variant="destructive"
                            className="gap-1 xs:gap-2 h-8 px-2 xs:h-9 xs:px-3 text-xs xs:text-sm flex-1 xs:flex-none"
                            disabled={deletingId === event._id}
                          >
                            <Trash2 className="w-3 h-3 xs:w-4 xs:h-4" />
                            <span>{deletingId === event._id ? "Deleting..." : "Delete"}</span>
                          </Button>
                        </div>
                    )}
                    {!event.canModify && event.isNgoEvent && (
                      <Badge variant="secondary" className="text-xs">
                        NGO Managed Event
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Event Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{isEditing ? "Edit Event" : "Create New Event"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isEditing ? "Update event details below" : "Fill in all event details to create a new event"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm font-medium">Event Title *</label>
                <Input
                  placeholder="e.g., Blood Donation Camp - Delhi"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description *</label>
                <textarea
                  placeholder="Describe the event details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Event Date *</label>
                  <Input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Event Types *</label>
                  <MultiSelect
                    options={EVENT_TYPES}
                    selected={formData.eventTypes}
                    onChange={(selected) => setFormData({ ...formData, eventTypes: selected })}
                    placeholder="Select event types..."
                    className="w-full"
                  />
                  {formData.eventTypes.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {getEventTypeLabels(formData.eventTypes).map((label, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Location *</label>
                <Input
                  placeholder="e.g., Delhi Medical Center, New Delhi"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Expected Attendees</label>
                <Input
                  type="number"
                  placeholder="e.g., 150"
                  value={formData.expectedAttendees}
                  onChange={(e) => setFormData({ ...formData, expectedAttendees: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Volunteer Slots Needed</label>
                <Input
                  type="number"
                  placeholder="e.g., 250"
                  value={formData.volunteerSlotsNeeded}
                  onChange={(e) => setFormData({ ...formData, volunteerSlotsNeeded: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowRegistrations"
                  checked={formData.allowRegistrations}
                  onChange={(e) => setFormData({ ...formData, allowRegistrations: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="allowRegistrations" className="text-sm font-medium cursor-pointer">
                  Enable Registrations for Users
                </label>
              </div>

              {/* NGO Details Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-heading text-sm font-semibold text-gray-700 mb-3">NGO Details (Optional)</h3>
                
                <div>
                  <label className="text-sm font-medium">NGO Name</label>
                  <Input
                    placeholder="e.g., Red Crescent Society"
                    value={formData.ngoName}
                    onChange={(e) => setFormData({ ...formData, ngoName: e.target.value })}
                  />
                </div>

                <div className="mt-3">
                  <label className="text-sm font-medium">NGO Logo URL</label>
                  <Input
                    placeholder="e.g., https://example.com/logo.png"
                    value={formData.ngoLogo}
                    onChange={(e) => setFormData({ ...formData, ngoLogo: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Provide a direct URL to the NGO logo image</p>
                </div>

                <div className="mt-3">
                  <label className="text-sm font-medium">NGO Website</label>
                  <Input
                    placeholder="e.g., https://www.ngodomain.com"
                    value={formData.ngoWebsite}
                    onChange={(e) => setFormData({ ...formData, ngoWebsite: e.target.value })}
                  />
                </div>

                <div className="mt-3">
                  <label className="text-sm font-medium">Organised By</label>
                  <textarea
                    placeholder="Describe who is organizing this event..."
                    value={formData.organizedBy}
                    onChange={(e) => setFormData({ ...formData, organizedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update Event" : "Create Event"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Event Registrations Viewer */}
      <AdminEventRegistrationsViewer
        eventId={registrationEventId}
        token={token}
        open={showRegistrationsDialog}
        onOpenChange={setShowRegistrationsDialog}
      />
    </>
  )
}