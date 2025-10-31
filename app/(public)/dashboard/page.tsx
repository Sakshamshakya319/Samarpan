"use client"

// Mark as dynamic to prevent prerendering - requires authentication
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Bell, LogOut, User, Calendar, Trash2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { fetchUserProfile, updateUserProfile } from "@/lib/slices/userSlice"
import { logout } from "@/lib/slices/authSlice"
import { BloodDonationRequests } from "@/components/blood-donation-requests"
import { DonationImageUpload } from "@/components/donation-image-upload"
import { DriverDetailsDisplay } from "@/components/driver-details-display"
import { UserCertificatesDisplay } from "@/components/user-certificates-display"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface Notification {
  _id: string
  title: string
  message: string
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { token, isAuthenticated } = useAppSelector((state) => state.auth)
  const { data: user, isLoading } = useAppSelector((state) => state.user)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [editMode, setEditMode] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    bloodGroup: "",
    location: "",
    phone: "",
    lastDonationDate: "",
    hasDisease: false,
    diseaseDescription: "",
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    dispatch(fetchUserProfile())
  }, [isAuthenticated, router, dispatch])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bloodGroup: user.bloodGroup || "",
        location: user.location || "",
        phone: user.phone || "",
        lastDonationDate: user.lastDonationDate || "",
        hasDisease: user.hasDisease || false,
        diseaseDescription: user.diseaseDescription || "",
      })
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
    // Only fetch on mount, removed polling to prevent repeated API calls
  }, [token])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    router.push("/")
  }

  const handleUpdateProfile = async () => {
    setErrorMessage("")
    setSuccessMessage("")
    try {
      const result = await dispatch(updateUserProfile(formData))
      if (result.payload) {
        setSuccessMessage("Profile updated successfully!")
        setEditMode(false)
        setTimeout(() => setSuccessMessage(""), 3000)
      } else if (result.error) {
        setErrorMessage(result.error.message || "Failed to update profile")
      }
    } catch (error) {
      setErrorMessage("Error updating profile")
    }
  }

  const handleDeleteAccount = async () => {
    if (!token) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/users/profile", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Logout and redirect to home
        dispatch(logout())
        setShowDeleteDialog(false)
        router.push("/")
      } else {
        const data = await response.json()
        setErrorMessage(data.error || "Failed to delete account")
        setShowDeleteDialog(false)
      }
    } catch (err) {
      setErrorMessage("Error deleting account")
      setShowDeleteDialog(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
            <p className="text-sm md:text-base text-gray-600">Manage your profile and donations</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button onClick={() => setShowDeleteDialog(true)} variant="destructive" className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
            <Button onClick={handleLogout} variant="destructive" className="flex-1 sm:flex-none">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Profile
                </CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                {successMessage && (
                  <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm mb-4">{successMessage}</div>
                )}
                {errorMessage && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">{errorMessage}</div>
                )}
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Blood Group</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Select Blood Group</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Location</label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Last Blood Donation Date
                      </label>
                      <Input
                        type="date"
                        value={formData.lastDonationDate}
                        onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={formData.hasDisease}
                          onChange={(e) => setFormData({ ...formData, hasDisease: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Do you have any disease?</span>
                      </label>
                    </div>
                    {formData.hasDisease && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Disease Description</label>
                        <Textarea
                          placeholder="Describe any diseases or health conditions..."
                          value={formData.diseaseDescription}
                          onChange={(e) => setFormData({ ...formData, diseaseDescription: e.target.value })}
                          rows={3}
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateProfile} className="flex-1">
                        Save Changes
                      </Button>
                      <Button onClick={() => setEditMode(false)} variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-semibold">{user.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Blood Group</p>
                        <p className="font-semibold">{user.bloodGroup || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-semibold">{user.location || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold">{user.phone || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Blood Donation</p>
                        <p className="font-semibold">
                          {user.lastDonationDate
                            ? new Date(user.lastDonationDate).toLocaleDateString()
                            : "Not recorded"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Donations</p>
                        <p className="font-semibold">{user.totalDonations || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Health Status</p>
                        <p className="font-semibold">{user.hasDisease ? "Has Health Conditions" : "No known conditions"}</p>
                      </div>
                    </div>
                    {user.hasDisease && user.diseaseDescription && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm font-medium text-gray-700 mb-1">Disease Description:</p>
                        <p className="text-sm text-gray-600">{user.diseaseDescription}</p>
                      </div>
                    )}
                    <Button onClick={() => setEditMode(true)} className="w-full">
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blood Donation Requests Card */}
            <BloodDonationRequests />

            {/* Donation Image Upload Card */}
            <DonationImageUpload />

            {/* Driver Details Display Card */}
            <DriverDetailsDisplay />

            {/* Certificates Card - Using new component */}
            <UserCertificatesDisplay />
          </div>

          {/* Notifications Sidebar */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-gray-600 text-sm">No notifications yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.slice(0, 5).map((notif) => (
                    <div key={notif._id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="font-semibold text-sm">{notif.title}</p>
                      <p className="text-sm text-gray-700 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(notif.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delete Account Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">Delete Account</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <div>
                  <p className="font-semibold text-foreground mb-2">⚠️ Warning: This action cannot be undone</p>
                  <p>By deleting your account, you will permanently lose:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Your profile information</li>
                    <li>All donation records</li>
                    <li>Blood request history</li>
                    <li>Certificates</li>
                    <li>All associated data</li>
                  </ul>
                </div>
                <p className="text-sm font-medium">
                  This action will <span className="text-destructive font-bold">permanently delete</span> your account and cannot be recovered.
                </p>
                <p className="text-sm">Are you absolutely sure you want to proceed?</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end mt-4">
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
