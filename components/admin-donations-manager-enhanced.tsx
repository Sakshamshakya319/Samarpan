"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  CheckCircle2,
  Truck,
  MapPin,
  Loader2,
  Phone,
  Mail,
  AlertCircle,
  Clock,
  CheckCheck,
  Package,
  PhoneCall,
} from "lucide-react"

interface AcceptedDonation {
  _id: string
  acceptanceId: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string
  bloodGroup: string
  quantity: number
  acceptedAt: string
  status: string // accepted, transportation_needed, image_uploaded, fulfilled
  needsTransportation: boolean
  updatedAt: string
  transportationId?: string
  transportationStatus?: string
  bloodRequest: {
    reason: string
    urgency: string
    createdAt: string
  }
}

interface AdminDonationsManagerEnhancedProps {
  token: string
}

export function AdminDonationsManagerEnhanced({ token }: AdminDonationsManagerEnhancedProps) {
  const [donations, setDonations] = useState<AcceptedDonation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showTransportDialog, setShowTransportDialog] = useState(false)
  const [selectedDonation, setSelectedDonation] = useState<AcceptedDonation | null>(null)
  const [pickupLocation, setPickupLocation] = useState("")
  const [dropLocation, setDropLocation] = useState("")
  const [hospitalName, setHospitalName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showDriverDetailsDialog, setShowDriverDetailsDialog] = useState(false)
  const [selectedDonationForDriver, setSelectedDonationForDriver] = useState<AcceptedDonation | null>(null)
  const [driverName, setDriverName] = useState("")
  const [driverPhone, setDriverPhone] = useState("")
  const [vehicleInfo, setVehicleInfo] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false)

  useEffect(() => {
    fetchDonations()
  }, [token])

  const fetchDonations = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/accepted-donations", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        let donations = data.requests || []
        
        // Fetch transportation requests to enrich donation data
        try {
          const transportResponse = await fetch("/api/transportation-request", {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (transportResponse.ok) {
            const transportData = await transportResponse.json()
            const transportRequests = transportData.requests || []
            
            // Enrich donations with transportation info
            donations = donations.map((donation: AcceptedDonation) => {
              const transport = transportRequests.find(
                (t: any) => t.userId.toString() === donation.userId.toString() || 
                           t.acceptedRequestId?.toString() === donation._id.toString()
              )
              return {
                ...donation,
                needsTransportation: !!transport,
                transportationId: transport?._id,
                transportationStatus: transport?.status,
              }
            })
          }
        } catch (err) {
          console.error("Error fetching transportation requests:", err)
          // Continue without transportation data
        }
        
        setDonations(donations)
      } else {
        setError("Failed to fetch donations")
      }
    } catch (err) {
      setError("Error fetching donations")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case "transportation_needed":
        return "bg-orange-100 text-orange-800"
      case "image_uploaded":
        return "bg-purple-100 text-purple-800"
      case "fulfilled":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="w-4 h-4" />
      case "transportation_needed":
        return <Truck className="w-4 h-4" />
      case "image_uploaded":
        return <Package className="w-4 h-4" />
      case "fulfilled":
        return <CheckCheck className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "accepted":
        return "Accepted"
      case "transportation_needed":
        return "Transportation Arranged"
      case "image_uploaded":
        return "Image Uploaded"
      case "fulfilled":
        return "Fulfilled ✓"
      default:
        return status
    }
  }

  const handleTransportClick = (donation: AcceptedDonation) => {
    setSelectedDonation(donation)
    setPickupLocation("")
    setDropLocation("")
    setHospitalName("")
    setShowTransportDialog(true)
  }

  const handleCreateTransport = async () => {
    if (!selectedDonation || !pickupLocation || !dropLocation || !hospitalName) {
      setError("Please fill in all fields (Pickup Location, Drop Location, and Hospital Name)")
      return
    }

    setIsSubmitting(true)
    try {
      // First, update donation status to transportation_needed
      const updateResponse = await fetch("/api/admin/blood-donations/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          acceptanceId: selectedDonation._id,
          newStatus: "transportation_needed",
          needsTransportation: true,
        }),
      })

      if (!updateResponse.ok) {
        throw new Error("Failed to update donation status")
      }

      // Then create transportation request
      const transportResponse = await fetch("/api/transportation-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          acceptedRequestId: selectedDonation._id,
          userId: selectedDonation.userId,
          pickupLocation,
          dropLocation,
          hospitalName,
          hospitalLocation: hospitalName,
        }),
      })

      if (transportResponse.ok) {
        setSuccess("Transportation request created and notification sent to user!")
        setShowTransportDialog(false)
        setSelectedDonation(null)
        await fetchDonations()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError("Failed to create transportation request")
      }
    } catch (err) {
      setError("Error creating transportation request")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (donation: AcceptedDonation, newStatus: string) => {
    setUpdatingId(donation._id)
    try {
      const response = await fetch("/api/admin/blood-donations/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          acceptanceId: donation._id,
          newStatus,
        }),
      })

      if (response.ok) {
        setSuccess(`Donation status updated to ${getStatusLabel(newStatus)}`)
        await fetchDonations()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError("Failed to update status")
      }
    } catch (err) {
      setError("Error updating status")
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleOpenDriverDetailsDialog = (donation: AcceptedDonation) => {
    setSelectedDonationForDriver(donation)
    setDriverName("")
    setDriverPhone("")
    setVehicleInfo("")
    setPickupTime("")
    setShowDriverDetailsDialog(true)
  }

  const handleSendDriverDetails = async () => {
    if (!selectedDonationForDriver || !driverName || !driverPhone) {
      setError("Please fill in Driver Name and Driver Phone")
      return
    }

    setIsSubmittingDriver(true)
    try {
      const response = await fetch("/api/admin/send-driver-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedDonationForDriver.userId,
          driverName,
          driverPhone,
          vehicleInfo,
          pickupTime,
        }),
      })

      if (response.ok) {
        setSuccess("Driver details sent to user successfully!")
        setShowDriverDetailsDialog(false)
        setSelectedDonationForDriver(null)
        await fetchDonations()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to send driver details")
      }
    } catch (err) {
      setError("Error sending driver details")
      console.error(err)
    } finally {
      setIsSubmittingDriver(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading donations...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Manage Blood Donations (Status Tracking)
          </CardTitle>
          <CardDescription>Track donation status: Accepted → Transportation → Image → Fulfilled</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm mb-4">{success}</div>}

          {donations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No accepted blood donations at this moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => (
                <div
                  key={donation._id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition"
                >
                  {/* Header with Blood Type and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-red-600">{donation.bloodGroup}</div>
                      <div>
                        <p className="font-semibold text-gray-900">Blood Type Accepted</p>
                        <p className="text-sm text-gray-600">{donation.quantity} unit(s) • Urgency: {donation.bloodRequest.urgency}</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusBadgeColor(donation.status)} flex items-center gap-1 capitalize`}>
                      {getStatusIcon(donation.status)}
                      {getStatusLabel(donation.status)}
                    </Badge>
                  </div>

                  {/* Donor Information */}
                  <div className="bg-gray-50 p-3 rounded mb-3 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Donor:</span>
                        <span className="text-gray-600">{donation.userName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{donation.userEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{donation.userPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Transportation:</span>
                        {donation.needsTransportation ? (
                          <span className="text-orange-600 font-medium">
                            ✓ Yes {donation.transportationStatus && `(${donation.transportationStatus})`}
                          </span>
                        ) : (
                          <span className="text-green-600">✗ No</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Blood Request Details */}
                  {donation.bloodRequest.reason && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <span className="font-medium text-blue-900">Request Reason:</span>
                      <p className="text-blue-700 mt-1">{donation.bloodRequest.reason}</p>
                    </div>
                  )}

                  {/* Timeline and Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {/* Status Timeline */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Accepted: {new Date(donation.acceptedAt).toLocaleDateString()}</p>
                      <p>Last Updated: {new Date(donation.updatedAt).toLocaleDateString()}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 justify-end">
                      {!donation.needsTransportation && donation.status === "accepted" && (
                        <Button
                          onClick={() => handleTransportClick(donation)}
                          size="sm"
                          className="gap-2 bg-orange-600 hover:bg-orange-700"
                          disabled={updatingId === donation._id}
                        >
                          <Truck className="w-4 h-4" />
                          {updatingId === donation._id ? "Processing..." : "Arrange Transport"}
                        </Button>
                      )}

                      {donation.needsTransportation && (
                        <>
                          <Button
                            size="sm"
                            className="gap-2 bg-purple-600 hover:bg-purple-700"
                            disabled={updatingId === donation._id}
                            title={`Transportation: ${donation.transportationStatus}`}
                          >
                            <Truck className="w-4 h-4" />
                            Transportation: {donation.transportationStatus}
                          </Button>
                          
                          <Button
                            onClick={() => handleOpenDriverDetailsDialog(donation)}
                            size="sm"
                            className="gap-2 bg-green-600 hover:bg-green-700"
                            disabled={updatingId === donation._id}
                            title="Send driver details to donor"
                          >
                            <Phone className="w-4 h-4" />
                            Send Driver Details
                          </Button>
                        </>
                      )}

                      {(donation.status === "transportation_needed" || donation.status === "accepted") && (
                        <Button
                          onClick={() => handleUpdateStatus(donation, "image_uploaded")}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          disabled={updatingId === donation._id}
                        >
                          <Package className="w-4 h-4" />
                          Image Uploaded
                        </Button>
                      )}

                      {donation.status !== "fulfilled" && (
                        <Button
                          onClick={() => handleUpdateStatus(donation, "fulfilled")}
                          size="sm"
                          className="gap-2 bg-green-600 hover:bg-green-700"
                          disabled={updatingId === donation._id}
                        >
                          <CheckCheck className="w-4 h-4" />
                          {updatingId === donation._id ? "Marking..." : "Mark Fulfilled"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Details Dialog */}
      <AlertDialog open={showDriverDetailsDialog} onOpenChange={setShowDriverDetailsDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-green-600" />
              Send Driver Details to User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Notify the donor about their transportation driver
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {selectedDonationForDriver && (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm space-y-2">
                  <p>
                    <span className="font-medium text-blue-900">Recipient:</span> {selectedDonationForDriver.userName}
                  </p>
                  <p>
                    <span className="font-medium text-blue-900">Email:</span> {selectedDonationForDriver.userEmail}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Driver Name *</label>
                  <Input
                    placeholder="e.g., John Smith"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <PhoneCall className="w-4 h-4" />
                    Driver Phone Number *
                  </label>
                  <Input
                    placeholder="e.g., +1 (555) 123-4567"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Vehicle Info (Optional)</label>
                  <Input
                    placeholder="e.g., White Honda Civic - Plate: ABC123"
                    value={vehicleInfo}
                    onChange={(e) => setVehicleInfo(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Pickup Time (Optional)</label>
                  <Input
                    placeholder="e.g., Today at 2:00 PM"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendDriverDetails}
              disabled={isSubmittingDriver || !driverName || !driverPhone}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmittingDriver ? "Sending..." : "Send Driver Details"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transportation Dialog */}
      <AlertDialog open={showTransportDialog} onOpenChange={setShowTransportDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Arrange Transportation</AlertDialogTitle>
            <AlertDialogDescription>Set up transportation for blood donation pickup</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {selectedDonation && (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm space-y-2">
                  <p>
                    <span className="font-medium text-blue-900">Donor:</span> {selectedDonation.userName}
                  </p>
                  <p>
                    <span className="font-medium text-blue-900">Blood Type:</span> {selectedDonation.bloodGroup}
                  </p>
                  <p>
                    <span className="font-medium text-blue-900">Contact:</span> {selectedDonation.userPhone}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Pickup Location (Donor's Address)
                  </label>
                  <Input
                    placeholder="e.g., 123 Main St, City, ZIP"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Drop Location (Destination Address)
                  </label>
                  <Input
                    placeholder="e.g., 456 Hospital Ave, City, ZIP"
                    value={dropLocation}
                    onChange={(e) => setDropLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Hospital/Destination Name
                  </label>
                  <Input
                    placeholder="e.g., City Medical Center"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateTransport}
              disabled={isSubmitting || !pickupLocation || !dropLocation || !hospitalName}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Setting Up..." : "Confirm & Notify User"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}