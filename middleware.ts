import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { canAccessPath, getLandingPath, normalizeRole } from '@/lib/access';

// Protected routes that require authentication
const protectedRoutes = ['/', '/admin', '/runner', '/customer/dashboard'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Check for auth token in cookies or session
    const hasAuth = request.cookies.get('auth-token')?.value || request.cookies.get('sb-auth-token')?.value;
    const role = normalizeRole(request.cookies.get('auth-role')?.value);

    if (hasAuth && pathname === '/') {
      return NextResponse.redirect(new URL(getLandingPath(role), request.url));
    }

    if (hasAuth && pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL(getLandingPath(role), request.url));
    }
    
    // If no auth token, redirect to appropriate login page
    if (!hasAuth) {
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/auth/admin-login', request.url));
      }
      if (pathname.startsWith('/admin') || pathname.startsWith('/runner') || pathname.startsWith('/rider')) {
        return NextResponse.redirect(new URL('/auth/admin-login', request.url));
      }
      if (pathname.startsWith('/customer/dashboard')) {
        return NextResponse.redirect(new URL('/customer/auth/login', request.url));
      }
    }

    if (hasAuth && !canAccessPath(role, pathname)) {
      return NextResponse.redirect(new URL(getLandingPath(role), request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/runner/:path*',
    '/rider/:path*',
    '/customer/dashboard/:path*'
  ]
};
