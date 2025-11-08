"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertCircle, Truck, CheckCircle2, Phone, Mail, Phone as PhoneIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TransportationRequest {
  _id: string
  pickupLocation: string
  dropLocation: string
  hospitalLocation: string
  status: string
  driverNumber?: string
  createdAt: string
  userName: string
  userEmail: string
  userPhone: string
  bloodGroup: string
  quantity: number
}

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const STATUS_TIMELINE = [
  { key: "pending", label: "Request Pending", icon: "⏳" },
  { key: "assigned", label: "Driver Assigned", icon: "🚚" },
  { key: "completed", label: "Blood Donation Completed", icon: "✅" },
]

function TransportationTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STATUS_TIMELINE.findIndex(step => step.key === currentStatus)
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
        
        {STATUS_TIMELINE.map((step, index) => {
          const isActive = index <= currentIndex
          const isCurrent = index === currentIndex
          
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                transition-all duration-300
                ${isActive 
                  ? isCurrent 
                    ? 'bg-blue-600 text-white shadow-lg scale-110' 
                    : 'bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-600'
                }
              `}>
                {step.icon}
              </div>
              <span className={`
                text-xs mt-2 text-center max-w-20
                ${isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}
              `}>
                {step.label}
              </span>
            </div>
          )
        })}
        
        {/* Progress line */}
        <div 
          className="absolute top-5 left-0 h-1 bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / STATUS_TIMELINE.length) * 100}%` }}
        />
      </div>
    </div>
  )
}

interface AdminTransportationManagerProps {
  token: string
}

