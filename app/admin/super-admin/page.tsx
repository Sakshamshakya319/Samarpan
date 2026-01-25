"use client"

export const dynamic = "force-dynamic"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AdminUsersTable } from "@/components/admin-users-table"
import { AdminSendNotification } from "@/components/admin-send-notification"
import { AdminCertificateGenerator } from "@/components/admin-certificate-generator"
import { AdminDonationsManagerEnhanced } from "@/components/admin-donations-manager-enhanced"
import { AdminFundingDonations } from "@/components/admin-funding-donations"
import { AdminEventsManager } from "@/components/admin-events-manager"
import { AdminDonationImagesViewer } from "@/components/admin-donation-images-viewer"
import { AdminBloodRequestsManager } from "@/components/admin-blood-requests-manager"
import { AdminTransportationManager } from "@/components/admin-transportation-manager"
import { AdminContactSubmissionsManager } from "@/components/admin-contact-submissions-manager"
import { AdminQRChecker } from "@/components/admin-qr-checker"
import { AdminEventDonors } from "@/components/admin-event-donors"
import { AdminBloodHistory } from "@/components/admin-blood-history"
import { AdminAdminManager } from "@/components/admin-admin-manager"
import { AdminBlogManager } from "@/components/admin-blog-manager"
import { AdminActionHistory } from "@/components/admin-action-history"
import { AdminChangePasswordDialog } from "@/components/admin-change-password-dialog"
import { AdminNGOApplicationsManager } from "@/components/admin-ngo-applications-manager"
import { AdminNGOEventsManager } from "@/components/admin-ngo-events-manager"
import { MaintenanceModeManager } from "@/components/maintenance-mode-manager"
import {
  LogOut,
  LayoutDashboard,
  Calendar,
  Truck,
  Mail,
  QrCode,
  Users,
  Shield,
  BookOpen,
  Lock,
  History,
  IndianRupee,
  Building,
} from "lucide-react"

