"use client"

export const dynamic = "force-dynamic"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AdminUsersTable } from "@/components/admin/admin-users-table"
import { AdminSendNotification } from "@/components/admin/admin-send-notification"
import { AdminCertificateGenerator } from "@/components/admin/admin-certificate-generator"
import { AdminDonationsManagerEnhanced } from "@/components/admin/admin-donations-manager-enhanced"
import { AdminFundingDonations } from "@/components/admin/admin-funding-donations"
import { AdminEventsManager } from "@/components/admin/admin-events-manager"
import { AdminDonationImagesViewer } from "@/components/admin/admin-donation-images-viewer"
import { AdminBloodRequestsManager } from "@/components/admin/admin-blood-requests-manager"
import { AdminTransportationManager } from "@/components/admin/admin-transportation-manager"
import { AdminContactSubmissionsManager } from "@/components/admin/admin-contact-submissions-manager"
import { AdminQRChecker } from "@/components/admin/admin-qr-checker"
import { AdminEventDonors } from "@/components/admin/admin-event-donors"
import { AdminBloodHistory } from "@/components/admin/admin-blood-history"
import { AdminAdminManager } from "@/components/admin/admin-admin-manager"
import { AdminBlogManager } from "@/components/admin/admin-blog-manager"
import { AdminActionHistory } from "@/components/admin/admin-action-history"
import { AdminChangePasswordDialog } from "@/components/admin/admin-change-password-dialog"
import { AdminNGOApplicationsManager } from "@/components/admin/admin-ngo-applications-manager"
import { AdminNGOEventsManager } from "@/components/admin/admin-ngo-events-manager"
import { MaintenanceModeManager } from "@/components/layout/maintenance-mode-manager"
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
  Menu,
  X,
  Droplet,
  Image as ImageIcon,
  Activity,
  Heart,
  Award,
  Bell
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

const SIDEBAR_CATEGORIES = [
  {
    title: "SYSTEM",
    items: [
      { id: "admin-accounts", label: "Admin Management", icon: Shield },
      { id: "users", label: "Users Management", icon: Users },
      { id: "maintenance", label: "Maintenance", icon: Lock },
    ]
  },
  {
    title: "DONATIONS",
    items: [
      { id: "blood-requests", label: "Blood Requests", icon: Activity },
      { id: "donations", label: "Manage Donations", icon: Heart },
      { id: "blood-history", label: "Blood History", icon: History },
      { id: "funds", label: "Funds Collected", icon: IndianRupee },
      { id: "images", label: "Donation Images", icon: ImageIcon },
    ]
  },
  {
    title: "NGO",
    items: [
      { id: "ngo-applications", label: "NGO Applications", icon: Building },
      { id: "ngo-events", label: "NGO Events", icon: Calendar },
    ]
  },
  {
    title: "EVENTS & CAMPS",
    items: [
      { id: "events", label: "Events", icon: Calendar },
      { id: "event-donors", label: "Event Donors", icon: Users },
      { id: "transportation", label: "Transportation", icon: Truck },
    ]
  },
  {
    title: "CONTENT & TOOLS",
    items: [
      { id: "blogs", label: "Blog Management", icon: BookOpen },
      { id: "certificates", label: "Generate Certificates", icon: Award },
      { id: "notifications", label: "Send Notifications", icon: Bell },
      { id: "qr-checker", label: "QR Checker", icon: QrCode },
      { id: "contacts", label: "Contact Submissions", icon: Mail },
      { id: "action-history", label: "Action History", icon: History },
    ]
  }
];

export default function SuperAdminPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("superAdminActiveTab") || "admin-accounts";
    }
    return "admin-accounts";
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

  // Get active tab label for header
  const getActiveTabLabel = () => {
    for (const category of SIDEBAR_CATEGORIES) {
      const found = category.items.find(item => item.id === activeTab)
      if (found) return found.label
    }
    return "Dashboard"
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!admin) {
    return null
  }

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
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center mr-3">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">Super Admin</span>
          <button className="ml-auto lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
          {SIDEBAR_CATEGORIES.map((category, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
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
                        w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-red-50 text-red-600' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                      {item.label}
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
            <h1 className="text-xl font-semibold text-slate-900 hidden sm:block">
              {getActiveTabLabel()}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-slate-700">{admin.email}</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPasswordDialog(true)} 
              className="hidden sm:flex border-slate-200 text-slate-600"
            >
              <Lock className="w-4 h-4 mr-2" />
              Password
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
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 sm:p-6 min-h-[calc(100vh-8rem)]">
              {/* Tab Rendering */}
              {activeTab === "admin-accounts" && token && <AdminAdminManager token={token} />}
              {activeTab === "ngo-applications" && token && <AdminNGOApplicationsManager token={token} />}
              {activeTab === "ngo-events" && token && <AdminNGOEventsManager token={token} />}
              {activeTab === "users" && token && <AdminUsersTable token={token} />}
              {activeTab === "notifications" && token && <div className="w-full"><AdminSendNotification users={users} token={token} /></div>}
              {activeTab === "certificates" && token && <div className="w-full"><AdminCertificateGenerator users={users} token={token} /></div>}
              {activeTab === "funds" && token && <AdminFundingDonations token={token} />}
              {activeTab === "donations" && token && <AdminDonationsManagerEnhanced token={token} />}
              {activeTab === "images" && token && <AdminDonationImagesViewer token={token} />}
              {activeTab === "blood-requests" && token && <AdminBloodRequestsManager token={token} />}
              {activeTab === "blood-history" && token && <AdminBloodHistory token={token} />}
              {activeTab === "events" && token && <AdminEventsManager token={token} />}
              {activeTab === "transportation" && token && <AdminTransportationManager token={token} />}
              {activeTab === "contacts" && token && <AdminContactSubmissionsManager token={token} />}
              {activeTab === "qr-checker" && token && <AdminQRChecker token={token} />}
              {activeTab === "event-donors" && token && <AdminEventDonors token={token} />}
              {activeTab === "blogs" && <AdminBlogManager />}
              {activeTab === "action-history" && token && <AdminActionHistory token={token} />}
              {activeTab === "maintenance" && <MaintenanceModeManager />}
            </div>
          </div>
        </main>
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
    </div>
  )
}