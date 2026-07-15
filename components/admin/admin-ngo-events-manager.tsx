"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
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
  Building,
  Mail,
  Phone,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  ExternalLink,
  FileText,
  X,
} from "lucide-react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  ngoEmail?: string
  ngoPhone?: string
  canModify?: boolean
  registrationUpdatedAt?: string
  registrationUpdatedBy?: string
}

interface AdminNGOEventsManagerProps {
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

const LOCATION_TYPE_LABELS: Record<string, string> = {
  school: "School",
  college: "College/University",
  society: "Society/Community",
  hospital: "Hospital/Medical Center",
  corporate: "Corporate/Office",
  public: "Public Space"
}

const PARTICIPANT_CATEGORY_LABELS: Record<string, Record<string, string>> = {
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

export function AdminNGOEventsManager({ token }: AdminNGOEventsManagerProps) {
  const [events, setEvents] = useState<NGOEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<NGOEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<NGOEvent | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all") // Changed default to "all" to show all events
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "name" | "created">("created")
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [userRole, setUserRole] = useState<string>("")
  const [isControllingRegistration, setIsControllingRegistration] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [token, statusFilter])

  useEffect(() => {
    // Filter and sort events based on search term, event types, and sort criteria
    let filtered = events.filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.ngoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Filter by event types
    if (selectedEventTypes.length > 0) {
      filtered = filtered.filter(event => {
        // Check if any of the event's types match the selected types
        const eventTypes = Array.isArray(event.eventTypes) ? event.eventTypes : [event.eventTypes || 'donation_camp']
        return eventTypes.some(type => selectedEventTypes.includes(type))
      })
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        case "name":
          return a.title.localeCompare(b.title)
        case "created":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    setFilteredEvents(filtered)
  }, [events, searchTerm, sortBy, selectedEventTypes])

  const fetchEvents = async () => {
    if (!token) return
    setIsLoading(true)
    setError("")
    
    try {
      console.log(`Fetching NGO events with status: ${statusFilter}`)
      // If statusFilter is "all", don't pass status parameter to get all events
      const statusParam = statusFilter === "all" ? "" : `?status=${statusFilter}`
      const response = await fetch(`/api/admin/ngo-events${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`Fetched ${data.events?.length || 0} events`)
        setEvents(data.events || [])
        setUserRole(data.userRole || "")
      } else {
        const errorData = await response.json()
        console.error("Failed to fetch events:", errorData)
        setError(errorData.error || "Failed to fetch NGO events")
      }
    } catch (err) {
      console.error("Error fetching NGO events:", err)
      setError("Error fetching NGO events")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedEvent) return
    
    setIsSubmitting(true)
    setError("")
    
    try {
      const response = await fetch("/api/admin/ngo-events", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: selectedEvent._id,
          action: "approve"
        }),
      })

      if (response.ok) {
        setSuccess("Event approved successfully!")
        setShowApprovalDialog(false)
        setSelectedEvent(null)
        await fetchEvents()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to approve event")
      }
    } catch (err) {
      setError("Error approving event")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedEvent || !rejectionReason.trim()) {
      setError("Please provide a rejection reason")
      return
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      const response = await fetch("/api/admin/ngo-events", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: selectedEvent._id,
          action: "reject",
          rejectionReason: rejectionReason.trim()
        }),
      })

      if (response.ok) {
        setSuccess("Event rejected successfully!")
        setShowRejectionDialog(false)
        setSelectedEvent(null)
        setRejectionReason("")
        await fetchEvents()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to reject event")
      }
    } catch (err) {
      setError("Error rejecting event")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegistrationControl = async (eventId: string, action: 'enable_registration' | 'disable_registration') => {
    setIsControllingRegistration(eventId)
    setError("")
    
    try {
      const response = await fetch("/api/admin/ngo-events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          action
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(data.message)
        
        // Update the event in the local state
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event._id === eventId 
              ? { ...event, allowRegistrations: data.allowRegistrations }
              : event
          )
        )
      } else {
        const data = await response.json()
        setError(data.error || "Failed to control registration")
      }
    } catch (err) {
      setError("Error controlling registration")
      console.error(err)
    } finally {
      setIsControllingRegistration(null)
    }
  }

  const toggleRegistrationStatus = async (eventId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'disable_registration' : 'enable_registration'
    await handleRegistrationControl(eventId, action)
  }

  const eventTypeOptions = [
    { value: "donation_camp", label: "Blood Donation Camp" },
    { value: "platelet_drive", label: "Platelet Donation Drive" },
    { value: "awareness_seminar", label: "Awareness Seminar" },
    { value: "donor_appreciation", label: "Donor Appreciation Event" },
    { value: "emergency_camp", label: "Emergency Blood Camp" },
    { value: "health_checkup", label: "Health Checkup Camp" },
    { value: "community_outreach", label: "Community Outreach" }
  ]

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

  const getParticipantCategoryLabels = (locationType: string, categories: string[]) => {
    const labels = PARTICIPANT_CATEGORY_LABELS[locationType] || {}
    return categories.map(cat => labels[cat] || cat)
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">NGO Events Management</h2>
          <p className="text-gray-600 mt-1">
            Review and approve events created by NGOs
          </p>
        </div>
        <Button onClick={fetchEvents} variant="outline" size="sm" className="w-fit">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters and Search Section */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search events, NGOs, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full lg:w-auto">
                <Filter className="w-4 h-4 mr-2" />
                Sort by: {sortBy === "date" ? "Event Date" : sortBy === "name" ? "Event Name" : "Created Date"}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("created")}>
                Created Date (Newest)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("date")}>
                Event Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                Event Name (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {/* All Events Button */}
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            All Events
            {events.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {events.length}
              </Badge>
            )}
          </Button>
          
          {/* Status-specific buttons */}
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="flex items-center gap-2"
            >
              <config.icon className="w-4 h-4" />
              {config.label}
              {events.filter(e => e.status === status).length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {events.filter(e => e.status === status).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Role-based Information */}
      {userRole && userRole !== "superadmin" && statusFilter === "pending_approval" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <p className="text-blue-800 font-medium">Information</p>
          </div>
          <p className="text-blue-700 mt-1 text-sm">
            You can view NGO events but only Super Admins can approve or reject them. 
            You can control registrations for active events.
          </p>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">Error</p>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Success</p>
          </div>
          <p className="text-green-700 mt-1">{success}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search events by title, NGO name, or location..."
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
                  id={`ngo-${option.value}`}
                  checked={selectedEventTypes.includes(option.value)}
                  onCheckedChange={() => handleEventTypeToggle(option.value)}
                />
                <label
                  htmlFor={`ngo-${option.value}`}
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
            <div className="flex items-center gap-2">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "name" | "created")}
                className="border border-gray-300 rounded px-2 py-1 text-xs"
              >
                <option value="created">Created Date</option>
                <option value="date">Event Date</option>
                <option value="name">Event Name</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading NGO events...</p>
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `No events match your search "${searchTerm}"`
                : `No ${statusFilter.replace('_', ' ')} events found`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredEvents.map((event) => {
            const statusConfig = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG]
            const StatusIcon = statusConfig?.icon || AlertCircle

            return (
              <Card key={event._id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                <CardHeader className="pb-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <CardTitle className="text-xl text-gray-900">{event.title}</CardTitle>
                        <Badge className={`${statusConfig?.color} w-fit`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig?.label}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          <span className="font-medium">{event.ngoName}</span>
                        </div>
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

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => {
                          setSelectedEvent(event)
                          setShowDetailsDialog(true)
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      
                      {/* Registration Control Buttons for Active Events */}
                      {event.status === "active" && (
                        <div className="flex gap-2">
                          {event.allowRegistrations ? (
                            <Button
                              onClick={() => handleRegistrationControl(event._id, 'disable_registration')}
                              disabled={isControllingRegistration === event._id}
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50"
                            >
                              {isControllingRegistration === event._id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              Stop Registration
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleRegistrationControl(event._id, 'enable_registration')}
                              disabled={isControllingRegistration === event._id}
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto border-green-300 text-green-700 hover:bg-green-50"
                            >
                              {isControllingRegistration === event._id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                              )}
                              Start Registration
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {/* Approval Buttons for Pending Events (Super Admin Only) */}
                      {event.status === "pending_approval" && userRole === "superadmin" && (
                        <>
                          <Button
                            onClick={() => {
                              setSelectedEvent(event)
                              setShowApprovalDialog(true)
                            }}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedEvent(event)
                              setShowRejectionDialog(true)
                            }}
                            size="sm"
                            variant="destructive"
                            className="w-full sm:w-auto"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <p className="text-gray-700 line-clamp-2">
                      {event.description}
                    </p>

                    {/* Event Details Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Event Types</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(Array.isArray(event.eventTypes) ? event.eventTypes : [event.eventTypes || 'donation_camp']).map((type, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {getEventTypeLabel(type)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Location Type</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {LOCATION_TYPE_LABELS[event.locationType] || event.locationType}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Expected Attendees</p>
                        <p className="font-medium text-gray-900 mt-1">{event.expectedAttendees}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Volunteer Slots</p>
                        <p className="font-medium text-gray-900 mt-1">{event.volunteerSlotsNeeded}</p>
                      </div>
                    </div>

                    {/* Time Information */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Event Time</p>
                      <p className="font-medium text-gray-900">
                        {event.startTime && event.endTime 
                          ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
                          : "Not specified"
                        }
                      </p>
                    </div>

                    {/* Registration Status for Active Events */}
                    {event.status === "active" && (
                      <div className={`p-4 rounded-lg border-2 ${
                        event.allowRegistrations 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {event.allowRegistrations ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              <span className={`font-medium ${event.allowRegistrations ? 'text-green-800' : 'text-red-800'}`}>
                                Registration {event.allowRegistrations ? 'Open' : 'Closed'}
                              </span>
                            </div>
                            <Switch
                              checked={event.allowRegistrations === true}
                              onCheckedChange={() => toggleRegistrationStatus(event._id, event.allowRegistrations === true)}
                              disabled={isControllingRegistration === event._id}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>
                          <div className="text-sm text-gray-600">
                            {event.registeredVolunteers}/{event.volunteerSlotsNeeded} registered
                          </div>
                        </div>
                        {event.registrationUpdatedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Last updated: {new Date(event.registrationUpdatedAt).toLocaleString()}
                            {event.registrationUpdatedBy && ` by ${event.registrationUpdatedBy}`}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Participant Categories */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Participant Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {getParticipantCategoryLabels(event.locationType, event.participantCategories).map((label, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* NGO Contact Info */}
                    {(event.ngoEmail || event.ngoPhone) && (
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                        {event.ngoEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${event.ngoEmail}`} className="hover:text-blue-600">
                              {event.ngoEmail}
                            </a>
                          </div>
                        )}
                        {event.ngoPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${event.ngoPhone}`} className="hover:text-blue-600">
                              {event.ngoPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {event.status === "rejected" && event.rejectionReason && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-2">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{event.rejectionReason}</p>
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="text-xs text-gray-500">
                      Created: {new Date(event.createdAt).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Event Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold">Event Details</DialogTitle>
            <DialogDescription className="text-base">
              Complete information about the NGO event
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-8">
              {/* Event Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{selectedEvent.title}</h3>
                    <p className="text-lg text-gray-600 mb-3">Organized by <span className="font-semibold text-purple-700">{selectedEvent.ngoName}</span></p>
                    
                    {/* Event Types */}
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(selectedEvent.eventTypes) ? selectedEvent.eventTypes : [selectedEvent.eventTypes || 'donation_camp']).map((type, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
                          {getEventTypeLabel(type)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <Badge className={`${STATUS_CONFIG[selectedEvent.status as keyof typeof STATUS_CONFIG]?.color} text-lg px-4 py-2`}>
                      {STATUS_CONFIG[selectedEvent.status as keyof typeof STATUS_CONFIG]?.label}
                    </Badge>
                    {selectedEvent.allowRegistrations !== undefined && (
                      <Badge variant={selectedEvent.allowRegistrations ? "default" : "secondary"} className="text-sm">
                        Registration {selectedEvent.allowRegistrations ? "Open" : "Closed"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left Column - Event Details */}
                <div className="xl:col-span-2 space-y-6">
                  
                  {/* Event Information */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Event Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Date</p>
                            <p className="text-lg font-semibold text-gray-900">{formatDate(selectedEvent.eventDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Time</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {selectedEvent.startTime && selectedEvent.endTime 
                                ? `${formatTime(selectedEvent.startTime)} - ${formatTime(selectedEvent.endTime)}`
                                : "Time not specified"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Location</p>
                            <p className="text-lg font-semibold text-gray-900">{selectedEvent.location}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Building className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Location Type</p>
                            <p className="text-lg font-semibold text-gray-900">{LOCATION_TYPE_LABELS[selectedEvent.locationType] || selectedEvent.locationType}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Description
                    </h4>
                    <p className="text-gray-700 leading-relaxed text-lg">{selectedEvent.description}</p>
                  </div>

                  {/* Participant Categories */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Participant Categories
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {getParticipantCategoryLabels(selectedEvent.locationType, selectedEvent.participantCategories).map((label, index) => (
                        <Badge key={index} variant="outline" className="text-sm px-3 py-2 border-2">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {selectedEvent.status === "rejected" && selectedEvent.rejectionReason && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                      <h4 className="text-xl font-semibold text-red-800 mb-4 flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        Rejection Reason
                      </h4>
                      <p className="text-red-700 text-lg leading-relaxed">{selectedEvent.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Stats & NGO Info */}
                <div className="space-y-6">
                  
                  {/* Capacity Stats */}
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 border rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      Capacity & Registration
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                        <span className="text-gray-600 font-medium">Expected Attendees</span>
                        <span className="text-2xl font-bold text-gray-900">{selectedEvent.expectedAttendees}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                        <span className="text-gray-600 font-medium">Volunteer Slots</span>
                        <span className="text-2xl font-bold text-blue-600">{selectedEvent.volunteerSlotsNeeded}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                        <span className="text-gray-600 font-medium">Registered</span>
                        <span className="text-2xl font-bold text-green-600">{selectedEvent.registeredVolunteers}</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Registration Progress</span>
                          <span>{Math.round((selectedEvent.registeredVolunteers / selectedEvent.volunteerSlotsNeeded) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((selectedEvent.registeredVolunteers / selectedEvent.volunteerSlotsNeeded) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NGO Information */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5 text-purple-600" />
                      NGO Information
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Organization</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedEvent.ngoName}</p>
                      </div>
                      {selectedEvent.ngoEmail && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                          <a href={`mailto:${selectedEvent.ngoEmail}`} className="text-lg font-medium text-blue-600 hover:underline flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {selectedEvent.ngoEmail}
                          </a>
                        </div>
                      )}
                      {selectedEvent.ngoPhone && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                          <a href={`tel:${selectedEvent.ngoPhone}`} className="text-lg font-medium text-blue-600 hover:underline flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {selectedEvent.ngoPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="bg-gray-50 border rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      Timestamps
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Created</p>
                        <p className="text-base font-medium text-gray-900">{new Date(selectedEvent.createdAt).toLocaleString()}</p>
                      </div>
                      {selectedEvent.approvedAt && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Approved</p>
                          <p className="text-base font-medium text-gray-900">{new Date(selectedEvent.approvedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedEvent.status === "pending_approval" && userRole === "superadmin" && (
                <div className="bg-gray-50 border rounded-lg p-6">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Actions</h4>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => {
                        setShowDetailsDialog(false)
                        setShowApprovalDialog(true)
                      }}
                      className="bg-green-600 hover:bg-green-700 flex-1 py-3 text-lg"
                      size="lg"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Approve Event
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDetailsDialog(false)
                        setShowRejectionDialog(true)
                      }}
                      variant="destructive"
                      className="flex-1 py-3 text-lg"
                      size="lg"
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      Reject Event
                    </Button>
                  </div>
                </div>
              )}

              {/* Registration Control for Active Events */}
              {selectedEvent.status === "active" && (
                <div className="bg-gray-50 border rounded-lg p-6">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Registration Control
                  </h4>
                  <div className={`p-6 rounded-lg border-2 ${
                    selectedEvent.allowRegistrations 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          {selectedEvent.allowRegistrations ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                          <span className={`text-lg font-semibold ${selectedEvent.allowRegistrations ? 'text-green-800' : 'text-red-800'}`}>
                            Registration {selectedEvent.allowRegistrations ? 'Open' : 'Closed'}
                          </span>
                        </div>
                        <Switch
                          checked={selectedEvent.allowRegistrations === true}
                          onCheckedChange={() => toggleRegistrationStatus(selectedEvent._id, selectedEvent.allowRegistrations === true)}
                          disabled={isControllingRegistration === selectedEvent._id}
                          className="data-[state=checked]:bg-green-600 scale-125"
                        />
                      </div>
                      <div className="text-lg font-medium text-gray-700 bg-white px-4 py-2 rounded-lg border">
                        {selectedEvent.registeredVolunteers}/{selectedEvent.volunteerSlotsNeeded} registered
                      </div>
                    </div>

                    {selectedEvent.registrationUpdatedAt && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <strong>Last updated:</strong> {new Date(selectedEvent.registrationUpdatedAt).toLocaleString()}
                          {selectedEvent.registrationUpdatedBy && ` by ${selectedEvent.registrationUpdatedBy}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Approve Event
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Are you sure you want to approve <strong>"{selectedEvent?.title}"</strong>?
              <br /><br />
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Make the event active and visible to users</li>
                <li>Allow users to register as volunteers</li>
                <li>Send a confirmation email to the NGO</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve Event
                </>
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection Dialog */}
      <AlertDialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Event
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Please provide a detailed reason for rejecting <strong>"{selectedEvent?.title}"</strong>. 
              The NGO will receive this feedback via email to help them improve future submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter detailed rejection reason (required)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <AlertDialogCancel onClick={() => setRejectionReason("")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Event
                  </>
                )}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}