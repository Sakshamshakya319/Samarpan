"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Truck, MapPin, Loader2, AlertCircle, PhoneIcon, CheckCircle2, RefreshCw, Edit3 } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"

interface TransportationDetails {
  _id: string
  pickupLocation: string
  dropLocation: string
  hospitalLocation?: string
  hospitalName?: string
  status: string
  driverName?: string
  driverNumber?: string
  transportationVerified: boolean
  createdAt: string
  updatedAt: string
}

export function DriverDetailsDisplay() {
  const [transportationDetails, setTransportationDetails] = useState<TransportationDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [newPickupLocation, setNewPickupLocation] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const { token } = useAppSelector((state) => state.auth)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (token) {
      fetchTransportationDetails()
      // Start polling for updates every 5 seconds
      startPolling()
    }

    return () => {
      // Cleanup polling on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [token])

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    pollingIntervalRef.current = setInterval(() => {
      fetchTransportationDetails(true)
    }, 5000) // Poll every 5 seconds
  }

  const fetchTransportationDetails = async (isPolling = false) => {
    try {
      if (!isPolling) {
        setIsLoading(true)
      } else {
        // For polling, don't show loading state
      }
      setError("")

      const response = await fetch("/api/transportation-request/user-current", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setTransportationDetails(data.transportation || null)
      } else if (response.status === 404) {
        // No transportation details yet
        setTransportationDetails(null)
      } else {
        setError("Failed to fetch transportation details")
      }
    } catch (err) {
      console.error("Failed to fetch transportation details:", err)
      if (!isPolling) {
        setError("Error loading transportation details")
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await fetchTransportationDetails(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleEditPickupLocation = () => {
    if (transportationDetails) {
      setNewPickupLocation(transportationDetails.pickupLocation)
      setShowEditDialog(true)
    }
  }

  const handleUpdatePickupLocation = async () => {
    if (!newPickupLocation.trim()) {
      setError("Please enter a valid pickup location")
      return
    }

    setIsUpdating(true)
    setError("")

    try {
      const response = await fetch("/api/transportation-request/update-pickup", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickupLocation: newPickupLocation,
        }),
      })

      if (response.ok) {
        // Update local state
        setTransportationDetails(prev => 
          prev ? { ...prev, pickupLocation: newPickupLocation } : null
        )
        setShowEditDialog(false)
        setSuccessMessage("Pickup location updated successfully!")
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update pickup location")
      }
    } catch (err) {
      console.error("Failed to update pickup location:", err)
      setError("Error updating pickup location")
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Transportation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500 mr-2" />
            <p className="text-gray-500">Loading transportation details...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Transportation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!transportationDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Transportation Status
          </CardTitle>
          <CardDescription>Transportation details for your blood donation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No active transportation request.</p>
            <p className="text-sm text-gray-500 mt-2">
              When you upload a donation image after accepting a blood request, transportation details will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Transportation Status
            </CardTitle>
            <CardDescription>
              {transportationDetails.transportationVerified && (
                <span className="flex items-center gap-1 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 font-medium">Verified - Auto-captured from donation image</span>
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Badge className={getStatusColor(transportationDetails.status)}>
              {transportationDetails.status.charAt(0).toUpperCase() + transportationDetails.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {successMessage}
            </p>
          </div>
        )}
        {/* Pickup Location */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              Pickup Location (Your Address)
            </label>
            {transportationDetails.status === "pending" && (
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleEditPickupLocation}>
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Update Pickup Location</DialogTitle>
                    <DialogDescription>
                      Enter your new pickup location. The driver will pick you up from this address.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickupLocation">Pickup Address</Label>
                      <Input
                        id="pickupLocation"
                        placeholder="e.g., 123 Main Street, City, ZIP Code"
                        value={newPickupLocation}
                        onChange={(e) => setNewPickupLocation(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditDialog(false)}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleUpdatePickupLocation}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Location"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-sm font-medium text-gray-900">{transportationDetails.pickupLocation}</p>
            <p className="text-xs text-gray-500 mt-1">
              {transportationDetails.status === "pending" 
                ? "Driver will pick up donation from this location - You can edit this while request is pending"
                : "Driver will pick up donation from this location"
              }
            </p>
          </div>
        </div>

        {/* Hospital Drop Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Drop Location (Hospital)
          </label>
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-sm font-medium text-gray-900">
              {transportationDetails.hospitalName || transportationDetails.dropLocation}
            </p>
            <p className="text-xs text-gray-600 mt-1">{transportationDetails.hospitalLocation}</p>
            <p className="text-xs text-blue-600 mt-1">Donation will be delivered to this hospital</p>
          </div>
        </div>

        {/* Driver Details - Show only if assigned */}
        {transportationDetails.status === "assigned" && transportationDetails.driverNumber ? (
          <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Driver Assigned</h3>
            </div>
            <div className="space-y-3">
              {transportationDetails.driverName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-800">Driver Name:</span>
                  <span className="text-sm font-medium text-green-900">{transportationDetails.driverName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-800">Driver Contact:</span>
                <a
                  href={`tel:${transportationDetails.driverNumber}`}
                  className="text-sm font-medium text-green-700 hover:text-green-900 flex items-center gap-1"
                >
                  <PhoneIcon className="w-4 h-4" />
                  {transportationDetails.driverNumber}
                </a>
              </div>
              <p className="text-xs text-green-700 mt-2">
                ✓ The driver will contact you to confirm pickup time and location. Please ensure your location is accessible.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
              <h3 className="font-semibold text-yellow-900">Driver Assignment Pending</h3>
            </div>
            <p className="text-xs text-yellow-800">
              Admin is reviewing your request and will assign a driver soon. You'll receive a notification with the driver's contact details.
            </p>
          </div>
        )}

        {/* Status Timeline Info */}
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Status:</span> {transportationDetails.status === "pending" && "Waiting for admin to assign a driver"}
            {transportationDetails.status === "assigned" && "Driver has been assigned and will contact you"}
            {transportationDetails.status === "completed" && "Transportation completed - Thank you for your donation!"}
            {transportationDetails.status === "cancelled" && "This transportation request has been cancelled"}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            <span className="font-medium">Created:</span> {new Date(transportationDetails.createdAt).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}