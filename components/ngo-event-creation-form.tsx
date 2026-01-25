"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Calendar, MapPin, Users, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"
import { EVENT_TYPES, getEventTypeLabels } from "@/lib/constants/event-types"

interface NGOEventCreationFormProps {
  token: string
  onEventCreated?: () => void
}

const LOCATION_TYPES = {
  school: {
    label: "School",
    categories: ["students", "staff", "others"],
    categoryLabels: {
      students: "Students",
      staff: "Staff",
      others: "Others"
    }
  },
  college: {
    label: "College/University", 
    categories: ["students", "faculty", "staff", "others"],
    categoryLabels: {
      students: "Students",
      faculty: "Faculty",
      staff: "Staff",
      others: "Others"
    }
  },
  society: {
    label: "Society/Community",
    categories: ["children", "men", "women", "elderly_men", "elderly_women", "others"],
    categoryLabels: {
      children: "Children",
      men: "Men",
      women: "Women", 
      elderly_men: "Elderly Men",
      elderly_women: "Elderly Women",
      others: "Others"
    }
  },
  hospital: {
    label: "Hospital/Medical Center",
    categories: ["patients", "staff", "visitors", "others"],
    categoryLabels: {
      patients: "Patients",
      staff: "Medical Staff",
      visitors: "Visitors",
      others: "Others"
    }
  },
  corporate: {
    label: "Corporate/Office",
    categories: ["employees", "management", "visitors", "others"],
    categoryLabels: {
      employees: "Employees",
      management: "Management",
      visitors: "Visitors",
      others: "Others"
    }
  },
  public: {
    label: "Public Space",
    categories: ["general_public", "others"],
    categoryLabels: {
      general_public: "General Public",
      others: "Others"
    }
  }
}

