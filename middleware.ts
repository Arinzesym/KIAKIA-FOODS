import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/admin',
  '/runner',
  '/customer/dashboard'
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Check for auth token in cookies or session
    const hasAuth = request.cookies.get('auth-token')?.value || 
                    request.cookies.get('sb-auth-token')?.value;
    
    // If no auth token, redirect to appropriate login page
    if (!hasAuth) {
      if (pathname.startsWith('/admin') || pathname.startsWith('/runner')) {
        return NextResponse.redirect(new URL('/auth/admin-login', request.url));
      }
      if (pathname.startsWith('/customer/dashboard')) {
        return NextResponse.redirect(new URL('/customer/auth/login', request.url));
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
