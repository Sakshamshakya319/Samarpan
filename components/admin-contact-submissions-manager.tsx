"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MessageSquare, Reply, Loader2, CheckCircle2, Clock } from "lucide-react"

interface ContactSubmission {
  _id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: "new" | "read" | "replied"
  createdAt: string
  adminReply?: string
  adminRepliedAt?: string
  adminRepliedBy?: string
}

interface AdminContactSubmissionsManagerProps {
  token: string
}

export function AdminContactSubmissionsManager({ token }: AdminContactSubmissionsManagerProps) {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [filter, setFilter] = useState<"all" | "new" | "replied">("all")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchSubmissions()
  }, [filter])

  const fetchSubmissions = async () => {
    setIsLoading(true)
    setError("")
    try {
      const url = `/api/contact-submissions?${filter !== "all" ? `status=${filter}` : ""}`
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch submissions")
      }

      const data = await response.json()
      setSubmissions(data.submissions)
    } catch (err: any) {
      setError(err.message || "Failed to fetch contact submissions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!selectedSubmission || !replyText.trim()) {
      setError("Please enter a reply message")
      return
    }

    setIsSendingReply(true)
    setError("")
    try {
      const response = await fetch("/api/contact-submissions/reply", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: selectedSubmission._id,
          reply: replyText,
          adminEmail: localStorage.getItem("adminEmail") || "admin@samarpan.com",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send reply")
      }

      const data = await response.json()
      setSuccess("Reply sent successfully!")
      setReplyText("")
      
      // Update the selected submission with the new reply
      setSelectedSubmission(data.updatedSubmission)
      
      // Refresh the submissions list
      setTimeout(() => {
        fetchSubmissions()
        setSuccess("")
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to send reply")
    } finally {
      setIsSendingReply(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-600">New</Badge>
      case "replied":
        return <Badge className="bg-green-600">Replied</Badge>
      default:
        return <Badge className="bg-gray-600">Read</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Submissions List */}
      <div className="lg:col-span-1">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Contact Submissions</h2>
          
          {/* Filter Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                filter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              All ({submissions.length})
            </button>
            <button
              onClick={() => setFilter("new")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                filter === "new"
                  ? "bg-blue-600 text-white"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              New
            </button>
            <button
              onClick={() => setFilter("replied")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                filter === "replied"
                  ? "bg-green-600 text-white"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              Replied
            </button>
          </div>

          {/* Submissions List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No submissions found</p>
            ) : (
              submissions.map((submission) => (
                <button
                  key={submission._id}
                  onClick={() => setSelectedSubmission(submission)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedSubmission?._id === submission._id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{submission.name}</p>
                    {getStatusBadge(submission.status)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{submission.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Submission Details & Reply */}
      <div className="lg:col-span-2">
        {selectedSubmission ? (
          <Card className="p-6">
            {/* Error & Success Messages */}
            {error && (
              <div className="mb-4 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Submission Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedSubmission.subject}</h2>
                  <p className="text-muted-foreground">From: {selectedSubmission.name}</p>
                </div>
                {getStatusBadge(selectedSubmission.status)}
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${selectedSubmission.email}`} className="text-sm font-medium hover:text-primary">
                      {selectedSubmission.email}
                    </a>
                  </div>
                </div>
                {selectedSubmission.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{selectedSubmission.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Message
              </h3>
              <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                <p className="whitespace-pre-wrap">{selectedSubmission.message}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Received: {formatDate(selectedSubmission.createdAt)}
              </p>
            </div>

            {/* Previous Reply if exists */}
            {selectedSubmission.adminReply && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Previous Reply
                </h3>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="whitespace-pre-wrap">{selectedSubmission.adminReply}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Sent: {formatDate(selectedSubmission.adminRepliedAt || "")} by {selectedSubmission.adminRepliedBy}
                </p>
              </div>
            )}

            {/* Reply Form */}
            {selectedSubmission.status !== "replied" ? (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Reply className="w-4 h-4" />
                  Send Reply
                </h3>
                <div className="space-y-3">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={5}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={isSendingReply || !replyText.trim()}
                    className="w-full"
                  >
                    {isSendingReply ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending Reply...
                      </>
                    ) : (
                      <>
                        <Reply className="w-4 h-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">✓ This submission has already been replied to.</p>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-6 flex items-center justify-center min-h-96">
            <p className="text-muted-foreground text-center">
              Select a contact submission from the list to view details and reply
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}