interface Admin {
  id: string
  email: string
  name: string
  role: string
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

export default function SuperAdminPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("superAdminActiveTab") || "admins";
    }
    return "admins";
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("superAdminActiveTab", activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken")
    const adminEmail = localStorage.getItem("adminEmail")
    const adminRole = localStorage.getItem("adminRole")

    if (!adminToken || !adminEmail) {
      router.push("/admin/login")
      return
    }

    // Check if admin is superadmin
    if (adminRole !== "superadmin") {
      router.push("/admin/dashboard")
      return
    }

    setToken(adminToken)
    setAdmin({
      id: "",
      email: adminEmail,
      name: "Super Admin",
      role: "superadmin",
    })

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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 xs:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-lg sm:text-xl lg:text-2xl font-bold text-primary">Samarpan Super Admin</h1>
                <p className="text-xs text-muted-foreground hidden xs:block">Full System Control</p>
              </div>
            </div>
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-3 sm:gap-4">
              <div className="text-left xs:text-right">
                <p className="text-xs sm:text-sm font-medium truncate max-w-[200px]">{admin.email}</p>
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                  Super Admin
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPasswordDialog(true)} 
                  className="gap-1 xs:gap-2 bg-transparent h-8 px-2 xs:h-9 xs:px-3"
                  title="Change Password"
                >
                  <Lock className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span className="hidden sm:inline text-xs xs:text-sm">Change Password</span>
                  <span className="sm:hidden text-xs">Password</span>
                </Button>
                <Button variant="outline" onClick={handleLogout} className="gap-1 xs:gap-2 bg-transparent h-8 px-2 xs:h-9 xs:px-3">
                  <LogOut className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span className="hidden xs:inline text-xs xs:text-sm">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Tab Navigation */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 sm:gap-3 lg:gap-4 pb-2 border-b border-border min-w-max">
              <button
                onClick={() => setActiveTab("admin-accounts")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                  activeTab === "admin-accounts"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Shield className="w-3 h-3 xs:w-4 xs:h-4" />
                <span className="hidden xs:inline">Admin Management</span>
                <span className="xs:hidden">Admins</span>
              </button>
              <button
                onClick={() => setActiveTab("ngo-applications")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                  activeTab === "ngo-applications"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building className="w-3 h-3 xs:w-4 xs:h-4" />
                <span className="hidden xs:inline">NGO Applications</span>
                <span className="xs:hidden">NGOs</span>
              </button>
              <button
                onClick={() => setActiveTab("ngo-events")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                  activeTab === "ngo-events"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="w-3 h-3 xs:w-4 xs:h-4" />
                <span className="hidden xs:inline">NGO Events</span>
                <span className="xs:hidden">Events</span>
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap text-xs xs:text-sm ${
                  activeTab === "users"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="hidden xs:inline">Users Management</span>
                <span className="xs:hidden">Users</span>
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap text-xs xs:text-sm ${
                  activeTab === "notifications"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="hidden xs:inline">Send Notifications</span>
                <span className="xs:hidden">Notify</span>
              </button>
              <button
                onClick={() => setActiveTab("certificates")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap text-xs xs:text-sm ${
                  activeTab === "certificates"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="hidden xs:inline">Generate Certificates</span>
                <span className="xs:hidden">Certs</span>
              </button>
              <button
                onClick={() => setActiveTab("funds")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                  activeTab === "funds"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <IndianRupee className="w-3 h-3 xs:w-4 xs:h-4" />
                <span className="hidden xs:inline">Funds Collected</span>
                <span className="xs:hidden">Funds</span>
              </button>
              <button
                onClick={() => setActiveTab("donations")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap text-xs xs:text-sm ${
                  activeTab === "donations"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="hidden xs:inline">Manage Donations</span>
                <span className="xs:hidden">Donations</span>
              </button>
              <button
                onClick={() => setActiveTab("images")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap text-xs xs:text-sm ${
                  activeTab === "images"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="hidden xs:inline">Donation Images</span>
                <span className="xs:hidden">Images</span>
              </button>
              <button
                onClick={() => setActiveTab("blood-requests")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap text-xs xs:text-sm ${
                  activeTab === "blood-requests"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="hidden xs:inline">Blood Requests</span>
                <span className="xs:hidden">Requests</span>
              </button>
              <button
                onClick={() => setActiveTab("blood-history")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                  activeTab === "blood-history"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <History className="w-3 h-3 xs:w-4 xs:h-4" />
                <span className="hidden xs:inline">Blood History</span>
                <span className="xs:hidden">History</span>
              </button>
              <button
                onClick={() => setActiveTab("events")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                  activeTab === "events"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="w-3 h-3 xs:w-4 xs:h-4" />
                <span>Events</span>
              </button>
              <button
                onClick={() => setActiveTab("transportation")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                  activeTab === "transportation"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Truck className="w-3 h-3 xs:w-4 xs:h-4" />
                <span className="hidden xs:inline">Transportation</span>
                <span className="xs:hidden">Transport</span>
              </button>
              <button
                onClick={() => setActiveTab("contacts")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                  activeTab === "contacts"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail className="w-3 h-3 xs:w-4 xs:h-4" />
                <span className="hidden xs:inline">Contact Submissions</span>
                <span className="xs:hidden">Contacts</span>
              </button>
              <button
                onClick={() => setActiveTab("qr-checker")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                  activeTab === "qr-checker"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <QrCode className="w-3 h-3 xs:w-4 xs:h-4" />
                <span className="hidden xs:inline">QR Checker</span>
                <span className="xs:hidden">QR</span>
              </button>
              <button
                onClick={() => setActiveTab("event-donors")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                  activeTab === "event-donors"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="w-3 h-3 xs:w-4 xs:h-4" />
                <span className="hidden xs:inline">Event Donors</span>
                <span className="xs:hidden">Donors</span>
              </button>
              <button
                onClick={() => setActiveTab("blogs")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                  activeTab === "blogs"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="w-3 h-3 xs:w-4 xs:h-4" />
                <span className="hidden xs:inline">Blog Management</span>
                <span className="xs:hidden">Blogs</span>
              </button>
              <button
                onClick={() => setActiveTab("action-history")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                  activeTab === "action-history"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <History className="w-3 h-3 xs:w-4 xs:h-4" />
                <span className="hidden xs:inline">Action History</span>
                <span className="xs:hidden">Actions</span>
              </button>
              <button
                onClick={() => setActiveTab("maintenance")}
                className={`px-2 xs:px-3 sm:px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                  activeTab === "maintenance"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Lock className="w-3 h-3 xs:w-4 xs:h-4" />
                <span className="hidden xs:inline">Maintenance</span>
                <span className="xs:hidden">Maint</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "admin-accounts" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminAdminManager token={token} />}
          </div>
        )}

        {activeTab === "ngo-applications" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminNGOApplicationsManager token={token} />}
          </div>
        )}

        {activeTab === "ngo-events" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminNGOEventsManager token={token} />}
          </div>
        )}

        {activeTab === "users" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminUsersTable token={token} />}
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="w-full">
            {token && <AdminSendNotification users={users} token={token} />}
          </div>
        )}

        {activeTab === "certificates" && (
          <div className="w-full">
            {token && <AdminCertificateGenerator users={users} token={token} />}
          </div>
        )}

        {activeTab === "funds" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminFundingDonations token={token} />}
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

        {activeTab === "qr-checker" && (
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
            <AdminBlogManager />
          </div>
        )}
        {activeTab === "action-history" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminActionHistory token={token} />}
          </div>
        )}
        {activeTab === "maintenance" && (
          <div className="grid grid-cols-1 gap-6">
            <MaintenanceModeManager />
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