export function NGOEventCreationForm({ token, onEventCreated }: NGOEventCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [createdEventId, setCreatedEventId] = useState("")

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
    locationType: "",
    participantCategories: [] as string[]
  })

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Reset participant categories when location type changes
    if (field === "locationType") {
      setFormData(prev => ({
        ...prev,
        participantCategories: []
      }))
    }
  }

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      participantCategories: prev.participantCategories.includes(category)
        ? prev.participantCategories.filter(c => c !== category)
        : [...prev.participantCategories, category]
    }))
  }

  const validateForm = () => {
    if (!formData.title.trim()) return "Event title is required"
    if (!formData.description.trim()) return "Event description is required"
    if (!formData.eventDate) return "Event date is required"
    if (!formData.location.trim()) return "Event location is required"
    if (!formData.locationType) return "Location type is required"
    if (formData.participantCategories.length === 0) return "At least one participant category is required"
    if (formData.eventTypes.length === 0) return "At least one event type is required"
    
    // Check if event date is in the future
    const eventDate = new Date(formData.eventDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (eventDate < today) {
      return "Event date must be in the future"
    }
    
    return null
  }

  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/ngo/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          expectedAttendees: parseInt(formData.expectedAttendees) || 0,
          volunteerSlotsNeeded: parseInt(formData.volunteerSlotsNeeded) || 0
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedEventId(data.eventId)
        setSuccess(true)
        setShowDialog(false)
        
        // Reset form
        setFormData({
          title: "",
          description: "",
          eventDate: "",
          startTime: "",
          endTime: "",
          location: "",
          expectedAttendees: "",
          volunteerSlotsNeeded: "",
          eventTypes: ["donation_camp"],
          locationType: "",
          participantCategories: []
        })
        
        if (onEventCreated) {
          onEventCreated()
        }
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create event")
      }
    } catch (err) {
      setError("Error creating event")
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

  const selectedLocationConfig = formData.locationType ? LOCATION_TYPES[formData.locationType as keyof typeof LOCATION_TYPES] : null

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Create New Event
          </CardTitle>
          <CardDescription>
            Organize a blood donation camp that requires super admin approval before users can register
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-800">Event Submitted Successfully!</h3>
              </div>
              <p className="text-green-700 text-sm mb-3">
                Your event has been submitted for approval. You'll receive an email notification once it's reviewed by our super admin.
              </p>
              <div className="bg-green-100 p-3 rounded border border-green-300">
                <p className="text-green-800 text-sm">
                  <strong>Event ID:</strong> {createdEventId}<br />
                  <strong>Status:</strong> Pending Approval<br />
                  <strong>Next Step:</strong> Wait for admin approval email
                </p>
              </div>
            </div>
          )}

          <Button 
            onClick={() => setShowDialog(true)} 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Create New Event
          </Button>
        </CardContent>
      </Card>

      {/* Event Creation Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Create Blood Donation Event</AlertDialogTitle>
            <AlertDialogDescription>
              Fill in the details for your blood donation camp. This will be submitted for super admin approval.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Blood Donation Camp at ABC School"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Event Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose, goals, and details of your blood donation camp..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleInputChange("eventDate", e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange("startTime", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Event Location *</Label>
              <Input
                id="location"
                placeholder="e.g., ABC School Auditorium, 123 Main Street, City"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>

            {/* Location Type */}
            <div>
              <Label htmlFor="locationType">Location Type *</Label>
              <Select value={formData.locationType} onValueChange={(value) => handleInputChange("locationType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the type of location" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOCATION_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Participant Categories */}
            {selectedLocationConfig && (
              <div>
                <Label>Participant Categories *</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Select who can register for this event at a {selectedLocationConfig.label.toLowerCase()}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedLocationConfig.categories.map((category) => (
                    <div
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.participantCategories.includes(category)
                          ? "bg-blue-50 border-blue-300 text-blue-800"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {selectedLocationConfig.categoryLabels[category as keyof typeof selectedLocationConfig.categoryLabels]}
                        </span>
                        {formData.participantCategories.includes(category) && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {formData.participantCategories.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Selected categories:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.participantCategories.map((category) => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {selectedLocationConfig.categoryLabels[category as keyof typeof selectedLocationConfig.categoryLabels]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expectedAttendees">Expected Attendees</Label>
                <Input
                  id="expectedAttendees"
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.expectedAttendees}
                  onChange={(e) => handleInputChange("expectedAttendees", e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="volunteerSlotsNeeded">Volunteer Slots Needed</Label>
                <Input
                  id="volunteerSlotsNeeded"
                  type="number"
                  placeholder="e.g., 20"
                  value={formData.volunteerSlotsNeeded}
                  onChange={(e) => handleInputChange("volunteerSlotsNeeded", e.target.value)}
                  min="0"
                />
              </div>
            </div>

            {/* Event Types */}
            <div>
              <Label htmlFor="eventTypes">Event Types *</Label>
              <p className="text-sm text-gray-600 mb-2">
                Select one or more event types that best describe your event
              </p>
              <MultiSelect
                options={EVENT_TYPES}
                selected={formData.eventTypes}
                onChange={(selected) => handleInputChange("eventTypes", selected)}
                placeholder="Select event types..."
                className="w-full"
              />
              {formData.eventTypes.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Selected types:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getEventTypeLabels(formData.eventTypes).map((label, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            {formData.title && formData.eventDate && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Event Preview</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Title:</strong> {formData.title}</p>
                  <p><strong>Date:</strong> {formatDate(formData.eventDate)}</p>
                  {formData.startTime && formData.endTime && (
                    <p><strong>Time:</strong> {formData.startTime} - {formData.endTime}</p>
                  )}
                  <p><strong>Location:</strong> {formData.location || "Not specified"}</p>
                  {selectedLocationConfig && (
                    <p><strong>Location Type:</strong> {selectedLocationConfig.label}</p>
                  )}
                  {formData.participantCategories.length > 0 && (
                    <p><strong>Participants:</strong> {formData.participantCategories.length} categories selected</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title || !formData.eventDate || !formData.locationType || formData.participantCategories.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Submit for Approval
                </>
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}