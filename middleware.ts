import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  const adminToken = request.cookies.get("adminToken")?.value
  const { pathname } = request.nextUrl

  const protectedRoutes = ["/dashboard", "/profile"]
  const adminRoutes = ["/admin"]
  const authRoutes = ["/login", "/signup"]
  const adminAuthRoutes = ["/admin/login"]

  // If user is authenticated, redirect away from login/signup pages
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // If admin is authenticated, redirect away from admin login page
  if (adminAuthRoutes.some((route) => pathname.startsWith(route))) {
    if (adminToken) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  // Check if route is protected (require user authentication)
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Check if route is admin (but allow login page)
  if (adminRoutes.some((route) => pathname.startsWith(route)) && !pathname.startsWith("/admin/login")) {
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/admin/:path*", "/login/:path*", "/signup/:path*", "/admin/login/:path*"],
}
