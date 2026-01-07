"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface User {
  _id: string
  name: string
  email: string
  bloodGroup?: string
  location?: string
  phone?: string
  createdAt?: string
  lastDonationDate?: string
  totalDonations?: number
  hasDisease?: boolean
  diseaseDescription?: string
}

const BLOOD_TYPES = ["A-", "A+", "B-", "B+", "O-", "O+", "AB-", "AB+"]

interface AdminSendNotificationProps {
  users: User[]
  token: string | null
}

export function AdminSendNotification({ users: initialUsers, token }: AdminSendNotificationProps) {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [sendToAll, setSendToAll] = useState(false)
  const [selectedBloodType, setSelectedBloodType] = useState("")
  const [sendToAccepted, setSendToAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers)

  // Update filtered users when blood type changes
  useEffect(() => {
    if (selectedBloodType && selectedBloodType !== "all") {
      const filtered = initialUsers.filter((user) => user.bloodGroup === selectedBloodType)
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(initialUsers)
    }
  }, [selectedBloodType, initialUsers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!title || !message) {
      setError("Title and message are required")
      setIsLoading(false)
      return
    }

    if (!sendToAll && !selectedBloodType && !sendToAccepted && !selectedUserId) {
      setError("Please select a user, blood type, accepted users, or choose to send to all")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/admin/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUserId || undefined,
          title,
          message,
          sendToAll,
          bloodType: selectedBloodType || undefined,
          sendToAccepted: sendToAccepted || undefined,
        }),
      })

      if (response.ok) {
        setSuccess("Notification sent successfully!")
        setTitle("")
        setMessage("")
        setSelectedUserId("")
        setSelectedBloodType("")
        setSendToAccepted(false)
        setSendToAll(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to send notification")
      }
    } catch (err) {
      setError("Error sending notification")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Notification</CardTitle>
        <CardDescription>Send notifications to users based on different criteria</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">{success}</div>}

          <div className="space-y-2">
            <label className="text-sm font-medium">Recipient Options</label>
            <div className="space-y-3 border border-input rounded-md p-3">
              {/* Send to All Users */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendToAll}
                  onChange={(e) => {
                    setSendToAll(e.target.checked)
                    if (e.target.checked) {
                      setSelectedBloodType("")
                      setSelectedUserId("")
                      setSendToAccepted(false)
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">Send to all users</span>
              </label>

              {/* Send by Blood Type */}
              {!sendToAll && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="bloodType" className="text-sm font-medium block">
                      Filter by Blood Type
                    </label>
                    <select
                      id="bloodType"
                      value={selectedBloodType}
                      onChange={(e) => {
                        setSelectedBloodType(e.target.value)
                        setSelectedUserId("")
                        setSendToAccepted(false)
                      }}
                      className="w-full px-3 py-2 border border-input rounded-md"
                    >
                      <option value="">All Blood Types</option>
                      {BLOOD_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type} ({filteredUsers.filter((u) => u.bloodGroup === type).length} users)
                        </option>
                      ))}
                    </select>
                    {selectedBloodType && selectedBloodType !== "all" && (
                      <p className="text-xs text-muted-foreground">
                        Will send to {filteredUsers.length} user(s) with blood type {selectedBloodType}
                      </p>
                    )}
                  </div>

                  {/* Send to Accepted Requests */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sendToAccepted}
                      onChange={(e) => {
                        setSendToAccepted(e.target.checked)
                        if (e.target.checked) {
                          setSelectedBloodType("")
                          setSelectedUserId("")
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Send to users who accepted blood requests</span>
                  </label>

                  {/* Send to Specific User */}
                  <div className="space-y-2">
                    <label htmlFor="user" className="text-sm font-medium block">
                      Or select a specific user
                    </label>
                    <select
                      id="user"
                      value={selectedUserId}
                      onChange={(e) => {
                        setSelectedUserId(e.target.value)
                        setSelectedBloodType("")
                        setSendToAccepted(false)
                      }}
                      className="w-full px-3 py-2 border border-input rounded-md"
                    >
                      <option value="">Select a user</option>
                      {initialUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email}) - {user.bloodGroup || "Unknown"}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Notification"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
