"use client"

// Mark as dynamic to handle authentication state and redirects
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, ArrowLeft, Phone, Truck, Clock } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"

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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">All your notifications in one place</p>
          </div>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              All Notifications ({notifications.length})
            </CardTitle>
            <CardDescription>Stay updated with the latest messages from Samarpan</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => {
                  const isDriverNotification = notif.type === "driver_details"
                  const hasDriverDetails = notif.driverDetails && 
                    (notif.driverDetails.name || notif.driverDetails.phone)
                  
                  return (
                  <div
                    key={notif._id}
                    className={`p-4 rounded-lg border-2 transition ${
                      notif.read 
                        ? "bg-gray-50 border-gray-200" 
                        : isDriverNotification 
                          ? "bg-green-50 border-green-300" 
                          : "bg-red-50 border-red-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-lg">{notif.title}</p>
                          {isDriverNotification && (
                            <Truck className="w-5 h-5 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        
                        {hasDriverDetails ? (
                          // Driver Details Display
                          <div className="mt-3 space-y-3 bg-white rounded-lg p-3 border border-green-200">
                            <p className="text-gray-700 text-sm">{notif.message}</p>
                            
                            <div className="space-y-2 pt-2 border-t border-green-100">
                              {notif.driverDetails?.name && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-700 text-sm">Driver:</span>
                                  <span className="text-gray-900 text-sm">{notif.driverDetails.name}</span>
                                </div>
                              )}
                              
                              {notif.driverDetails?.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  <a 
                                    href={`tel:${notif.driverDetails.phone}`}
                                    className="text-green-600 hover:text-green-700 font-medium text-sm underline"
                                  >
                                    {notif.driverDetails.phone}
                                  </a>
                                </div>
                              )}
                              
                              {notif.driverDetails?.vehicleInfo && (
                                <div className="flex items-center gap-2">
                                  <Truck className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                  <span className="text-gray-900 text-sm">{notif.driverDetails.vehicleInfo}</span>
                                </div>
                              )}
                              
                              {notif.driverDetails?.pickupTime && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                  <span className="text-gray-900 text-sm">{notif.driverDetails.pickupTime}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 mt-2 text-sm">{notif.message}</p>
                        )}
                        
                        <p className="text-sm text-gray-500 mt-3">{new Date(notif.createdAt).toLocaleString()}</p>
                      </div>
                      {!notif.read && <div className="w-3 h-3 bg-red-600 rounded-full mt-2 ml-4 flex-shrink-0" />}
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
