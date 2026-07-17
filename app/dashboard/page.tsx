"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Bell, 
  LogOut, 
  User, 
  Calendar, 
  Trash2, 
  Lock, 
  Zap, 
  Activity, 
  Heart, 
  Award, 
  Menu, 
  X, 
  Droplet
} from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { fetchUserProfile, updateUserProfile } from "@/lib/slices/userSlice"
import { logout, loginSuccess } from "@/lib/slices/authSlice"
import { SamarpanFullscreenLoader } from "@/components/shared/samarpan-loader"
import { BloodDonationRequests } from "@/components/features/blood-donation-requests"
import { DonationImageUpload } from "@/components/features/donation-image-upload"
import { DriverDetailsDisplay } from "@/components/features/driver-details-display"
import { UserCertificatesDisplay } from "@/components/user/user-certificates-display"
import { UserEventRegistrations } from "@/components/user/user-event-registrations"
import { UserChangePasswordDialog } from "@/components/user/user-change-password-dialog"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"

interface Notification {
  _id: string
  title: string
  message: string
  createdAt: string
}

const SIDEBAR_CATEGORIES = [
  {
    title: "OVERVIEW",
    items: [
      { id: "profile", label: "Profile Settings", icon: User },
    ]
  },
  {
    title: "ACTIVITY",
    items: [
      { id: "requests", label: "Blood Requests", icon: Activity },
      { id: "donations", label: "Donations & Tracking", icon: Droplet },
    ]
  },
  {
    title: "ENGAGEMENT",
    items: [
      { id: "events", label: "Events", icon: Calendar },
      { id: "certificates", label: "Certificates", icon: Award },
      { id: "notifications", label: "Notifications", icon: Bell },
    ]
  }
];

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const { token, isAuthenticated } = useAppSelector((state) => state.auth)
  const { data: user, isLoading } = useAppSelector((state) => state.user)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [editMode, setEditMode] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [authProcessed, setAuthProcessed] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userDashboardTab") || "profile";
    }
    return "profile";
  });

  const [formData, setFormData] = useState({
    name: "",
    bloodGroup: "",
    location: "",
    phone: "",
    lastDonationDate: "",
    hasDisease: false,
    diseaseDescription: "",
  })

  // Handle Google auth callback parameters
  useEffect(() => {
    const authParam = searchParams.get("auth")
    const tokenParam = searchParams.get("token")
    const userParam = searchParams.get("user")

    if (authParam === "success" && tokenParam && userParam && !authProcessed) {
      try {
        const decodedToken = decodeURIComponent(tokenParam)
        const decodedUser = JSON.parse(decodeURIComponent(userParam))
        
        localStorage.setItem("token", decodedToken)
        localStorage.setItem("user", JSON.stringify(decodedUser))
        
        dispatch(loginSuccess({ token: decodedToken, user: decodedUser }))
        setAuthProcessed(true)
        
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete("auth")
        newUrl.searchParams.delete("token")
        newUrl.searchParams.delete("user")
        window.history.replaceState({}, "", newUrl.toString())
        
      } catch (error) {
        router.push("/login?error=Authentication failed")
        return
      }
    }
  }, [searchParams, dispatch, router, authProcessed])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("userDashboardTab", activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isMounted) return

    const localToken = localStorage.getItem("token")
    const hasAuth = isAuthenticated || !!localToken || authProcessed

    if (!hasAuth) {
      router.push("/login")
      return
    }

    if (hasAuth) {
      dispatch(fetchUserProfile())
    }
  }, [isAuthenticated, token, router, dispatch, isMounted, authProcessed])

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

  const authParam = searchParams.get("auth")
  const isProcessingAuth = authParam === "success" && !authProcessed
  const localToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null
  const hasAuth = isAuthenticated || !!localToken || authProcessed

  if (!isMounted || isProcessingAuth) {
    return <SamarpanFullscreenLoader message={isProcessingAuth ? "Finalizing login..." : "Loading dashboard..."} showIcon={false} />
  }

  if (!hasAuth) {
    return <SamarpanFullscreenLoader message="Redirecting to login..." showIcon={false} />
  }

  if (isLoading || !user) {
    return <SamarpanFullscreenLoader message="Loading user profile..." showIcon={false} />
  }

  const unreadCount = notifications.length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-slate-200 flex flex-col h-screen
        transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 flex-shrink-0">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src="/samarpan.png" alt="Samarpan Logo" className="w-8 h-8 rounded mr-3" />
            <span className="font-bold text-slate-900 text-lg tracking-tight">Samarpan</span>
          </Link>
          <button className="ml-auto lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 scrollbar-thin">
          {SIDEBAR_CATEGORIES.map((category, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {category.title}
              </h3>
              <div className="space-y-1">
                {category.items.map((item) => {
                  const isActive = activeTab === item.id
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id)
                        setIsSidebarOpen(false)
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-red-50 text-red-600' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                        {item.label}
                      </div>
                      {item.id === "notifications" && unreadCount > 0 && (
                        <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-slate-500 hover:text-slate-900"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate hidden sm:block">
              Welcome back, {user.name.split(' ')[0]}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/sos" className="hidden sm:flex">
              <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden lg:inline">SOS Emergency</span>
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPasswordDialog(true)} 
              className="hidden md:flex border-slate-200 text-slate-600"
            >
              <Lock className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Password</span>
            </Button>
            
            <Button 
              variant="default" 
              size="sm"
              onClick={handleLogout} 
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Content Render Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Tab Rendering */}
            
            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-red-600" />
                        Profile Details
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">Manage your personal information</p>
                    </div>
                    {!editMode && (
                      <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                        Edit Profile
                      </Button>
                    )}
                  </div>
                  
                  {successMessage && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm mb-6">{successMessage}</div>
                  )}
                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-6">{errorMessage}</div>
                  )}
                  
                  {editMode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700">Name</label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700">Blood Group</label>
                        <select
                          value={formData.bloodGroup}
                          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
                        <label className="block text-sm font-medium mb-1 text-slate-700">Location</label>
                        <Input
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700">Phone</label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 flex items-center gap-2">
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
                            className="w-4 h-4 text-red-600 rounded border-slate-300"
                          />
                          <span className="text-sm font-medium text-slate-700">Do you have any disease?</span>
                        </label>
                      </div>
                      {formData.hasDisease && (
                        <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700">Disease Description</label>
                          <Textarea
                            placeholder="Describe any diseases or health conditions..."
                            value={formData.diseaseDescription}
                            onChange={(e) => setFormData({ ...formData, diseaseDescription: e.target.value })}
                            rows={3}
                          />
                        </div>
                      )}
                      <div className="flex gap-3 pt-4">
                        <Button onClick={handleUpdateProfile} className="bg-slate-900 hover:bg-slate-800 text-white">
                          Save Changes
                        </Button>
                        <Button onClick={() => setEditMode(false)} variant="outline">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Name</p>
                        <p className="font-semibold text-slate-900 mt-1">{user.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Email</p>
                        <p className="font-semibold text-slate-900 mt-1">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Blood Group</p>
                        <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          {user.bloodGroup || "Not set"}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Location</p>
                        <p className="font-medium text-slate-900 mt-1">{user.location || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Phone</p>
                        <p className="font-medium text-slate-900 mt-1">{user.phone || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Last Blood Donation</p>
                        <p className="font-medium text-slate-900 mt-1">
                          {user.lastDonationDate
                            ? new Date(user.lastDonationDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                            : "Not recorded"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Total Donations</p>
                        <p className="font-medium text-slate-900 mt-1">{user.totalDonations || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Health Status</p>
                        <p className="font-medium text-slate-900 mt-1">{user.hasDisease ? "Has Health Conditions" : "No known conditions"}</p>
                      </div>
                      {user.hasDisease && user.diseaseDescription && (
                        <div className="col-span-1 sm:col-span-2 p-4 bg-orange-50 rounded-lg border border-orange-100 mt-2">
                          <p className="text-sm font-medium text-orange-900 mb-1">Disease Description:</p>
                          <p className="text-sm text-orange-800">{user.diseaseDescription}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button onClick={() => setShowDeleteDialog(true)} variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </>
            )}

            {/* REQUESTS TAB */}
            {activeTab === "requests" && (
              <div className="space-y-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">Blood Requests</h2>
                  <p className="text-sm text-slate-500">Manage your active and past blood donation requests.</p>
                </div>
                <BloodDonationRequests />
              </div>
            )}

            {/* DONATIONS TAB */}
            {activeTab === "donations" && (
              <div className="space-y-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">Donations & Tracking</h2>
                  <p className="text-sm text-slate-500">Track incoming blood donations, driver details, and upload donation images.</p>
                </div>
                <DriverDetailsDisplay />
                <DonationImageUpload />
              </div>
            )}

            {/* EVENTS TAB */}
            {activeTab === "events" && (
              <div className="space-y-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">Event Registrations</h2>
                  <p className="text-sm text-slate-500">View and manage the NGO events and blood camps you have registered for.</p>
                </div>
                <UserEventRegistrations />
              </div>
            )}

            {/* CERTIFICATES TAB */}
            {activeTab === "certificates" && (
              <div className="space-y-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">My Certificates</h2>
                  <p className="text-sm text-slate-500">View and download your earned blood donation certificates.</p>
                </div>
                <UserCertificatesDisplay />
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
                  <p className="text-sm text-slate-500">Your recent alerts and messages.</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No notifications yet</p>
                      <p className="text-sm text-slate-400 mt-1">We'll let you know when something important happens.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notif) => (
                        <div key={notif._id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="font-semibold text-slate-900">{notif.title}</p>
                          <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-slate-400 mt-3 font-medium">{new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Account</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>
                <p className="font-semibold text-slate-900 mb-2">⚠️ Warning: This action cannot be undone</p>
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
                This action will <span className="text-red-600 font-bold">permanently delete</span> your account and cannot be recovered.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Change Dialog */}
      {token && user && (
        <UserChangePasswordDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          userEmail={user.email}
          token={token}
        />
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<SamarpanFullscreenLoader message="Loading dashboard..." showIcon={false} />}>
      <DashboardContent />
    </Suspense>
  )
}