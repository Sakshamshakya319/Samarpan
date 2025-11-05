"use client"

export const dynamic = "force-dynamic"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AdminUsersTable } from "@/components/admin-users-table"
import { AdminSendNotification } from "@/components/admin-send-notification"
import { AdminCertificateGenerator } from "@/components/admin-certificate-generator"
import { AdminDonationsManagerEnhanced } from "@/components/admin-donations-manager-enhanced"
import { AdminEventsManager } from "@/components/admin-events-manager"
import { AdminDonationImagesViewer } from "@/components/admin-donation-images-viewer"
import { AdminBloodRequestsManager } from "@/components/admin-blood-requests-manager"
import { AdminTransportationManager } from "@/components/admin-transportation-manager"
import { AdminContactSubmissionsManager } from "@/components/admin-contact-submissions-manager"
import { AdminQRChecker } from "@/components/admin-qr-checker"
import { AdminEventDonors } from "@/components/admin-event-donors"
import { AdminBlogManager } from "@/components/admin-blog-manager"
import { AdminChangePasswordDialog } from "@/components/admin-change-password-dialog"
import { LogOut, LayoutDashboard, Calendar, Truck, Mail, QrCode, Users, BookOpen, Lock } from "lucide-react"
import { getAvailableFeatures, hasPermission } from "@/lib/admin-utils"
import { ADMIN_PERMISSIONS } from "@/lib/constants/admin-permissions"

