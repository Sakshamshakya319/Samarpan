import { type NextRequest, NextResponse } from "next/server";

const INTERNAL_TOKEN = process.env.MAINTENANCE_INTERNAL_TOKEN ?? "INTERNAL_MAINTENANCE_CHECK_TOKEN";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, API routes, and maintenance page
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname === '/maintenance' || 
    pathname.endsWith('.svg') || 
    pathname.endsWith('.jpg') || 
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.mp3') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js')
  ) {
    return NextResponse.next();
  }

  // Check maintenance mode
  try {
    const maintenanceResponse = await fetch(new URL('/api/admin/maintenance', request.url), {
      headers: {
        'x-maintenance-internal': INTERNAL_TOKEN,
      },
      cache: 'no-store',
    });

    if (maintenanceResponse.ok) {
      const maintenanceSettings = await maintenanceResponse.json();

      if (maintenanceSettings?.enabled) {
        const allowedIps = maintenanceSettings.allowedIps || [];
        const secretKey = maintenanceSettings.secretKey;
        const userIp = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const secretKeyFromQuery = request.nextUrl.searchParams.get('secret');

        const isAllowedIp = userIp && allowedIps.includes(userIp);
        const hasValidSecret = secretKey && secretKeyFromQuery === secretKey;

        // Allow admin routes and bypass conditions
        if (pathname.startsWith('/admin') || isAllowedIp || hasValidSecret) {
          return NextResponse.next();
        }

        // Redirect ALL other routes to maintenance page
        if (pathname !== '/maintenance') {
          const maintenanceUrl = new URL('/maintenance', request.url);
          
          // Preserve any secret key in the redirect
          if (secretKeyFromQuery) {
            maintenanceUrl.searchParams.set('secret', secretKeyFromQuery);
          }
          
          return NextResponse.redirect(maintenanceUrl);
        }

        // If already on maintenance page, allow it
        return NextResponse.next();
      }
    }
  } catch (error) {
    console.error("Error in maintenance middleware:", error);
    // On error, allow the request to continue to avoid breaking the site
  }

  // Normal authentication and routing logic when maintenance is disabled
  const token = request.cookies.get("token")?.value;
  const adminToken = request.cookies.get("adminToken")?.value;

  const protectedRoutes = ["/dashboard", "/profile"];
  const adminRoutes = ["/admin"];
  const authRoutes = ["/login", "/signup"];
  const adminAuthRoutes = ["/admin/login"];

  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (adminAuthRoutes.some((route) => pathname.startsWith(route))) {
    if (adminToken) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (adminRoutes.some((route) => pathname.startsWith(route)) && !pathname.startsWith("/admin/login")) {
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
