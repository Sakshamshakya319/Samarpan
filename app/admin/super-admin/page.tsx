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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Samarpan Super Admin</h1>
              <p className="text-xs text-muted-foreground">Full System Control</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{admin.email}</p>
              <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                Super Admin
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordDialog(true)} 
                className="gap-2 bg-transparent"
                title="Change Password"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Change Password</span>
              </Button>
              <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab("admin-accounts")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "admin-accounts"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin Management
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${
              activeTab === "users"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Users Management
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${
              activeTab === "notifications"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Send Notifications
          </button>
          <button
            onClick={() => setActiveTab("certificates")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${
              activeTab === "certificates"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Generate Certificates
          </button>
          <button
            onClick={() => setActiveTab("funds")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "funds"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            Funds Collected
          </button>
          <button
            onClick={() => setActiveTab("donations")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${
              activeTab === "donations"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Manage Donations
          </button>
          <button
            onClick={() => setActiveTab("images")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${
              activeTab === "images"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Donation Images
          </button>
          <button
            onClick={() => setActiveTab("blood-requests")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${
              activeTab === "blood-requests"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Blood Requests
          </button>
          <button
            onClick={() => setActiveTab("blood-history")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "blood-history"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="w-4 h-4" />
            Blood History
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "events"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Events
          </button>
          <button
            onClick={() => setActiveTab("transportation")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "transportation"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Truck className="w-4 h-4" />
            Transportation
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "contacts"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="w-4 h-4" />
            Contact Submissions
          </button>
          <button
            onClick={() => setActiveTab("qr-checker")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "qr-checker"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Checker
          </button>
          <button
            onClick={() => setActiveTab("event-donors")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "event-donors"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Event Donors
          </button>
          <button
            onClick={() => setActiveTab("blogs")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "blogs"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Blog Management
          </button>
          <button
            onClick={() => setActiveTab("action-history")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "action-history"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="w-4 h-4" />
            Action History
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "maintenance"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="w-4 h-4" />
            Maintenance
          </button>
        </div>
      </div>

        {/* Tab Content */}
        {activeTab === "admin-accounts" && (
          <div className="grid grid-cols-1 gap-6">
            {token && <AdminAdminManager token={token} />}
          </div>
        )}

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