interface Admin {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
}

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

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("users")
  const [availableFeatures, setAvailableFeatures] = useState<any>({})
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken")
    const adminEmail = localStorage.getItem("adminEmail")
    const adminRole = localStorage.getItem("adminRole")
    const adminPermissions = localStorage.getItem("adminPermissions")
    const adminName = localStorage.getItem("adminName")

    if (!adminToken || !adminEmail) {
      router.push("/admin/staff/login")
      return
    }

    const permissions = adminPermissions ? JSON.parse(adminPermissions) : []

    setToken(adminToken)
    setAdmin({
      id: "",
      email: adminEmail,
      name: adminName || "Admin",
      role: adminRole,
      permissions,
    })

    setAvailableFeatures(getAvailableFeatures(permissions))
    fetchUsers(adminToken).finally(() => setIsLoading(false))
  }, [router])

  const fetchUsers = async (adminToken: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (err) {
      console.error("Failed to load users")
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/admin-logout", { method: "POST" })
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      localStorage.removeItem("adminToken")
      localStorage.removeItem("adminEmail")
      localStorage.removeItem("adminRole")
      localStorage.removeItem("adminPermissions")
      localStorage.removeItem("adminName")
      router.push("/admin/staff/login")
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!admin) {
    return null
  }

  // Tabs configuration with permission checks
  const tabs = [
    {
      id: "users",
      label: "Users Management",
      permission: [ADMIN_PERMISSIONS.MANAGE_USERS, ADMIN_PERMISSIONS.VIEW_USERS],
      enabled: availableFeatures.users,
    },
    {
      id: "notifications",
      label: "Send Notifications",
      permission: ADMIN_PERMISSIONS.SEND_NOTIFICATIONS,
      enabled: availableFeatures.notifications,
    },
    {
      id: "certificates",
      label: "Generate Certificates",
      permission: ADMIN_PERMISSIONS.GENERATE_CERTIFICATES,
      enabled: availableFeatures.certificates,
    },
    {
      id: "donations",
      label: "Manage Donations",
      permission: [ADMIN_PERMISSIONS.MANAGE_DONATIONS, ADMIN_PERMISSIONS.VIEW_DONATIONS],
      enabled: availableFeatures.donations,
    },
    {
      id: "images",
      label: "Donation Images",
      permission: ADMIN_PERMISSIONS.VIEW_DONATION_IMAGES,
      enabled: availableFeatures.images,
    },
    {
      id: "blood-requests",
      label: "Blood Requests",
      permission: [ADMIN_PERMISSIONS.MANAGE_BLOOD_REQUESTS, ADMIN_PERMISSIONS.VIEW_BLOOD_REQUESTS],
      enabled: availableFeatures.bloodRequests,
    },
    {
      id: "events",
      label: "Events",
      permission: [ADMIN_PERMISSIONS.MANAGE_EVENTS, ADMIN_PERMISSIONS.VIEW_EVENTS],
      enabled: availableFeatures.events,
      icon: Calendar,
    },
    {
      id: "transportation",
      label: "Transportation",
      permission: [ADMIN_PERMISSIONS.MANAGE_TRANSPORTATION, ADMIN_PERMISSIONS.VIEW_TRANSPORTATION],
      enabled: availableFeatures.transportation,
      icon: Truck,
    },
    {
      id: "contacts",
      label: "Contact Submissions",
      permission: ADMIN_PERMISSIONS.VIEW_CONTACT_SUBMISSIONS,
      enabled: availableFeatures.contacts,
      icon: Mail,
    },
    {
      id: "qr-checker",
      label: "QR Checker",
      permission: ADMIN_PERMISSIONS.CHECK_QR_CODES,
      enabled: availableFeatures.qrChecker,
      icon: QrCode,
    },
    {
      id: "event-donors",
      label: "Event Donors",
      permission: ADMIN_PERMISSIONS.VIEW_EVENT_DONORS,
      enabled: availableFeatures.eventDonors,
      icon: Users,
    },
    {
      id: "blogs",
      label: "Blog Management",
      permission: [ADMIN_PERMISSIONS.MANAGE_BLOGS, ADMIN_PERMISSIONS.VIEW_BLOGS],
      enabled: availableFeatures.blogs,
      icon: BookOpen,
    },
  ]

  const enabledTabs = tabs.filter((tab) => tab.enabled)

  // If no tabs are enabled, show a message
  if (enabledTabs.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <nav className="bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Samarpan Admin</h1>
                <p className="text-xs text-muted-foreground">Administration Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{admin.email}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordDialog(true)} 
                className="gap-2 bg-transparent hidden sm:flex"
                title="Change Password"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </Button>
              <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">No Permissions Assigned</h2>
          <p className="text-muted-foreground mb-8">
            Your account has not been assigned any permissions yet. Please contact your super admin.
          </p>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Admin Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Samarpan Admin</h1>
              <p className="text-xs text-muted-foreground">Administration Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{admin.email}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordDialog(true)} 
              className="gap-2 bg-transparent hidden sm:flex"
              title="Change Password"
            >
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-border overflow-x-auto pb-2">
          {enabledTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "users" && enabledTabs.some((t) => t.id === "users") && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminUsersTable token={token} />}
          </div>
        )}

        {activeTab === "notifications" && enabledTabs.some((t) => t.id === "notifications") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>{token && <AdminSendNotification users={users} token={token} />}</div>
          </div>
        )}

        {activeTab === "certificates" && enabledTabs.some((t) => t.id === "certificates") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>{token && <AdminCertificateGenerator users={users} token={token} />}</div>
          </div>
        )}

        {activeTab === "donations" && enabledTabs.some((t) => t.id === "donations") && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminDonationsManagerEnhanced token={token} />}
          </div>
        )}

        {activeTab === "images" && enabledTabs.some((t) => t.id === "images") && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminDonationImagesViewer token={token} />}
          </div>
        )}

        {activeTab === "blood-requests" && enabledTabs.some((t) => t.id === "blood-requests") && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminBloodRequestsManager token={token} />}
          </div>
        )}

        {activeTab === "events" && enabledTabs.some((t) => t.id === "events") && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminEventsManager token={token} />}
          </div>
        )}

        {activeTab === "transportation" && enabledTabs.some((t) => t.id === "transportation") && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminTransportationManager token={token} />}
          </div>
        )}

        {activeTab === "contacts" && enabledTabs.some((t) => t.id === "contacts") && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminContactSubmissionsManager token={token} />}
          </div>
        )}

        {activeTab === "qr-checker" && enabledTabs.some((t) => t.id === "qr-checker") && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminQRChecker token={token} />}
          </div>
        )}

        {activeTab === "event-donors" && enabledTabs.some((t) => t.id === "event-donors") && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminEventDonors token={token} />}
          </div>
        )}

        {activeTab === "blogs" && enabledTabs.some((t) => t.id === "blogs") && (
          <div className="grid grid-cols-1 gap-6">
            <AdminBlogManager />
          </div>
        )}
      </div>

      {/* Password Change Dialog */}
      {token && admin && (
        <AdminChangePasswordDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          adminEmail={admin.email}
          token={token}
        />
      )}
    </main>
  )
}