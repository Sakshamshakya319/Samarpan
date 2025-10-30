"use client"

import { useState, useEffect } from "react"
import { useAppSelector } from "@/lib/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Phone, Truck, Clock, MapPin } from "lucide-react"

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
  type?: string // "driver_details" | "general"
  driverDetails?: DriverDetails
  read: boolean
  createdAt: string
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { token } = useAppSelector((state) => state.auth)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 5000)
    return () => clearInterval(interval)
  }, [token])

  const fetchNotifications = async () => {
    if (!token) return
    try {
      const response = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched notifications:", data.notifications)
        setNotifications(data.notifications)
      }
    } catch (err) {
      console.error("Failed to fetch notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        <CardDescription>Stay updated with important announcements</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-muted-foreground">No notifications yet</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => {
              const isDriverNotification = notification.type === "driver_details"
              const hasDriverDetails = notification.driverDetails && 
                (notification.driverDetails.name || notification.driverDetails.phone)
              
              return (
              <div
                key={notification._id}
                className={`p-3 rounded-lg border ${
                  notification.read ? "bg-background border-border" : isDriverNotification ? "bg-green-50 border-green-300" : "bg-secondary/50 border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm flex-1">{notification.title}</h4>
                  {isDriverNotification && (
                    <Truck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                </div>
                
                {hasDriverDetails ? (
                  // Special Driver Details Display
                  <div className="mt-3 space-y-2 bg-white rounded p-2 border border-green-200">
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    
                    <div className="space-y-2 mt-2">
                      {notification.driverDetails?.name && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700">Driver:</span>
                          <span className="text-gray-900">{notification.driverDetails.name}</span>
                        </div>
                      )}
                      
                      {notification.driverDetails?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-green-600" />
                          <a 
                            href={`tel:${notification.driverDetails.phone}`}
                            className="text-green-600 hover:text-green-700 font-medium underline"
                          >
                            {notification.driverDetails.phone}
                          </a>
                        </div>
                      )}
                      
                      {notification.driverDetails?.vehicleInfo && (
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-900">{notification.driverDetails.vehicleInfo}</span>
                        </div>
                      )}
                      
                      {notification.driverDetails?.pickupTime && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-900">{notification.driverDetails.pickupTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                )}
                
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </p>
              </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
