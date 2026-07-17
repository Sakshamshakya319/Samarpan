"use client"

// Mark as dynamic to handle authentication state and redirects
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell, ArrowLeft, Phone, Truck, Clock } from "lucide-react"
import { useAppSelector } from "@/lib/store/hooks"

interface DriverDetails {
  name: string
  phone: string
  vehicleInfo?: string
  pickupTime?: string
}

interface Notification {
  _id: string
  title: string
  message: string
  createdAt: string
  read: boolean
  type?: string
  driverDetails?: DriverDetails
}

export default function NotificationsPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAppSelector((state) => state.auth)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    fetchNotifications()
    // Only fetch on mount, remove polling to prevent repeated console logs
  }, [isAuthenticated, router, token])

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
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <Clock className="w-5 h-5 animate-spin" />
          <span className="font-medium">Loading notifications...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="flex-shrink-0 bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
            <p className="text-slate-500 mt-1">Stay updated with the latest messages and alerts</p>
          </div>
        </div>

        {/* Notifications Container */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Inbox</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
              {notifications.length} Total
            </span>
          </div>

          <div className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-20 px-4 bg-slate-50/50">
                <div className="w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">You're all caught up!</h3>
                <p className="text-slate-500">
                  You have no new notifications right now.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => {
                  const isDriverNotification = notif.type === "driver_details"
                  const hasDriverDetails = notif.driverDetails && 
                    (notif.driverDetails.name || notif.driverDetails.phone)
                  
                  return (
                    <div
                      key={notif._id}
                      className={`p-6 transition-colors duration-200 ${
                        notif.read ? "bg-white" : "bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          isDriverNotification 
                            ? "bg-slate-50 border-slate-200 text-slate-700" 
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}>
                          {isDriverNotification ? (
                            <Truck className="w-5 h-5 text-slate-500" />
                          ) : (
                            <Bell className="w-5 h-5 text-slate-500" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className={`text-base pr-2 ${notif.read ? "font-medium text-slate-700" : "font-bold text-slate-900"}`}>
                              {notif.title}
                            </h3>
                            {!notif.read && (
                              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5 ring-4 ring-blue-50" />
                            )}
                          </div>
                          
                          {hasDriverDetails ? (
                            // Driver Details Display
                            <div className="space-y-4">
                              <p className="text-sm text-slate-600 leading-relaxed">{notif.message}</p>
                              
                              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                  <Truck className="w-4 h-4" />
                                  Transport Details
                                </h4>
                                
                                <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6">
                                  {notif.driverDetails?.name && (
                                    <div>
                                      <span className="text-xs text-slate-500 block mb-0.5">Driver Name</span>
                                      <span className="text-sm font-medium text-slate-900">{notif.driverDetails.name}</span>
                                    </div>
                                  )}
                                  
                                  {notif.driverDetails?.phone && (
                                    <div>
                                      <span className="text-xs text-slate-500 block mb-0.5">Contact</span>
                                      <a 
                                        href={`tel:${notif.driverDetails.phone}`}
                                        className="text-sm font-medium text-slate-900 hover:text-slate-600 flex items-center gap-1.5"
                                      >
                                        <Phone className="w-3 h-3 text-slate-400" />
                                        {notif.driverDetails.phone}
                                      </a>
                                    </div>
                                  )}
                                  
                                  {notif.driverDetails?.vehicleInfo && (
                                    <div>
                                      <span className="text-xs text-slate-500 block mb-0.5">Vehicle</span>
                                      <span className="text-sm font-medium text-slate-900">{notif.driverDetails.vehicleInfo}</span>
                                    </div>
                                  )}
                                  
                                  {notif.driverDetails?.pickupTime && (
                                    <div>
                                      <span className="text-xs text-slate-500 block mb-0.5">Estimated Arrival</span>
                                      <span className="text-sm font-medium text-slate-900">{notif.driverDetails.pickupTime}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                              {notif.message}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-slate-400">
                            {new Date(notif.createdAt).toLocaleDateString("en-US", { 
                              month: "short", 
                              day: "numeric", 
                              hour: "numeric", 
                              minute: "numeric" 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
