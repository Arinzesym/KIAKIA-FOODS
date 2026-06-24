import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = ['/admin', '/runner', '/customer/dashboard'];

const adminRoles = new Set(['owner', 'cofounder']);

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Check for auth token in cookies or session
    const hasAuth = request.cookies.get('auth-token')?.value || request.cookies.get('sb-auth-token')?.value;
    const role = request.cookies.get('auth-role')?.value;
    
    // If no auth token, redirect to appropriate login page
    if (!hasAuth) {
      if (pathname.startsWith('/admin') || pathname.startsWith('/runner')) {
        return NextResponse.redirect(new URL('/auth/admin-login', request.url));
      }
      if (pathname.startsWith('/customer/dashboard')) {
        return NextResponse.redirect(new URL('/customer/auth/login', request.url));
      }
    }

    if (pathname.startsWith('/runner') && role !== 'runner') {
      if (adminRoles.has(role || '')) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/auth/admin-login', request.url));
    }

    if (pathname.startsWith('/admin')) {
      if (!adminRoles.has(role || '')) {
        if (role === 'runner') {
          return NextResponse.redirect(new URL('/runner', request.url));
        }
        return NextResponse.redirect(new URL('/auth/admin-login', request.url));
      }

      // Only owner can view individual order details.
      const isIndividualOrderPage = /^\/admin\/orders\/[^/]+$/.test(pathname);
      if (isIndividualOrderPage && role !== 'owner') {
        return NextResponse.redirect(new URL('/admin/orders', request.url));
      }

      const isTeamManagementPage = pathname.startsWith('/admin/team');
      if (isTeamManagementPage && role !== 'owner') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/runner/:path*',
    '/customer/dashboard/:path*'
  ]
};
