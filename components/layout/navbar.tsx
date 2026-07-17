"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, User, Bell, Droplet, AlertTriangle, LogOut, Zap, MapPin, ChevronDown } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks"
import { useRouter, usePathname } from "next/navigation"
import { logout } from "@/lib/slices/authSlice"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()

  const handleLogout = () => {
    dispatch(logout())
    router.push("/")
  }

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

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) return null

  // Check authentication from multiple sources
  const localToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null
  const cookieUser = typeof window !== 'undefined' ? document.cookie.includes('auth_user') : false
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem("adminToken") : null
  const adminRole = typeof window !== 'undefined' ? localStorage.getItem("adminRole") : null
  const adminName = typeof window !== 'undefined' ? localStorage.getItem("adminName") : null
  const adminEmail = typeof window !== 'undefined' ? localStorage.getItem("adminEmail") : null
  const isUserAuthenticated = isAuthenticated || !!localToken || cookieUser
  const isAdminAuthenticated = !!adminToken
  const isAnyAuthenticated = isUserAuthenticated || isAdminAuthenticated

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <img src="/samarpan.png" alt="Samarpan Logo" className="w-8 h-8 rounded" />
              <span className="font-heading font-bold text-xl text-slate-900 hidden sm:inline">Samarpan</span>
            </Link>
          </div>

          {/* Desktop Menu - Hide during maintenance mode */}
          {!isMaintenanceMode && (
            <div className="hidden md:flex items-center gap-6">
              <Link href="/sos" className="flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700 transition">
                <Zap className="w-4 h-4" /> SOS
              </Link>
              <Link href="/city-dashboard" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition">
                <MapPin className="w-4 h-4" /> City Map
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition h-auto py-1 px-2">
                    Explore <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-white border-slate-200">
                  <DropdownMenuItem asChild>
                    <Link href="/" className="cursor-pointer w-full text-slate-700">Home</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/about" className="cursor-pointer w-full text-slate-700">About</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/blogs" className="cursor-pointer w-full text-slate-700">Blog</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/funding" className="cursor-pointer w-full text-slate-700">Donation</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/events" className="cursor-pointer w-full text-slate-700">Events</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/contact" className="cursor-pointer w-full text-slate-700">Contact</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Auth Buttons / User Menu - Hide most during maintenance */}
          <div className="flex items-center gap-3">
            {isAnyAuthenticated ? (
              <>
                {!isMaintenanceMode && (
                  <>
                    <div className="hidden md:flex items-center gap-2">
                      <Link href="/request-blood">
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-2 font-medium">
                          <Droplet className="w-4 h-4" />
                          Request Blood
                        </Button>
                      </Link>
                      <Link href="/donate-blood">
                        <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-medium">
                          <Droplet className="w-4 h-4" />
                          Donate Blood
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
                
                {/* Notification Bell - Visible on ALL devices */}
                {!isMaintenanceMode && (
                  <Link href="/notifications">
                    <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-900 h-9 w-9 hover:bg-slate-100 rounded-full">
                      <Bell className="w-5 h-5" />
                    </Button>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full focus-visible:ring-1 focus-visible:ring-slate-900">
                      <Avatar className="h-9 w-9 border border-slate-200">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-slate-100 text-slate-900 font-medium">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white border-slate-200" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold text-slate-900 leading-none">{isAdminAuthenticated ? adminName : user?.name}</p>
                        <p className="text-xs leading-none text-slate-500">
                          {isAdminAuthenticated ? adminEmail : user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    {isAdminAuthenticated ? (
                      <DropdownMenuItem asChild>
                        <Link href={adminRole === "superadmin" ? "/admin/super-admin" : "/admin/dashboard"} className="cursor-pointer text-slate-700">
                          <User className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer text-slate-700">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <DropdownMenuItem 
                      onClick={() => {
                        if (isAdminAuthenticated) {
                          localStorage.removeItem("adminToken")
                          localStorage.removeItem("adminRole")
                          localStorage.removeItem("adminName")
                          localStorage.removeItem("adminEmail")
                          localStorage.removeItem("adminPermissions")
                          router.push("/admin/login")
                        } else {
                          handleLogout()
                        }
                      }} 
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Hide login/signup buttons during maintenance mode or on NGO login page */}
                {!isMaintenanceMode && pathname !== '/ngo/login' && (
                  <>
                    <Link href="/login" className="hidden sm:block">
                      <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium">
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup" className="hidden sm:block">
                      <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 font-medium">Sign Up</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Maintenance Mode Indicator - Absolutely Centered */}
        {isMaintenanceMode && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-800 border border-orange-200 rounded-full text-sm font-medium shadow-sm whitespace-nowrap">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Maintenance Mode Active</span>
              <span className="sm:hidden">Maintenance</span>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-3 bg-white px-2">
            {/* Mobile Maintenance Mode Indicator */}
            {isMaintenanceMode && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-800 border border-orange-100 rounded-lg text-sm mt-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Maintenance Mode Active</span>
              </div>
            )}
            
            {/* Hide mobile navigation during maintenance mode */}
            {!isMaintenanceMode && (
              <>
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-2 mb-2 pt-2">
                  <Link href="/sos" className="flex items-center gap-2 py-2 text-sm font-bold text-red-600 hover:text-red-700 px-2 rounded-md hover:bg-red-50">
                    <Zap className="w-4 h-4" /> SOS Emergency
                  </Link>
                  <Link href="/city-dashboard" className="flex items-center gap-2 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 px-2 rounded-md hover:bg-slate-50">
                    <MapPin className="w-4 h-4" /> City Map
                  </Link>
                </div>
                <div className="flex flex-col gap-1 pb-2">
                  <Link href="/" className="block text-sm font-medium text-slate-600 hover:text-slate-900 py-2 px-2 rounded-md hover:bg-slate-50">
                    Home
                  </Link>
                  <Link href="/about" className="block text-sm font-medium text-slate-600 hover:text-slate-900 py-2 px-2 rounded-md hover:bg-slate-50">
                    About
                  </Link>
                  <Link href="/blogs" className="block text-sm font-medium text-slate-600 hover:text-slate-900 py-2 px-2 rounded-md hover:bg-slate-50">
                    Blog
                  </Link>
                  <Link href="/funding" className="block text-sm font-medium text-slate-600 hover:text-slate-900 py-2 px-2 rounded-md hover:bg-slate-50">
                    Donation
                  </Link>
                  <Link href="/events" className="block text-sm font-medium text-slate-600 hover:text-slate-900 py-2 px-2 rounded-md hover:bg-slate-50">
                    Events
                  </Link>
                  <Link href="/contact" className="block text-sm font-medium text-slate-600 hover:text-slate-900 py-2 px-2 rounded-md hover:bg-slate-50">
                    Contact
                  </Link>
                </div>
              </>
            )}
            
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              {isAnyAuthenticated ? (
                <>
                  {!isMaintenanceMode && (
                    <div className="flex flex-col gap-2 px-1">
                      <Link href="/request-blood" className="w-full">
                        <Button size="sm" className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white font-medium">
                          <Droplet className="w-4 h-4" />
                          Request Blood
                        </Button>
                      </Link>
                      <Link href="/donate-blood" className="w-full">
                        <Button size="sm" className="w-full gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium">
                          <Droplet className="w-4 h-4" />
                          Donate Blood
                        </Button>
                      </Link>
                    </div>
                  )}
                  <div className="px-1 mt-2 flex flex-col gap-2">
                    {isAdminAuthenticated ? (
                      <Link href={adminRole === "superadmin" ? "/admin/super-admin" : "/admin/dashboard"} className="w-full">
                        <Button variant="outline" size="sm" className="w-full gap-2 border-slate-200 text-slate-700 justify-start">
                          <User className="w-4 h-4" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/dashboard" className="w-full">
                        <Button variant="outline" size="sm" className="w-full gap-2 border-slate-200 text-slate-700 justify-start">
                          <User className="w-4 h-4" />
                          Profile
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 justify-start" 
                      onClick={() => {
                        if (isAdminAuthenticated) {
                          localStorage.removeItem("adminToken")
                          localStorage.removeItem("adminRole")
                          localStorage.removeItem("adminName")
                          localStorage.removeItem("adminEmail")
                          localStorage.removeItem("adminPermissions")
                          router.push("/admin/login")
                        } else {
                          handleLogout()
                        }
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {!isMaintenanceMode && pathname !== '/ngo/login' && (
                    <div className="flex flex-col gap-2 px-1 mt-2">
                      <Link href="/login" className="w-full">
                        <Button variant="outline" size="sm" className="w-full border-slate-200 text-slate-700">
                          Login
                        </Button>
                      </Link>
                      <Link href="/signup" className="w-full">
                        <Button size="sm" className="w-full bg-slate-900 text-white">
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
