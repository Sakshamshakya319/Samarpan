"use client"

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
import { LogOut, LayoutDashboard, Calendar, Truck } from "lucide-react"

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

export default function AdminPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("users")

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken")
    const adminEmail = localStorage.getItem("adminEmail")

    if (!adminToken || !adminEmail) {
      router.push("/admin/login")
      return
    }

    setToken(adminToken)
    setAdmin({
      id: "",
      email: adminEmail,
      name: "Admin",
      role: "admin",
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
      </div>
    </main>
  )
}
