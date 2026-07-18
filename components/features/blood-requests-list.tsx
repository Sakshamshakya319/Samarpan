"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Droplet, CheckCircle2, Truck, Loader2 } from "lucide-react"
import { useAppSelector } from "@/lib/store/hooks"
import { VerificationBadge } from "@/components/VerificationBadge"
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
  requesterName?: string
  requesterPhone?: string
  isSOS?: boolean
  hospital?: {
    name: string
    address: string
    city: string
    lat: number
    lon: number
    googleUrl?: string
    osmUrl?: string
  }
  verificationLevel?: 1 | 2 | 3
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
  low: "bg-blue-50 text-blue-700 border border-blue-200",
  normal: "bg-green-50 text-green-700 border border-green-200",
  high: "bg-orange-50 text-orange-700 border border-orange-200",
  critical: "bg-red-50 text-red-700 border border-red-200",
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
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [selectedRequestForAccept, setSelectedRequestForAccept] = useState<BloodRequest | null>(null)
  const [needsTransportation, setNeedsTransportation] = useState(false)
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

  useEffect(() => {
    if (userProfile && userProfile.bloodGroup) {
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
    setSelectedRequestForAccept(request)
    setShowAcceptDialog(true)
  }

  const confirmAcceptRequest = async () => {
    if (!token || !selectedRequestForAccept) return

    const requestId = selectedRequestForAccept._id
    setShowAcceptDialog(false)
    setAcceptingRequestId(requestId)
    
    try {
      const response = await fetch("/api/blood-request/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          bloodRequestId: requestId,
          needsTransportation: needsTransportation 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage("Blood donation accepted! Thank you for saving a life!")
        setAcceptingRequestId(null)
        fetchRequests()
        fetchAcceptedDonations()
        
        if (!needsTransportation) {
          setSelectedRequestForTransport(selectedRequestForAccept)
          setPickupLocation("")
          
          const dropLoc = selectedRequestForAccept.isSOS && selectedRequestForAccept.hospital 
            ? `${selectedRequestForAccept.hospital.name}, ${selectedRequestForAccept.hospital.address}, ${selectedRequestForAccept.hospital.city}`
            : selectedRequestForAccept.hospitalLocation;
            
          setDropLocation(dropLoc)
          setHospitalName(selectedRequestForAccept.isSOS && selectedRequestForAccept.hospital ? selectedRequestForAccept.hospital.name : "")
          setShowTransportDialog(true)
        }
        
        setTimeout(() => setSuccessMessage(""), 4000)
      } else if (response.status === 400 && data.canDonate === false) {
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
          dropLocation,
          hospitalName: hospitalName || "",
        }),
      })

      if (response.ok) {
        setSuccessMessage("Transportation request created successfully! Check your notifications for details.")
        setShowTransportDialog(false)
        setSelectedRequestForTransport(null)
        setIsSubmittingTransport(false)
        setTimeout(() => setSuccessMessage(""), 4000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create transportation request")
        setIsSubmittingTransport(false)
      }
    } catch (err) {
      setError("Error creating transportation request")
      setIsSubmittingTransport(false)
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
        setSuccessMessage("Blood donation cancelled.")
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
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-xl border border-slate-200">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        <span className="text-slate-500 font-medium">Loading blood requests...</span>
      </div>
    )
  }

  if (!userProfile || !userProfile.bloodGroup) {
    return (
      <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-red-500" />
            Donation Opportunities
          </CardTitle>
          <CardDescription className="text-slate-500">Help save lives by donating blood</CardDescription>
        </CardHeader>
        <CardContent className="pt-10 pb-10">
          <div className="text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-900 font-semibold mb-2">Profile Incomplete</p>
            <p className="text-sm text-slate-500 leading-relaxed">
              Please set your blood type in your profile to view matching donation opportunities in your area.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (filteredRequests.length === 0) {
    return (
      <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-red-500" />
            Donation Opportunities
          </CardTitle>
          <CardDescription className="text-slate-500">Requests matching your blood type ({userProfile.bloodGroup})</CardDescription>
        </CardHeader>
        <CardContent className="pt-12 pb-12">
          <div className="text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplet className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-900 font-semibold mb-2">No active requests found</p>
            <p className="text-sm text-slate-500 leading-relaxed">
              There are currently no open blood requests for your specific blood type. Check back later to help save lives!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1.5">
                <Droplet className="w-5 h-5 text-red-500" />
                Donation Opportunities
              </CardTitle>
              <CardDescription className="text-slate-500">
                {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""} matching <strong className="text-slate-700">{userProfile.bloodGroup}</strong>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm mb-6 flex items-start gap-3 border border-red-100">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="font-medium">{error}</div>
            </div>
          )}
          {successMessage && (
            <div className="p-4 bg-green-50 text-green-800 rounded-lg text-sm mb-6 flex items-start gap-3 border border-green-100">
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="font-medium">{successMessage}</div>
            </div>
          )}

          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request._id}
                className="p-5 md:p-6 border border-slate-200 bg-white rounded-xl shadow-sm hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-black text-red-600">{request.bloodGroup}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg leading-tight">Blood Required</p>
                      <p className="text-sm text-slate-500 mt-0.5">{request.quantity} unit(s) needed</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={`px-3 py-1 font-semibold rounded-full uppercase tracking-wider text-[10px] ${
                        URGENCY_COLORS[request.urgency as keyof typeof URGENCY_COLORS] || "bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      {request.urgency}
                    </Badge>
                    {request.isSOS && (
                      <VerificationBadge level={request.verificationLevel || 3} />
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Hospital Location</p>
                    <p className="text-sm font-medium text-slate-900 leading-snug">
                      {request.isSOS && request.hospital ? `${request.hospital.name}, ${request.hospital.address}, ${request.hospital.city}` : request.hospitalLocation}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Requested By</p>
                    <p className="text-sm font-medium text-slate-900 leading-snug mb-0.5">
                      {request.userName || request.requesterName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{request.userEmail}</p>
                    {(request.userPhone || request.requesterPhone) && (
                      <p className="text-xs font-medium text-slate-700 mt-1">{request.userPhone || request.requesterPhone}</p>
                    )}
                  </div>
                  
                  {request.reason && (
                    <div className="sm:col-span-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</p>
                      <p className="text-sm text-slate-700">{request.reason}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-400">
                    Posted on {new Date(request.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <div className="flex gap-2">
                    {acceptedDonations.some((ad) => ad.bloodRequestId === request._id) ? (
                      <>
                        <Button
                          disabled
                          className="bg-green-50 text-green-700 hover:bg-green-50 border border-green-200 gap-2 font-semibold h-10 px-4"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Accepted
                        </Button>
                        <Button
                          onClick={() => handleCancelDonation(request._id)}
                          disabled={cancelingRequestId === request._id}
                          variant="outline"
                          className="text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 gap-2 font-semibold h-10 px-4 transition-colors"
                        >
                          {cancelingRequestId === request._id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleAcceptRequest(request._id, request)}
                        disabled={acceptingRequestId === request._id}
                        className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold h-10 px-6 transition-colors"
                      >
                        {acceptingRequestId === request._id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Accepting...</>
                        ) : (
                          "Accept & Donate"
                        )}
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
        <AlertDialogContent className="border border-slate-200 bg-white shadow-lg rounded-xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <AlertDialogTitle className="text-xl font-bold text-slate-900">Donation Eligibility</AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <AlertDialogDescription asChild>
            <div className="space-y-4 mt-2">
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                <p className="font-bold text-orange-900 mb-1">{validationWarning.error}</p>
                <p className="text-sm text-orange-800 mb-4">{validationWarning.warning}</p>

                <div className="bg-white p-3 rounded-md border border-orange-200/60 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Donation</span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {new Date(validationWarning.lastDonationDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 font-bold block mb-1">Why 3 months?</strong>
                  Medical guidelines mandate a 3-month gap between donations to ensure donor health. This period allows your body to fully replenish blood volume and iron levels safely.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end mt-6">
            <AlertDialogCancel className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold h-10 px-6">Close</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept Blood Request Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className="bg-white border border-slate-200 shadow-lg rounded-xl max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Droplet className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 text-left">Confirm Donation</DialogTitle>
                <DialogDescription className="text-left mt-1">
                  You are committing to donate blood for this request.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200">
                <div className="text-2xl font-black text-red-600">{selectedRequestForAccept?.bloodGroup}</div>
                <div className="text-sm font-medium text-slate-500">{selectedRequestForAccept?.quantity} unit(s) requested</div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Hospital</span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedRequestForAccept?.isSOS && selectedRequestForAccept?.hospital ? `${selectedRequestForAccept.hospital.name}, ${selectedRequestForAccept.hospital.city}` : selectedRequestForAccept?.hospitalLocation}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Patient Contact</span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedRequestForAccept?.userName || selectedRequestForAccept?.requesterName} • {selectedRequestForAccept?.userPhone || selectedRequestForAccept?.requesterPhone || selectedRequestForAccept?.userEmail}
                  </span>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <Checkbox
                id="needsTransportation"
                checked={needsTransportation}
                onCheckedChange={(checked) => setNeedsTransportation(checked as boolean)}
                className="mt-1 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
              />
              <div>
                <span className="text-sm font-bold text-slate-900 block mb-1">I need transportation assistance</span>
                <span className="text-xs text-slate-500 leading-relaxed block">
                  Check this box if you require an NGO volunteer to arrange transport to the hospital for your donation.
                </span>
              </div>
            </label>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button
              onClick={() => setShowAcceptDialog(false)}
              variant="outline"
              className="h-11 px-6 font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAcceptRequest}
              disabled={acceptingRequestId === selectedRequestForAccept?._id}
              className="h-11 px-6 font-semibold bg-red-600 hover:bg-red-700 text-white gap-2 transition-colors"
            >
              {acceptingRequestId === selectedRequestForAccept?._id ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</>
              ) : (
                "Confirm & Accept"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransportDialog} onOpenChange={setShowTransportDialog}>
        <DialogContent className="bg-white border border-slate-200 shadow-lg rounded-xl max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 text-left">Arrange Transport</DialogTitle>
                <DialogDescription className="text-left mt-1">
                  We can help you get to the hospital safely.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {error && <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm font-medium mb-4">{error}</div>}

          <div className="space-y-5 py-2">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">Pickup Location <span className="text-red-500">*</span></label>
              <Input
                placeholder="Enter your exact pickup address"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="h-11 bg-white border-slate-200 focus-visible:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">Drop Location (Hospital)</label>
              <Input
                value={dropLocation}
                readOnly
                disabled
                className="h-11 bg-slate-50 border-slate-200 text-slate-600 font-medium cursor-not-allowed opacity-100"
              />
            </div>
            
            {selectedRequestForTransport?.isSOS && selectedRequestForTransport?.hospital && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">View Directions</p>
                <div className="flex gap-3">
                  {selectedRequestForTransport.hospital.googleUrl && (
                    <Button asChild variant="outline" className="flex-1 h-10 text-sm font-semibold border-slate-200 hover:bg-slate-50">
                      <a href={selectedRequestForTransport.hospital.googleUrl} target="_blank" rel="noreferrer">
                        Google Maps
                      </a>
                    </Button>
                  )}
                  {selectedRequestForTransport.hospital.osmUrl && (
                    <Button asChild variant="outline" className="flex-1 h-10 text-sm font-semibold border-slate-200 hover:bg-slate-50">
                      <a href={selectedRequestForTransport.hospital.osmUrl} target="_blank" rel="noreferrer">
                        OpenStreetMap
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end mt-6">
            <Button
              onClick={() => setShowTransportDialog(false)}
              variant="outline"
              disabled={isSubmittingTransport}
              className="h-11 px-6 font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Skip Transport
            </Button>
            <Button
              onClick={handleCreateTransport}
              disabled={isSubmittingTransport || !pickupLocation}
              className="h-11 px-6 font-semibold bg-slate-900 hover:bg-slate-800 text-white gap-2"
            >
              {isSubmittingTransport ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Requesting...</>
              ) : (
                "Request Transport"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}