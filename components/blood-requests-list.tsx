"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertCircle, Droplet, CheckCircle2, Truck } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface BloodRequest {
  _id: string
  bloodGroup: string
  quantity: number
  urgency: string
  reason: string
  hospitalLocation: string
  status: string
  createdAt: string
  userName: string
  userEmail: string
  userPhone: string
  userId: string
}

interface ValidationWarning {
  show: boolean
  error: string
  warning: string
  daysRemaining: number
  lastDonationDate: string
}

interface UserProfile {
  bloodGroup: string
  lastDonationDate?: string
}

interface AcceptedDonation {
  bloodRequestId: string
  acceptedAt: string
}

const URGENCY_COLORS = {
  low: "bg-blue-100 text-blue-800",
  normal: "bg-green-100 text-green-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
}

export function BloodRequestsList() {
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<BloodRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [acceptedDonations, setAcceptedDonations] = useState<AcceptedDonation[]>([])
  const [validationWarning, setValidationWarning] = useState<ValidationWarning>({
    show: false,
    error: "",
    warning: "",
    daysRemaining: 0,
    lastDonationDate: "",
  })
  const [successMessage, setSuccessMessage] = useState("")
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null)
  const [cancelingRequestId, setCancelingRequestId] = useState<string | null>(null)
  const [showTransportDialog, setShowTransportDialog] = useState(false)
  const [selectedRequestForTransport, setSelectedRequestForTransport] = useState<BloodRequest | null>(null)
  const [pickupLocation, setPickupLocation] = useState("")
  const [dropLocation, setDropLocation] = useState("")
  const [hospitalName, setHospitalName] = useState("")
  const [isSubmittingTransport, setIsSubmittingTransport] = useState(false)
  const { token } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (token) {
      fetchUserProfile()
      fetchRequests()
      fetchAcceptedDonations()
    }
  }, [token])

  // Re-filter requests when user profile is loaded
  useEffect(() => {
    if (userProfile && userProfile.bloodGroup && requests.length > 0) {
      const matched = requests.filter(
        (req: BloodRequest) => req.bloodGroup === userProfile.bloodGroup && req.status === "active"
      )
      setFilteredRequests(matched)
    }
  }, [userProfile, requests])

  const fetchUserProfile = async () => {
    if (!token) return
    try {
      const response = await fetch("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err)
    }
  }

  const fetchRequests = async () => {
    if (!token) return
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/blood-request?all=true", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const allRequests = data.requests || []
        setRequests(allRequests)
      } else {
        setError("Failed to load blood requests")
      }
    } catch (err) {
      setError("Error fetching requests")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAcceptedDonations = async () => {
    if (!token) return
    try {
      const response = await fetch("/api/blood-request/my-acceptances", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setAcceptedDonations(data.acceptances || [])
      }
    } catch (err) {
      console.error("Failed to fetch accepted donations:", err)
    }
  }

  const handleAcceptRequest = async (requestId: string, request: BloodRequest) => {
    if (!token) return

    setAcceptingRequestId(requestId)
    try {
      const response = await fetch("/api/blood-request/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bloodRequestId: requestId }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage("Blood donation accepted! Thank you for saving a life!")
        setAcceptingRequestId(null)
        fetchRequests()
        fetchAcceptedDonations()
        // Show transport dialog after accepting
        setSelectedRequestForTransport(request)
        setPickupLocation("")
        setDropLocation(request.hospitalLocation) // Set drop location to hospital location (fixed)
        setHospitalName("")
        setShowTransportDialog(true)
        setTimeout(() => setSuccessMessage(""), 3000)
      } else if (response.status === 400 && data.canDonate === false) {
        // Show 3-month validation warning
        setValidationWarning({
          show: true,
          error: data.error,
          warning: data.warning,
          daysRemaining: data.daysRemaining || 0,
          lastDonationDate: data.lastDonationDate || "",
        })
        setAcceptingRequestId(null)
      } else {
        setError(data.error || "Failed to accept request")
        setAcceptingRequestId(null)
      }
    } catch (err) {
      setError("Error accepting request")
      setAcceptingRequestId(null)
      console.error(err)
    }
  }

  const handleCreateTransport = async () => {
    if (!selectedRequestForTransport || !pickupLocation) {
      setError("Please fill in your pickup location")
      return
    }

    setIsSubmittingTransport(true)
    try {
      const response = await fetch("/api/transportation-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bloodRequestId: selectedRequestForTransport._id,
          pickupLocation,
          dropLocation, // Hospital location (fixed)
          hospitalName: hospitalName || "",
        }),
      })

      if (response.ok) {
        setSuccessMessage("Transportation request created successfully! Check your notifications for details.")
        setShowTransportDialog(false)
        setSelectedRequestForTransport(null)
        setIsSubmittingTransport(false)
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create transportation request")
        setIsSubmittingTransport(false)
      }
    } catch (err) {
      setError("Error creating transportation request")
      setIsSubmittingTransport(false)
      console.error(err)
    }
  }

  const handleCancelDonation = async (requestId: string) => {
    if (!token) return

    setCancelingRequestId(requestId)
    try {
      const response = await fetch("/api/blood-request/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bloodRequestId: requestId }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage("Blood donation cancelled successfully")
        setCancelingRequestId(null)
        fetchAcceptedDonations()
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setError(data.error || "Failed to cancel donation")
        setCancelingRequestId(null)
      }
    } catch (err) {
      setError("Error cancelling donation")
      setCancelingRequestId(null)
      console.error(err)
    }
  }

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading blood requests...</div>
  }

  if (!userProfile || !userProfile.bloodGroup) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-green-600" />
            Blood Donation Opportunities
          </CardTitle>
          <CardDescription>Help save lives by donating blood</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Please set your blood type in your profile first</p>
            <p className="text-sm text-gray-500 mt-2">Visit your profile to add your blood group information.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (filteredRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-green-600" />
            Blood Donation Opportunities
          </CardTitle>
          <CardDescription>Requests matching your blood type ({userProfile.bloodGroup})</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Droplet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No blood requests for your blood type at this moment.</p>
            <p className="text-sm text-gray-500 mt-2">Check back later to help save lives!</p>
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
            <Droplet className="w-5 h-5 text-green-600" />
            Blood Donation Opportunities
          </CardTitle>
          <CardDescription>
            {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""} for your blood type (
            {userProfile.bloodGroup})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">{error}</div>
          )}
          {successMessage && (
            <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <div
                key={request._id}
                className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-green-600">{request.bloodGroup}</div>
                      <div>
                        <p className="font-semibold text-gray-900">Blood Type Requested</p>
                        <p className="text-sm text-gray-600">{request.quantity} unit(s) needed</p>
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      URGENCY_COLORS[request.urgency as keyof typeof URGENCY_COLORS] || "bg-gray-100 text-gray-800"
                    } capitalize`}
                  >
                    {request.urgency}
                  </Badge>
                </div>

                {request.reason && (
                  <div className="mb-3 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Reason:</span> {request.reason}
                    </p>
                  </div>
                )}

                <div className="mb-3 p-2 bg-purple-50 rounded border border-purple-200">
                  <p className="text-sm text-purple-900">
                    <span className="font-medium">Hospital Location:</span> {request.hospitalLocation}
                  </p>
                </div>

                <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Requested by:</span> {request.userName} ({request.userEmail})
                  </p>
                  {request.userPhone && (
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">Contact:</span> {request.userPhone}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Posted {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    {acceptedDonations.some((ad) => ad.bloodRequestId === request._id) ? (
                      <>
                        <Button
                          disabled
                          size="sm"
                          className="bg-green-100 text-green-800 hover:bg-green-100 gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Blood Donation Accepted
                        </Button>
                        <Button
                          onClick={() => handleCancelDonation(request._id)}
                          disabled={cancelingRequestId === request._id}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50 gap-2"
                        >
                          {cancelingRequestId === request._id ? "Cancelling..." : "Cancel Donation"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleAcceptRequest(request._id, request)}
                        disabled={acceptingRequestId === request._id}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 gap-2"
                      >
                        {acceptingRequestId === request._id ? "Accepting..." : "Accept & Donate"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3-Month Validation Warning Dialog */}
      <AlertDialog open={validationWarning.show} onOpenChange={(open) => !open && setValidationWarning({ ...validationWarning, show: false })}>
        <AlertDialogContent className="border-orange-300 bg-white">
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-600 mt-1" />
              </div>
              <div>
                <AlertDialogTitle className="text-orange-900">Cannot Donate Yet</AlertDialogTitle>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-gray-700">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="font-semibold text-orange-900 mb-2">{validationWarning.error}</p>
                <p className="text-sm text-orange-800 mb-3">{validationWarning.warning}</p>

                <div className="bg-white p-2 rounded border border-orange-100">
                  <p className="text-xs text-gray-600 mb-1">Last Donation Date:</p>
                  <p className="font-mono text-sm text-gray-900">
                    {new Date(validationWarning.lastDonationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Why 3 months?</strong> Medical guidelines require at least 3 months between blood donations to
                  ensure your health and safety. This allows your body to fully recover and replenish your blood volume.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end mt-4">
            <AlertDialogCancel>Close</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transportation Arrangement Dialog */}
      <Dialog open={showTransportDialog} onOpenChange={setShowTransportDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <DialogTitle>Arrange Transportation</DialogTitle>
            </div>
            <DialogDescription>
              Provide your pickup location for transportation to the hospital
            </DialogDescription>
          </DialogHeader>

          {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Pickup Location *</label>
              <Input
                placeholder="Enter your pickup address"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Where we should pick you up from</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Drop Location (Hospital) - Fixed</label>
              <Input
                placeholder="Hospital location"
                value={dropLocation}
                readOnly
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Hospital location from the blood request (auto-filled, cannot be changed)</p>
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button
              onClick={() => setShowTransportDialog(false)}
              variant="outline"
              disabled={isSubmittingTransport}
            >
              Skip
            </Button>
            <Button
              onClick={handleCreateTransport}
              disabled={isSubmittingTransport || !pickupLocation}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {isSubmittingTransport ? "Creating..." : "Create Transportation Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}