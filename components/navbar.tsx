"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, User, Bell, Droplet, AlertTriangle } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"
import { useRouter } from "next/navigation"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
    
    // Check maintenance mode status
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/admin/maintenance', {
          cache: 'no-store'
        })
        if (response.ok) {
          const data = await response.json()
          setIsMaintenanceMode(data.enabled || false)
        }
      } catch (error) {
        console.error('Failed to check maintenance mode:', error)
      }
    }

    checkMaintenanceMode()
    
    // Check maintenance status every 30 seconds
    const interval = setInterval(checkMaintenanceMode, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (!isMounted) return null

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-xl text-foreground hidden sm:inline">Samarpan</span>
            </Link>
          </div>

          {/* Desktop Menu - Hide during maintenance mode */}
          {!isMaintenanceMode && (
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
                Home
              </Link>
              <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
                About
              </Link>
              <Link href="/blogs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
                Blog
              </Link>
              <Link href="/funding" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
                Donation
              </Link>
              <Link href="/events" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
                Events
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                Contact
              </Link>
            </div>
          )}

          {/* Auth Buttons / User Menu - Hide most during maintenance */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {!isMaintenanceMode && (
                  <>
                    <Link href="/request-blood" className="hidden lg:block">
                      <Button variant="default" size="sm" className="gap-2 bg-red-600 hover:bg-red-700">
                        <Droplet className="w-4 h-4" />
                        Request Blood
                      </Button>
                    </Link>
                    <Link href="/donate-blood" className="hidden lg:block">
                      <Button variant="default" size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
                        <Droplet className="w-4 h-4" />
                        Donate Blood
                      </Button>
                    </Link>
                    <Link href="/notifications" className="hidden md:block">
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <Bell className="w-4 h-4" />
                        Notifications
                      </Button>
                    </Link>
                  </>
                )}
                <Link href="/dashboard">
                  <Button size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">My Profile</span>
                    <span className="sm:hidden">Profile</span>
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {/* Hide login/signup buttons during maintenance mode */}
                {!isMaintenanceMode && (
                  <>
                    <Link href="/login" className="hidden sm:block">
                      <Button variant="outline" size="sm">
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup" className="hidden sm:block">
                      <Button size="sm">Sign Up</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 ml-2" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Maintenance Mode Indicator - Absolutely Centered */}
        {isMaintenanceMode && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium shadow-sm whitespace-nowrap">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Maintenance Mode Active</span>
              <span className="sm:hidden">Maintenance</span>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-3">
            {/* Mobile Maintenance Mode Indicator */}
            {isMaintenanceMode && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Maintenance Mode Active</span>
              </div>
            )}
            
            {/* Hide mobile navigation during maintenance mode */}
            {!isMaintenanceMode && (
              <>
                <Link href="/" className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                  Home
                </Link>
                <Link href="/about" className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                  About
                </Link>
                <Link href="/blogs" className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                  Blog
                </Link>
                <Link href="/funding" className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                  Donation
                </Link>
                <Link href="/events" className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                  Events
                </Link>
                <Link
                  href="/contact"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                >
                  Contact
                </Link>
              </>
            )}
            
            <div className="flex flex-col gap-2 pt-2">
              {isAuthenticated ? (
                <>
                  {!isMaintenanceMode && (
                    <>
                      <Link href="/request-blood" className="w-full">
                        <Button size="sm" className="w-full gap-2 bg-red-600 hover:bg-red-700">
                          <Droplet className="w-4 h-4" />
                          Request Blood
                        </Button>
                      </Link>
                      <Link href="/donate-blood" className="w-full">
                        <Button size="sm" className="w-full gap-2 bg-green-600 hover:bg-green-700">
                          <Droplet className="w-4 h-4" />
                          Donate Blood
                        </Button>
                      </Link>
                      <Link href="/notifications" className="w-full">
                        <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                          <Bell className="w-4 h-4" />
                          Notifications
                        </Button>
                      </Link>
                    </>
                  )}
                  <Link href="/dashboard" className="w-full">
                    <Button size="sm" className="w-full gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {/* Hide login/signup buttons during maintenance mode */}
                  {!isMaintenanceMode && (
                    <div className="flex gap-2">
                      <Link href="/login" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          Login
                        </Button>
                      </Link>
                      <Link href="/signup" className="flex-1">
                        <Button size="sm" className="w-full">
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
