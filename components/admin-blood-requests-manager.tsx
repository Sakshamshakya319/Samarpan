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
  hospitalLocation: string
  hospitalDocumentImage?: string
  hospitalDocumentFileName?: string
  requestType?: string
  patientName?: string | null
  patientPhone?: string | null
  verified?: boolean
}

const URGENCY_COLORS = {
  low: "bg-blue-100 text-blue-800",
  normal: "bg-green-100 text-green-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
}

const DOCUMENT_MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
}

function getDocumentMime(fileName?: string) {
  if (!fileName) return "image/jpeg"
  const ext = fileName.split(".").pop()?.toLowerCase() || ""
  return DOCUMENT_MIME_MAP[ext] || "image/jpeg"
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
  const [dialogAction, setDialogAction] = useState<"fulfill" | "cancel" | "delete" | null>(null)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

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

  const handleDeleteRequest = async (requestId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/blood-request/${requestId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setSuccessMessage("Blood request deleted successfully")
        setShowDialog(false)
        setSelectedRequest(null)
        fetchRequests()
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete request")
      }
    } catch (err) {
      setError("Error deleting blood request")
      console.error(err)
    }
  }

  const handleVerifyRequest = async (requestId: string) => {
    if (!token) return

    setVerifyingId(requestId)
    try {
      const response = await fetch(`/api/blood-request/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ verified: true }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage("Blood request accepted")
        fetchRequests()
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setError(data.error || "Failed to accept blood request")
      }
    } catch (err) {
      setError("Error accepting blood request")
      console.error(err)
    } finally {
      setVerifyingId(null)
    }
  }

  const openDialog = (request: BloodRequest, action: "fulfill" | "cancel" | "delete") => {
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
                {activeRequests.map((request) => {
                  const documentMime = getDocumentMime(request.hospitalDocumentFileName)
                  const documentUrl = request.hospitalDocumentImage
                    ? `data:${documentMime};base64,${request.hospitalDocumentImage}`
                    : null
                  const isPdf = documentMime === "application/pdf"
                  const requestForOthers = request.requestType === "others"
                  return (
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
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            className={`${
                              URGENCY_COLORS[request.urgency as keyof typeof URGENCY_COLORS] ||
                              "bg-gray-100 text-gray-800"
                            } capitalize`}
                          >
                            {request.urgency}
                          </Badge>
                          <Badge className={`${request.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                            {request.verified ? "Document Accepted" : "Awaiting Review"}
                          </Badge>
                        </div>
                      </div>

                      {request.reason && (
                        <div className="mb-3 p-2 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Reason:</span> {request.reason}
                          </p>
                        </div>
                      )}

                      <div className="grid gap-3 md:grid-cols-2 mb-3">
                        <div className="p-3 border border-purple-200 bg-purple-50 rounded">
                          <p className="font-semibold text-gray-900 mb-1">Hospital Details</p>
                          <p className="text-sm text-gray-700">{request.hospitalLocation}</p>
                        </div>
                        <div className="p-3 border border-amber-200 bg-amber-50 rounded">
                          <p className="font-semibold text-gray-900 mb-1">Request Type</p>
                          <p className="text-sm text-gray-700">
                            {requestForOthers ? "Request for someone else" : "Request for self"}
                          </p>
                          {requestForOthers && (
                            <div className="mt-2 space-y-1">
                              {request.patientName && (
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Patient Name:</span> {request.patientName}
                                </p>
                              )}
                              {request.patientPhone && (
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Patient Phone:</span> {request.patientPhone}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {documentUrl && (
                        <div className="mb-3 p-3 border border-gray-200 rounded bg-white">
                          <p className="font-semibold text-gray-900 mb-2">Proof Document</p>
                          {isPdf ? (
                            <a
                              href={documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View Document {request.hospitalDocumentFileName ? `(${request.hospitalDocumentFileName})` : ""}
                            </a>
                          ) : (
                            <div className="rounded overflow-hidden border border-gray-200">
                              <img
                                src={documentUrl}
                                alt={`Hospital document for ${request.userName}`}
                                className="w-full max-h-64 object-contain bg-black/5"
                              />
                            </div>
                          )}
                          {request.hospitalDocumentFileName && (
                            <div className="mt-2">
                              <a
                                href={documentUrl}
                                download={request.hospitalDocumentFileName}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Download {request.hospitalDocumentFileName}
                              </a>
                            </div>
                          )}
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
                        <div className="flex flex-wrap gap-2 justify-end">
                          {request.verified !== true && (
                            <Button
                              onClick={() => handleVerifyRequest(request._id)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={verifyingId === request._id}
                            >
                              {verifyingId === request._id ? "Accepting..." : "Accept Blood"}
                            </Button>
                          )}
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
                          <Button
                            onClick={() => openDialog(request, "delete")}
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
              {dialogAction === "fulfill" ? "Mark Request as Fulfilled?" : dialogAction === "cancel" ? "Cancel This Request?" : "Delete This Request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === "fulfill"
                ? `Are you sure you want to mark the blood request for ${selectedRequest?.bloodGroup} (${selectedRequest?.quantity} units) as fulfilled?`
                : dialogAction === "cancel"
                ? `Are you sure you want to cancel the blood request for ${selectedRequest?.bloodGroup} (${selectedRequest?.quantity} units)?`
                : `Are you sure you want to delete the blood request for ${selectedRequest?.bloodGroup} (${selectedRequest?.quantity} units)? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedRequest && dialogAction) {
                  if (dialogAction === "delete") {
                    handleDeleteRequest(selectedRequest._id)
                  } else {
                    const newStatus = dialogAction === "fulfill" ? "fulfilled" : "cancelled"
                    handleStatusUpdate(selectedRequest._id, newStatus)
                  }
                }
              }}
              className={
                dialogAction === "fulfill" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }
            >
              {dialogAction === "fulfill" ? "Yes, Mark Fulfilled" : dialogAction === "cancel" ? "Yes, Cancel Request" : "Yes, Delete Request"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}