"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, Mail, Bell, Users, CheckCircle, AlertCircle } from "lucide-react"

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
  token: string
}

export function AdminSendNotification({ users: initialUsers, token }: AdminSendNotificationProps) {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [sendToAll, setSendToAll] = useState(false)
  const [selectedBloodType, setSelectedBloodType] = useState("")
  const [sendToAccepted, setSendToAccepted] = useState(false)
  const [sendEmail, setSendEmail] = useState(true)
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

  const getRecipientCount = () => {
    if (sendToAll) return initialUsers.length
    if (selectedBloodType && selectedBloodType !== "all") return filteredUsers.length
    if (sendToAccepted) return "Users with accepted requests"
    if (selectedUserId) return 1
    return 0
  }

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
          sendEmail,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(
          `Notification sent successfully! Reached ${result.recipientCount} users. ${
            sendEmail ? `${result.emailsSent} emails sent.` : "No emails sent."
          }`
        )
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
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-5xl">
        
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border mb-8 p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">Send Notifications</h1>
          <p className="text-muted-foreground text-lg">Send notifications to users' dashboards and email addresses</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg shadow-sm">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                  <div>
                    <h3 className="text-red-800 font-semibold text-base">Error</h3>
                    <p className="text-red-700 mt-1 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg shadow-sm">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  <div>
                    <h3 className="text-green-800 font-semibold text-base">Success</h3>
                    <p className="text-green-700 mt-1 text-sm">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recipient Selection Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Select Recipients</h2>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-sm">
                  {typeof getRecipientCount() === 'number' ? `${getRecipientCount()} users` : getRecipientCount()}
                </Badge>
              </div>
              
              <div className="space-y-6">
                
                {/* Quick Options */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 text-base">Quick Select Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Send to All Users */}
                    <label className="flex items-start gap-3 p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
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
                        className="w-5 h-5 text-blue-600 rounded mt-0.5"
                      />
                      <div>
                        <span className="font-medium text-gray-900 text-base">All Users</span>
                        <p className="text-gray-500 mt-1 text-sm">
                          Send to all {initialUsers.length} registered users
                        </p>
                      </div>
                    </label>
                    
                    {/* Send to Active Donors */}
                    {!sendToAll && (
                      <label className="flex items-start gap-3 p-4 border rounded-lg hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer">
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
                          className="w-5 h-5 text-green-600 rounded mt-0.5"
                        />
                        <div>
                          <span className="font-medium text-gray-900 text-base">Active Donors</span>
                          <p className="text-gray-500 mt-1 text-sm">
                            Users who have accepted blood requests
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Filters */}
                {!sendToAll && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 text-base">Filter Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Blood Type
                        </label>
                        <select
                          value={selectedBloodType}
                          onChange={(e) => {
                            setSelectedBloodType(e.target.value)
                            setSelectedUserId("")
                            setSendToAccepted(false)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="">All Blood Types</option>
                          {BLOOD_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type} ({initialUsers.filter((u) => u.bloodGroup === type).length} users)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Specific User
                        </label>
                        <select
                          value={selectedUserId}
                          onChange={(e) => {
                            setSelectedUserId(e.target.value)
                            setSelectedBloodType("")
                            setSendToAccepted(false)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="">Select a user</option>
                          {initialUsers.map((user) => (
                            <option key={user._id} value={user._id}>
                              {user.name} ({user.email}) - {user.bloodGroup || "Unknown"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message Content Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Notification Content</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    placeholder="Enter notification title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Enter your notification message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Settings and Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Email Settings */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Email Delivery</h3>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-base">Send via Email</p>
                    <p className="text-gray-500 mt-1 text-sm">Also send notifications via SMTP email</p>
                  </div>
                  <Switch
                    checked={sendEmail}
                    onCheckedChange={setSendEmail}
                  />
                </div>
              </div>

              {/* Preview */}
              {(title || message) && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Preview</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    {title && (
                      <h4 className="font-bold text-gray-900 mb-2 text-base">{title}</h4>
                    )}
                    {message && (
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Send Button */}
            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                className="px-8 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Send Notification
                  </div>
                )}
              </Button>
            </div>
          </form>
      </div>
    </div>
  )
}