export function AdminTransportationManager({ token }: AdminTransportationManagerProps) {
  const [requests, setRequests] = useState<TransportationRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<TransportationRequest | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [driverNumber, setDriverNumber] = useState("")
  const [driverName, setDriverName] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    fetchRequests()
  }, [token])

  const fetchRequests = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/transportation-request", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        setError("Failed to load transportation requests")
      }
    } catch (err) {
      setError("Error fetching transportation requests")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (request: TransportationRequest) => {
    setSelectedRequest(request)
    setDriverNumber(request.driverNumber || "")
    setDriverName((request as any).driverName || "")
    setNewStatus(request.status)
    setShowDialog(true)
  }

  const handleUpdateTransportation = async () => {
    if (!selectedRequest) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/transportation-request", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transportationId: selectedRequest._id,
          driverNumber: driverNumber || undefined,
          driverName: driverName || undefined,
          status: newStatus,
        }),
      })

      if (response.ok) {
        setSuccessMessage("Transportation request updated successfully!")
        setShowDialog(false)
        fetchRequests()
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update transportation request")
      }
    } catch (err) {
      setError("Error updating transportation request")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredRequests =
    filterStatus === "all" ? requests : requests.filter((r) => r.status === filterStatus)

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const assignedRequests = requests.filter((r) => r.status === "assigned")
  const completedRequests = requests.filter((r) => r.status === "completed")
  const cancelledRequests = requests.filter((r) => r.status === "cancelled")

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading transportation requests...</div>
  }

  return (
    <>
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-100 text-green-800 rounded-md text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>{successMessage}</div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => setFilterStatus("all")}
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
          >
            All ({requests.length})
          </Button>
          <Button
            onClick={() => setFilterStatus("pending")}
            variant={filterStatus === "pending" ? "default" : "outline"}
            size="sm"
            className={filterStatus === "pending" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
          >
            Pending ({pendingRequests.length})
          </Button>
          <Button
            onClick={() => setFilterStatus("assigned")}
            variant={filterStatus === "assigned" ? "default" : "outline"}
            size="sm"
            className={filterStatus === "assigned" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            Assigned ({assignedRequests.length})
          </Button>
          <Button
            onClick={() => setFilterStatus("completed")}
            variant={filterStatus === "completed" ? "default" : "outline"}
            size="sm"
            className={filterStatus === "completed" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Completed ({completedRequests.length})
          </Button>
          <Button
            onClick={() => setFilterStatus("cancelled")}
            variant={filterStatus === "cancelled" ? "default" : "outline"}
            size="sm"
            className={filterStatus === "cancelled" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Cancelled ({cancelledRequests.length})
          </Button>
        </div>

        {/* Transportation Requests */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No transportation requests in this category</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request._id} className="hover:border-primary/50 transition">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {request.bloodGroup} • {request.quantity} unit(s)
                        </p>
                        <p className="text-sm text-gray-600">{request.userName}</p>
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      STATUS_COLORS[request.status as keyof typeof STATUS_COLORS] ||
                      "bg-gray-100 text-gray-800"
                    } capitalize`}
                  >
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Amazon-style Timeline */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Blood Donation Progress</p>
                    <TransportationTimeline currentStatus={request.status} />
                  </div>
                  {/* User Information */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="font-semibold text-gray-900 mb-2">User Information</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${request.userEmail}`} className="text-blue-600 hover:underline">
                          {request.userEmail}
                        </a>
                      </div>
                      {request.userPhone && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${request.userPhone}`} className="text-blue-600 hover:underline">
                            {request.userPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pickup Location */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="font-semibold text-gray-900 text-sm mb-1">Pickup Location</p>
                    <p className="text-sm text-gray-700">{request.pickupLocation}</p>
                  </div>

                  {/* Drop Location (Hospital) */}
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                    <p className="font-semibold text-gray-900 text-sm mb-1">Drop Location (Hospital)</p>
                    <p className="text-sm text-gray-700">{request.hospitalLocation || request.dropLocation}</p>
                  </div>

                  {/* Driver Information */}
                  {(request.driverNumber || (request as any).driverName) && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                      {(request as any).driverName && (
                        <>
                          <p className="font-semibold text-gray-900 text-sm mb-1">Driver Name</p>
                          <p className="text-sm text-gray-700 mb-2">{(request as any).driverName}</p>
                        </>
                      )}
                      {request.driverNumber && (
                        <>
                          <p className="font-semibold text-gray-900 text-sm mb-1">Driver Number</p>
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4 text-orange-600" />
                            <a href={`tel:${request.driverNumber}`} className="text-orange-600 hover:underline font-mono">
                              {request.driverNumber}
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t">
                    <p>Created {new Date(request.createdAt).toLocaleDateString()}</p>
                    <Dialog open={showDialog && selectedRequest?._id === request._id} onOpenChange={setShowDialog}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => handleOpenDialog(request)}
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                        >
                          Update Details
                        </Button>
                      </DialogTrigger>
                      {selectedRequest?._id === request._id && (
                        <DialogContent className="bg-white max-w-md">
                          <DialogHeader>
                            <DialogTitle>Update Transportation Request</DialogTitle>
                            <DialogDescription>
                              Update driver number and transportation status
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            {/* Driver Name Input */}
                            <div>
                              <label className="block text-sm font-medium mb-2">Driver Name</label>
                              <Input
                                type="text"
                                placeholder="Enter driver's full name"
                                value={driverName}
                                onChange={(e) => setDriverName(e.target.value)}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                The driver's name to share with the user
                              </p>
                            </div>

                            {/* Driver Number Input */}
                            <div>
                              <label className="block text-sm font-medium mb-2">Driver Number</label>
                              <Input
                                type="tel"
                                placeholder="Enter driver's phone number"
                                value={driverNumber}
                                onChange={(e) => setDriverNumber(e.target.value)}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                The driver's contact number to share with the user
                              </p>
                            </div>

                            {/* Status Dropdown */}
                            <div>
                              <label className="block text-sm font-medium mb-2">Transportation Status *</label>
                              <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="assigned">Assigned</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Current Status Info */}
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                              <p className="text-gray-600">
                                <span className="font-medium">Current Status:</span>{" "}
                                <span className="capitalize">{selectedRequest.status}</span>
                              </p>
                              {(selectedRequest as any).driverName && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Current Driver Name:</span> {(selectedRequest as any).driverName}
                                </p>
                              )}
                              {selectedRequest.driverNumber && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Current Driver Phone:</span> {selectedRequest.driverNumber}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end mt-6">
                            <Button
                              onClick={() => setShowDialog(false)}
                              variant="outline"
                              disabled={isSubmitting}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleUpdateTransportation}
                              disabled={isSubmitting || !newStatus}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {isSubmitting ? "Updating..." : "Update Request"}
                            </Button>
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  )
}