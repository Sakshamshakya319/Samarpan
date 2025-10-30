"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Droplet, CheckCircle2, Phone, Mail } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface BloodRequest {
  _id: string
  bloodGroup: string
  quantity: number
  urgency: string
  reason: string
  status: string
  createdAt: string
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
}

const URGENCY_COLORS = {
  low: "bg-blue-100 text-blue-800",
  normal: "bg-green-100 text-green-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
}

interface AdminBloodRequestsManagerProps {
  token: string
}

export function AdminBloodRequestsManager({ token }: AdminBloodRequestsManagerProps) {
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [dialogAction, setDialogAction] = useState<"fulfill" | "cancel" | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [token])

  const fetchRequests = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/blood-request?all=true", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        setError("Failed to load blood requests")
      }
    } catch (err) {
      setError("Error fetching blood requests")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/blood-request/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setSuccessMessage(`Blood request status updated to ${newStatus}`)
        setShowDialog(false)
        setSelectedRequest(null)
        fetchRequests()
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update request status")
      }
    } catch (err) {
      setError("Error updating blood request")
      console.error(err)
    }
  }

  const openDialog = (request: BloodRequest, action: "fulfill" | "cancel") => {
    setSelectedRequest(request)
    setDialogAction(action)
    setShowDialog(true)
  }

  const activeRequests = requests.filter((r) => r.status === "active")
  const fulfilledRequests = requests.filter((r) => r.status === "fulfilled")
  const cancelledRequests = requests.filter((r) => r.status === "cancelled")

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading blood requests...</div>
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

        {/* Active Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-red-600" />
              Active Blood Requests ({activeRequests.length})
            </CardTitle>
            <CardDescription>Pending blood donation requests from users</CardDescription>
          </CardHeader>
          <CardContent>
            {activeRequests.length === 0 ? (
              <div className="text-center py-8">
                <Droplet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No active blood requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeRequests.map((request) => (
                  <div
                    key={request._id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50/50 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-red-600">{request.bloodGroup}</div>
                          <div>
                            <p className="font-semibold text-gray-900">Blood Group Needed</p>
                            <p className="text-sm text-gray-600">{request.quantity} unit(s) required</p>
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={`${
                          URGENCY_COLORS[request.urgency as keyof typeof URGENCY_COLORS] ||
                          "bg-gray-100 text-gray-800"
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

                    <div className="mb-3 p-3 border border-blue-200 bg-blue-50 rounded">
                      <p className="font-semibold text-gray-900 mb-2">Requester Information</p>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Name:</span> {request.userName}
                        </p>
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

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => openDialog(request, "fulfill")}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Fulfilled
                        </Button>
                        <Button
                          onClick={() => openDialog(request, "cancel")}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Cancel Request
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fulfilled Requests */}
        {fulfilledRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Fulfilled Requests ({fulfilledRequests.length})
              </CardTitle>
              <CardDescription>Blood requests that have been fulfilled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fulfilledRequests.map((request) => (
                  <div key={request._id} className="p-4 border border-gray-200 rounded-lg bg-green-50/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-green-600">{request.bloodGroup}</div>
                        <div>
                          <p className="font-semibold text-gray-900">{request.quantity} unit(s)</p>
                          <p className="text-sm text-gray-600">{request.userName}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Fulfilled</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Fulfilled {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancelled Requests */}
        {cancelledRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cancelled Requests ({cancelledRequests.length})</CardTitle>
              <CardDescription>Blood requests that have been cancelled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cancelledRequests.map((request) => (
                  <div key={request._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-gray-400">{request.bloodGroup}</div>
                        <div>
                          <p className="font-semibold text-gray-900">{request.quantity} unit(s)</p>
                          <p className="text-sm text-gray-600">{request.userName}</p>
                        </div>
                      </div>
                      <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Cancelled {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status Update Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === "fulfill" ? "Mark Request as Fulfilled?" : "Cancel This Request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === "fulfill"
                ? `Are you sure you want to mark the blood request for ${selectedRequest?.bloodGroup} (${selectedRequest?.quantity} units) as fulfilled?`
                : `Are you sure you want to cancel the blood request for ${selectedRequest?.bloodGroup} (${selectedRequest?.quantity} units)?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedRequest && dialogAction) {
                  const newStatus = dialogAction === "fulfill" ? "fulfilled" : "cancelled"
                  handleStatusUpdate(selectedRequest._id, newStatus)
                }
              }}
              className={dialogAction === "fulfill" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {dialogAction === "fulfill" ? "Yes, Mark Fulfilled" : "Yes, Cancel Request"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}