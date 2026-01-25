"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Calendar, 
  MapPin, 
  Users, 
  Mail,
  Phone,
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Award,
  Download,
  Send,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  Heart,
  FileText
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
import { useToast } from "@/components/ui/use-toast"

interface VolunteerRegistration {
  _id: string
  eventId: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  userName: string
  userEmail: string
  userPhone: string
  motivation: string
  experience: string
  availability: string
  skills: string
  status: string
  registeredAt: string
  certificateIssued: boolean
  certificateId?: string
}

interface Event {
  _id: string
  title: string
  eventDate: string
  location: string
  volunteerSlotsNeeded: number
  registeredVolunteers: number
  status: string
}

interface NGOVolunteerManagerProps {
  token: string
}

export function NGOVolunteerManager({ token }: NGOVolunteerManagerProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [volunteers, setVolunteers] = useState<VolunteerRegistration[]>([])
  const [donors, setDonors] = useState<any[]>([])
  const [filteredVolunteers, setFilteredVolunteers] = useState<VolunteerRegistration[]>([])
  const [filteredDonors, setFilteredDonors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerRegistration | null>(null)
  const [showVolunteerDialog, setShowVolunteerDialog] = useState(false)
  const [showCertificateDialog, setShowCertificateDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isGeneratingCertificates, setIsGeneratingCertificates] = useState(false)
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([])
  const [ngoSignature, setNgoSignature] = useState("")
  const [authorizedPerson, setAuthorizedPerson] = useState("")
  const [participantType, setParticipantType] = useState<"volunteers" | "donors">("volunteers")
  
  const { toast } = useToast()

  useEffect(() => {
    fetchEvents()
  }, [token])

  useEffect(() => {
    if (selectedEvent) {
      fetchParticipants()
    }
  }, [selectedEvent, token])

  useEffect(() => {
    // Filter participants based on search term and status
    const term = searchTerm.toLowerCase()
    
    if (participantType === "volunteers") {
      let filtered = volunteers.filter(volunteer => 
        (volunteer.userName?.toLowerCase() || "").includes(term) ||
        (volunteer.userEmail?.toLowerCase() || "").includes(term) ||
        (volunteer.eventTitle?.toLowerCase() || "").includes(term)
      )

      if (statusFilter !== "all") {
        if (statusFilter === "certified") {
          filtered = filtered.filter(v => v.certificateIssued)
        } else if (statusFilter === "pending_certificate") {
          filtered = filtered.filter(v => !v.certificateIssued)
        } else {
          filtered = filtered.filter(v => v.status === statusFilter)
        }
      }
      setFilteredVolunteers(filtered)
    } else {
      let filtered = donors.filter(donor => 
        (donor.userName?.toLowerCase() || "").includes(term) ||
        (donor.userEmail?.toLowerCase() || "").includes(term)
      )
      setFilteredDonors(filtered)
    }
  }, [volunteers, donors, searchTerm, statusFilter, participantType])

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

  const fetchParticipants = async () => {
    if (!token || !selectedEvent) return
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch(`/api/ngo/event-participants?eventId=${selectedEvent}&type=all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setVolunteers(data.data.volunteers || [])
        setDonors(data.data.donors || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to fetch participants")
      }
    } catch (err) {
      setError("Error fetching participants")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const generateCertificates = async (volunteerIds: string[]) => {
    if (!selectedEvent || volunteerIds.length === 0) return
    
    setIsGeneratingCertificates(true)
    setError("")
    
    try {
      const response = await fetch("/api/volunteer-certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: selectedEvent,
          volunteerIds,
          ngoSignature: ngoSignature || null,
          authorizedPerson: authorizedPerson || null
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(`Successfully processed ${data.results.length} certificate(s)`)
        setShowCertificateDialog(false)
        setSelectedVolunteers([])
        setNgoSignature("")
        setAuthorizedPerson("")
        await fetchParticipants() // Refresh participant list
        
        toast({
          title: "Certificates Generated",
          description: `${data.results.filter((r: any) => r.status === 'success').length} certificates generated and sent via email`,
          variant: "default",
        })
      } else {
        const data = await response.json()
        setError(data.error || "Failed to generate certificates")
      }
    } catch (err) {
      setError("Error generating certificates")
      console.error(err)
    } finally {
      setIsGeneratingCertificates(false)
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

  const handleSelectVolunteer = (volunteerId: string) => {
    setSelectedVolunteers(prev => 
      prev.includes(volunteerId) 
        ? prev.filter(id => id !== volunteerId)
        : [...prev, volunteerId]
    )
  }

  const handleSelectAll = () => {
    const eligibleVolunteers = filteredVolunteers.filter(v => !v.certificateIssued)
    if (selectedVolunteers.length === eligibleVolunteers.length) {
      setSelectedVolunteers([])
    } else {
      setSelectedVolunteers(eligibleVolunteers.map(v => v._id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Participant Management</h2>
          <p className="text-gray-600 mt-1">
            Manage volunteers and donors for your events
          </p>
        </div>
        <Button onClick={fetchEvents} variant="outline" size="sm" className="w-fit">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
          <CardDescription>
            Choose an event to view and manage its volunteers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card 
                key={event._id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedEvent === event._id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedEvent(event._id)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event.eventDate)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {event.registeredVolunteers} volunteers
                    </div>
                  </div>
                  <Badge 
                    variant={event.status === 'active' ? 'default' : 'secondary'}
                    className="mt-2"
                  >
                    {event.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Participants Section */}
      {selectedEvent && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={participantType === "volunteers" ? "default" : "outline"}
              onClick={() => setParticipantType("volunteers")}
            >
              Volunteers ({volunteers.length})
            </Button>
            <Button
              variant={participantType === "donors" ? "default" : "outline"}
              onClick={() => setParticipantType("donors")}
            >
              Donors ({donors.length})
            </Button>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white rounded-lg border p-4 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={`Search ${participantType} by name, email...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter - Only for Volunteers */}
              {participantType === "volunteers" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full lg:w-auto">
                      <Filter className="w-4 h-4 mr-2" />
                      Status: {statusFilter === "all" ? "All" : statusFilter.replace('_', ' ')}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                      All Volunteers
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("registered")}>
                      Registered
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("certified")}>
                      Certified
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("pending_certificate")}>
                      Pending Certificate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Bulk Actions - Only for Volunteers */}
            {participantType === "volunteers" && filteredVolunteers.some(v => !v.certificateIssued) && (
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button
                  onClick={handleSelectAll}
                  variant="outline"
                  size="sm"
                >
                  {selectedVolunteers.length === filteredVolunteers.filter(v => !v.certificateIssued).length 
                    ? "Deselect All" 
                    : "Select All Eligible"
                  }
                </Button>
                
                {selectedVolunteers.length > 0 && (
                  <Button
                    onClick={() => setShowCertificateDialog(true)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Generate Certificates ({selectedVolunteers.length})
                  </Button>
                )}
              </div>
            )}
          </div>

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

          {/* Participants List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading participants...</p>
              </div>
            </div>
          ) : (participantType === "volunteers" ? filteredVolunteers : filteredDonors).length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {participantType} found
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? `No ${participantType} match your search "${searchTerm}"`
                    : `No ${participantType} have registered for this event yet`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {participantType === "volunteers" ? (
                // Volunteers List
                filteredVolunteers.map((volunteer) => (
                  <Card key={volunteer._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Selection Checkbox */}
                          {!volunteer.certificateIssued && (
                            <input
                              type="checkbox"
                              checked={selectedVolunteers.includes(volunteer._id)}
                              onChange={() => handleSelectVolunteer(volunteer._id)}
                              className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">{volunteer.userName}</h3>
                              <Badge 
                                variant={volunteer.certificateIssued ? "default" : "secondary"}
                                className={volunteer.certificateIssued ? "bg-green-100 text-green-800" : ""}
                              >
                                {volunteer.certificateIssued ? "Certified" : "Registered"}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {volunteer.userEmail}
                              </div>
                              {volunteer.userPhone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  {volunteer.userPhone}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Registered: {formatDate(volunteer.registeredAt)}
                              </div>
                              {volunteer.certificateIssued && volunteer.certificateId && (
                                <div className="flex items-center gap-2">
                                  <Award className="w-4 h-4" />
                                  Certificate: {volunteer.certificateId}
                                </div>
                              )}
                            </div>

                            {volunteer.motivation && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-700 mb-1">Motivation:</p>
                                <p className="text-sm text-gray-600 line-clamp-2">{volunteer.motivation}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            onClick={() => {
                              setSelectedVolunteer(volunteer)
                              setShowVolunteerDialog(true)
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          
                          {!volunteer.certificateIssued && (
                            <Button
                              onClick={() => {
                                setSelectedVolunteers([volunteer._id])
                                setShowCertificateDialog(true)
                              }}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Award className="w-4 h-4 mr-2" />
                              Issue Certificate
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // Donors List
                filteredDonors.map((donor) => (
                  <Card key={donor._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">{donor.userName || donor.name || "Anonymous"}</h3>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Donor
                              </Badge>
                              {donor.status && (
                                <Badge variant="secondary">
                                  {donor.status}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {donor.userEmail || donor.email || "N/A"}
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {donor.userPhone || donor.phone || "N/A"}
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Registered: {formatDate(donor.createdAt)}
                              </div>
                              {donor.amount && (
                                <div className="flex items-center gap-2">
                                  <Heart className="w-4 h-4 text-red-500" />
                                  Donation: ₹{donor.amount}
                                </div>
                              )}
                            </div>

                            {donor.alphanumericToken && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">Token:</span>
                                    <code className="bg-white px-2 py-1 rounded border text-sm">{donor.alphanumericToken}</code>
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Volunteer Details Dialog */}
      <Dialog open={showVolunteerDialog} onOpenChange={setShowVolunteerDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Volunteer Details</DialogTitle>
            <DialogDescription>
              Complete information about the volunteer registration
            </DialogDescription>
          </DialogHeader>
          
          {selectedVolunteer && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-gray-900">{selectedVolunteer.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{selectedVolunteer.userEmail}</p>
                  </div>
                  {selectedVolunteer.userPhone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-gray-900">{selectedVolunteer.userPhone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Registration Date</p>
                    <p className="text-gray-900">{formatDate(selectedVolunteer.registeredAt)}</p>
                  </div>
                </div>
              </div>

              {/* Event Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Event Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Event</p>
                    <p className="text-gray-900">{selectedVolunteer.eventTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="text-gray-900">{formatDate(selectedVolunteer.eventDate)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-gray-900">{selectedVolunteer.eventLocation}</p>
                  </div>
                </div>
              </div>

              {/* Volunteer Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Motivation</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedVolunteer.motivation}</p>
                </div>
                
                {selectedVolunteer.experience && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Previous Experience</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedVolunteer.experience}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Availability</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedVolunteer.availability}</p>
                </div>
                
                {selectedVolunteer.skills && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Skills & Interests</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedVolunteer.skills}</p>
                  </div>
                )}
              </div>

              {/* Certificate Status */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Certificate Status</h3>
                {selectedVolunteer.certificateIssued ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Certificate Issued</span>
                    </div>
                    {selectedVolunteer.certificateId && (
                      <p className="text-green-700 mt-1 text-sm">
                        Certificate ID: {selectedVolunteer.certificateId}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Certificate Pending</span>
                    </div>
                    <p className="text-yellow-700 mt-1 text-sm">
                      Certificate has not been issued yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Certificate Generation Dialog */}
      <AlertDialog open={showCertificateDialog} onOpenChange={setShowCertificateDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              Generate Volunteer Certificates
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Generate and send certificates to {selectedVolunteers.length} volunteer(s).
              <br /><br />
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Authorized Person Name (Optional)
                  </label>
                  <Input
                    placeholder="e.g., John Doe, Director"
                    value={authorizedPerson}
                    onChange={(e) => setAuthorizedPerson(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Digital Signature (Base64 - Optional)
                  </label>
                  <Textarea
                    placeholder="Paste base64 encoded signature image..."
                    value={ngoSignature}
                    onChange={(e) => setNgoSignature(e.target.value)}
                    rows={3}
                    className="resize-none text-xs"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => generateCertificates(selectedVolunteers)}
              disabled={isGeneratingCertificates}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGeneratingCertificates ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate & Send
                </>
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}