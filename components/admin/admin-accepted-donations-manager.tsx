"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Truck, MapPin, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface User {
  _id: string
  name: string
  email: string
  phone?: string
}

interface AcceptedRequest {
  _id: string
  bloodType: string
  quantity: number
  urgency: string
  reason: string
  status: string
  createdAt: string
  donorId?: string
}

interface AdminAcceptedDonationsManagerProps {
  token: string
}

export function AdminAcceptedDonationsManager({ token }: AdminAcceptedDonationsManagerProps) {
  const [acceptedDonations, setAcceptedDonations] = useState<AcceptedRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showTransportDialog, setShowTransportDialog] = useState(false)
  const [selectedDonation, setSelectedDonation] = useState<AcceptedRequest | null>(null)
  const [pickupLocation, setPickupLocation] = useState("")
  const [dropLocation, setDropLocation] = useState("")
  const [hospitalName, setHospitalName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAcceptedDonations()
  }, [token])

  const fetchAcceptedDonations = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/accepted-donations", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setAcceptedDonations(data.requests || [])
      } else {
        setError("Failed to fetch accepted donations")
      }
    } catch (err) {
      setError("Error fetching accepted donations")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransportClick = (donation: AcceptedRequest) => {
    setSelectedDonation(donation)
    setPickupLocation("")
    setDropLocation("")
    setHospitalName("")
    setShowTransportDialog(true)
  }

  const handleCreateTransport = async () => {
    if (!selectedDonation || !pickupLocation || !dropLocation || !hospitalName) {
      setError("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/transportation-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          acceptedRequestId: selectedDonation._id,
          userId: selectedDonation.donorId,
          pickupLocation,
          dropLocation,
          hospitalName,
          hospitalLocation: hospitalName,
        }),
      })

      if (response.ok) {
        setSuccess("Transportation request created successfully!")
        setShowTransportDialog(false)
        setSelectedDonation(null)
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create transportation request")
      }
    } catch (err) {
      setError("Error creating transportation request")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading accepted donations...</span>
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
            Manage Accepted Donations
          </CardTitle>
          <CardDescription>Create transportation requests for accepted blood donations</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm mb-4">{success}</div>}

          {acceptedDonations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No accepted blood donations at this moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {acceptedDonations.map((donation) => (
                <div
                  key={donation._id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-blue-600">{donation.bloodType}</div>
                        <div>
                          <p className="font-semibold text-gray-900">Blood Type Needed</p>
                          <p className="text-sm text-gray-600">{donation.quantity} unit(s) required</p>
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={`${
                        donation.urgency === "critical"
                          ? "bg-red-100 text-red-800"
                          : donation.urgency === "high"
                            ? "bg-orange-100 text-orange-800"
                            : donation.urgency === "normal"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                      } capitalize`}
                    >
                      {donation.urgency}
                    </Badge>
                  </div>

                  {donation.reason && (
                    <div className="mb-3 p-2 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Reason:</span> {donation.reason}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Posted {new Date(donation.createdAt).toLocaleDateString()}
                    </p>
                    <Button
                      onClick={() => handleTransportClick(donation)}
                      size="sm"
                      className="gap-2"
                      variant="outline"
                    >
                      <Truck className="w-4 h-4" />
                      Create Transport
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transportation Dialog */}
      <AlertDialog open={showTransportDialog} onOpenChange={setShowTransportDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Create Transportation Request</AlertDialogTitle>
            <AlertDialogDescription>
              Set up transportation for blood donation delivery
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Pickup Location (Donor's Address)
              </label>
              <Input
                placeholder="e.g., 123 Main St, City"
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
                placeholder="e.g., 456 Hospital Ave, City"
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

            {selectedDonation && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
                <p className="text-blue-900">
                  <span className="font-medium">Blood Type:</span> {selectedDonation.bloodType}
                </p>
                <p className="text-blue-900">
                  <span className="font-medium">Quantity:</span> {selectedDonation.quantity} units
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateTransport}
              disabled={isSubmitting || !pickupLocation || !hospitalName}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Creating..." : "Create Transport"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}