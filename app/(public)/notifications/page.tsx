"use client"

// Mark as dynamic to handle authentication state and redirects
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">Stay updated with the latest messages from Samarpan</p>
          </div>
        </div>

        {/* Notifications Card */}
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                All Notifications
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {notifications.length} total
              </Badge>
            </CardTitle>
            <CardDescription>
              Your notifications from Samarpan will appear here
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {notifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">No notifications yet</h3>
                <p className="text-muted-foreground">
                  When you receive notifications, they'll appear here
                </p>
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
                      className={`relative p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                        notif.read 
                          ? "bg-muted/30 border-border" 
                          : isDriverNotification 
                            ? "bg-green-50 border-green-200 shadow-sm" 
                            : "bg-primary/5 border-primary/20 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isDriverNotification 
                            ? "bg-green-100 text-green-600" 
                            : "bg-primary/10 text-primary"
                        }`}>
                          {isDriverNotification ? (
                            <Truck className="w-5 h-5" />
                          ) : (
                            <Bell className="w-5 h-5" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="font-heading text-lg font-semibold text-foreground pr-2">
                              {notif.title}
                            </h3>
                            {!notif.read && (
                              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                          
                          {hasDriverDetails ? (
                            // Driver Details Display
                            <div className="space-y-4">
                              <p className="text-muted-foreground leading-relaxed">{notif.message}</p>
                              
                              <div className="bg-white rounded-lg p-4 border border-green-200 space-y-3">
                                <h4 className="font-medium text-green-800 flex items-center gap-2">
                                  <Truck className="w-4 h-4" />
                                  Driver Information
                                </h4>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {notif.driverDetails?.name && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-muted-foreground">Driver:</span>
                                      <span className="text-sm text-foreground">{notif.driverDetails.name}</span>
                                    </div>
                                  )}
                                  
                                  {notif.driverDetails?.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                                      <a 
                                        href={`tel:${notif.driverDetails.phone}`}
                                        className="text-sm text-green-600 hover:text-green-700 font-medium underline"
                                      >
                                        {notif.driverDetails.phone}
                                      </a>
                                    </div>
                                  )}
                                  
                                  {notif.driverDetails?.vehicleInfo && (
                                    <div className="flex items-center gap-2">
                                      <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm text-foreground">{notif.driverDetails.vehicleInfo}</span>
                                    </div>
                                  )}
                                  
                                  {notif.driverDetails?.pickupTime && (
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm text-foreground">{notif.driverDetails.pickupTime}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {notif.message}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(notif.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
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
