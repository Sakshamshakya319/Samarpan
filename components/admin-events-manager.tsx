"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"

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
  eventType: string
  status: string
  createdAt: string
  allowRegistrations?: boolean
  ngoName?: string
  ngoLogo?: string
  ngoWebsite?: string
  organizedBy?: string
}

interface AdminEventsManagerProps {
  token: string
}

export function AdminEventsManager({ token }: AdminEventsManagerProps) {
  const [events, setEvents] = useState<Event[]>([])
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
    eventType: "donation_camp",
    allowRegistrations: true,
    ngoName: "",
    ngoLogo: "",
    ngoWebsite: "",
    organizedBy: "",
  })

  useEffect(() => {
    fetchEvents()
  }, [token])

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
      eventType: "donation_camp",
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
      eventDate: event.eventDate.split("T")[0],
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      expectedAttendees: event.expectedAttendees.toString(),
      volunteerSlotsNeeded: event.volunteerSlotsNeeded.toString(),
      eventType: event.eventType,
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
        eventType: formData.eventType,
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
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm mb-4">{success}</div>}

          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No events created yet. Create your first event!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event._id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-blue-100 text-blue-800 capitalize">{event.eventType}</Badge>
                      <Badge className={event.allowRegistrations === true ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {event.allowRegistrations === true ? "Registrations Open" : "Registration Closed"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 mb-4">
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

                  <div className="flex gap-2 justify-end flex-wrap">
                    {event.volunteerSlotsNeeded > 0 && (
                      <>
                        <AdminQRAttendanceScanner
                          eventId={event._id}
                          eventTitle={event.title}
                          token={token}
                        />
                        <Button
                          onClick={() => handleViewRegistrations(event._id)}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Users className="w-4 h-4" />
                          View Registrations
                        </Button>
                        <Button
                          onClick={() => handleDownloadRegistrations(event._id)}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Export Excel
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => handleEdit(event)}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      disabled={deletingId === event._id}
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(event._id)}
                      size="sm"
                      variant="destructive"
                      className="gap-2"
                      disabled={deletingId === event._id}
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingId === event._id ? "Deleting..." : "Delete"}
                    </Button>
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
                  <label className="text-sm font-medium">Event Type</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="donation_camp">Blood Donation Camp</option>
                    <option value="platelet_drive">Platelet Donation Drive</option>
                    <option value="awareness_seminar">Awareness Seminar</option>
                    <option value="donor_appreciation">Donor Appreciation Event</option>
                    <option value="emergency_camp">Emergency Blood Camp</option>
                  </select>
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
                <h3 className="text-sm font-semibold text-gray-700 mb-3">NGO Details (Optional)</h3>
                
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