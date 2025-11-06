"use client"

// Mark as dynamic to handle admin authentication and redirects
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
import { AdminBloodHistory } from "@/components/admin-blood-history"
import { AdminTransportationManager } from "@/components/admin-transportation-manager"
import { AdminContactSubmissionsManager } from "@/components/admin-contact-submissions-manager"
import { AdminQRChecker } from "@/components/admin-qr-checker"
import { AdminEventDonors } from "@/components/admin-event-donors"
import { AdminBlogManager } from "@/components/admin-blog-manager"
import { LogOut, LayoutDashboard, Calendar, Truck, Mail, QrCode, Users, BookOpen, Droplets } from "lucide-react"
import { ADMIN_PERMISSIONS } from "@/lib/constants/admin-permissions"

interface Admin {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
}

interface TabConfig {
  id: string
  label: string
  icon?: React.ReactNode
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

export default function AdminPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("")
  const [availableTabs, setAvailableTabs] = useState<TabConfig[]>([])

  const tabConfigs: TabConfig[] = [
    {
      id: "users",
      label: "Users Management",
      permissions: [ADMIN_PERMISSIONS.VIEW_USERS],
    },
    {
      id: "notifications",
      label: "Send Notifications",
      permissions: [ADMIN_PERMISSIONS.SEND_NOTIFICATIONS],
    },
    {
      id: "certificates",
      label: "Generate Certificates",
      permissions: [ADMIN_PERMISSIONS.GENERATE_CERTIFICATES],
    },
    {
      id: "donations",
      label: "Manage Donations",
      permissions: [ADMIN_PERMISSIONS.VIEW_DONATIONS],
    },
    {
      id: "images",
      label: "Donation Images",
      permissions: [ADMIN_PERMISSIONS.VIEW_DONATION_IMAGES],
    },
    {
      id: "blood-requests",
      label: "Blood Requests",
      permissions: [ADMIN_PERMISSIONS.VIEW_BLOOD_REQUESTS],
    },
    {
      id: "blood-history",
      label: "Blood History",
      permissions: [ADMIN_PERMISSIONS.VIEW_BLOOD_REQUESTS],
    },
    {
      id: "events",
      label: "Events",
      icon: <Calendar className="w-4 h-4" />,
      permissions: [ADMIN_PERMISSIONS.VIEW_EVENTS],
    },
    {
      id: "transportation",
      label: "Transportation",
      icon: <Truck className="w-4 h-4" />,
      permissions: [ADMIN_PERMISSIONS.VIEW_TRANSPORTATION],
    },
    {
      id: "contacts",
      label: "Contact Submissions",
      icon: <Mail className="w-4 h-4" />,
      permissions: [ADMIN_PERMISSIONS.VIEW_CONTACT_SUBMISSIONS],
    },
    {
      id: "token-verifier",
      label: "Token Verifier",
      icon: <QrCode className="w-4 h-4" />,
      permissions: [ADMIN_PERMISSIONS.CHECK_QR_CODES],
    },
    {
      id: "event-donors",
      label: "Event Donors",
      icon: <Users className="w-4 h-4" />,
      permissions: [ADMIN_PERMISSIONS.VIEW_EVENT_DONORS],
    },
    {
      id: "blogs",
      label: "Blog Management",
      icon: <BookOpen className="w-4 h-4" />,
      permissions: [ADMIN_PERMISSIONS.MANAGE_BLOGS, ADMIN_PERMISSIONS.VIEW_BLOGS],
    },
    {
      id: "blood-history",
      label: "Blood Donation History",
      icon: <Droplets className="w-4 h-4" />,
      permissions: [ADMIN_PERMISSIONS.VIEW_DONATIONS],
    },
  ]

  const hasPermission = (permissions: string[], adminPermissions: string[]): boolean => {
    if (adminPermissions.length === 0) return false
    return permissions.some((permission) => adminPermissions.includes(permission))
  }

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken")
    const adminEmail = localStorage.getItem("adminEmail")
    const adminRole = localStorage.getItem("adminRole")
    const adminPermissionsStr = localStorage.getItem("adminPermissions")

    if (!adminToken || !adminEmail) {
      router.push("/admin/login")
      return
    }

    // Redirect based on role
    if (adminRole === "superadmin") {
      router.push("/admin/super-admin")
      return
    } else if (adminRole && adminRole !== "admin") {
      // For other roles (if added in future)
      router.push("/admin/dashboard")
      return
    }

    let permissions: string[] = []
    try {
      permissions = adminPermissionsStr ? JSON.parse(adminPermissionsStr) : []
    } catch (err) {
      console.error("Failed to parse admin permissions:", err)
    }

    const adminData: Admin = {
      id: "",
      email: adminEmail,
      name: "Admin",
      role: adminRole || "admin",
      permissions,
    }

    setAdmin(adminData)
    setToken(adminToken)

    // Filter tabs based on permissions
    const filtered = tabConfigs.filter((tab) =>
      hasPermission(tab.permissions, permissions)
    )
    setAvailableTabs(filtered)

    // Set the first available tab as active, or redirect if no tabs available
    if (filtered.length > 0) {
      setActiveTab(filtered[0].id)
    }

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
      // Call logout endpoint to clear cookie
      await fetch("/api/auth/admin-logout", { method: "POST" })
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      // Clear localStorage
      localStorage.removeItem("adminToken")
      localStorage.removeItem("adminEmail")
      router.push("/admin/login")
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!admin) {
    return null
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
          {availableTabs.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No features available with your current permissions
            </div>
          ) : (
            availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "users" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminUsersTable token={token} />}
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>{token && <AdminSendNotification users={users} token={token} />}</div>
          </div>
        )}

        {activeTab === "certificates" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>{token && <AdminCertificateGenerator users={users} token={token} />}</div>
          </div>
        )}

        {activeTab === "donations" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminDonationsManagerEnhanced token={token} />}
          </div>
        )}

        {activeTab === "images" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminDonationImagesViewer token={token} />}
          </div>
        )}

        {activeTab === "blood-requests" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminBloodRequestsManager token={token} />}
          </div>
        )}

        {activeTab === "blood-history" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminBloodHistory token={token} />}
          </div>
        )}

        {activeTab === "events" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminEventsManager token={token} />}
          </div>
        )}

        {activeTab === "transportation" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminTransportationManager token={token} />}
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminContactSubmissionsManager token={token} />}
          </div>
        )}

        {activeTab === "token-verifier" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminQRChecker token={token} />}
          </div>
        )}

        {activeTab === "event-donors" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminEventDonors token={token} />}
          </div>
        )}

        {activeTab === "blogs" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminBlogManager token={token} />}
          </div>
        )}

        {activeTab === "blood-history" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminBloodHistory token={token} />}
          </div>
        )}
      </div>
    </main>
  )
}
