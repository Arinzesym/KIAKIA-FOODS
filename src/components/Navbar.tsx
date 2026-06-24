'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getLandingPath, normalizeRole, type AuthRole } from '@/lib/access';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', roles: ['owner', 'cofounder'] },
  { label: 'Orders', href: '/admin/orders', roles: ['owner', 'cofounder'] },
  { label: 'Team', href: '/admin/team', roles: ['owner'] },
  { label: 'Estates', href: '/admin/estate-batching', roles: ['owner', 'cofounder'] },
  { label: 'Dispatch', href: '/admin/dispatch', roles: ['owner', 'cofounder'] },
  { label: 'Runner', href: '/runner', roles: ['owner', 'runner'] },
  { label: 'Rider', href: '/rider', roles: ['owner', 'rider'] },
  { label: 'Customers', href: '/admin/customers', roles: ['owner'] },
  { label: 'Analytics', href: '/admin/analytics', roles: ['owner'] },
  { label: 'Finance', href: '/admin/finance', roles: ['owner'] },
  { label: 'Reports', href: '/admin/reports', roles: ['owner', 'cofounder'] },
  { label: 'Settings', href: '/admin/settings', roles: ['owner'] }
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<AuthRole>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getCookieValue = (name: string) => {
    const value = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.split('=')[1];
    return value ? decodeURIComponent(value) : '';
  };

  useEffect(() => {
    const authToken = getCookieValue('auth-token');
    const authRole = normalizeRole(getCookieValue('auth-role'));
    setIsLoggedIn(!!authToken);
    setRole(authRole);
  }, []);

  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));
  const showPublicNav = !isLoggedIn;
  const isAuthPage = pathname.startsWith('/auth/') || pathname.startsWith('/customer/auth/');

  const adminItems = [
    { label: 'Dashboard', href: '/admin/dashboard', roles: ['owner', 'cofounder'] },
    { label: 'Orders', href: '/admin/orders', roles: ['owner', 'cofounder'] },
    { label: 'Dispatch', href: '/admin/dispatch', roles: ['owner', 'cofounder'] },
    { label: 'Estates', href: '/admin/estate-batching', roles: ['owner', 'cofounder'] },
    { label: 'Runner', href: '/runner', roles: ['owner', 'runner'] },
    { label: 'Rider', href: '/rider', roles: ['owner', 'rider'] },
    { label: 'Customers', href: '/admin/customers', roles: ['owner'] },
    { label: 'Analytics', href: '/admin/analytics', roles: ['owner'] },
    { label: 'Finance', href: '/admin/finance', roles: ['owner'] },
    { label: 'Reports', href: '/admin/reports', roles: ['owner', 'cofounder'] },
    { label: 'Settings', href: '/admin/settings', roles: ['owner'] },
    { label: 'Team', href: '/admin/team', roles: ['owner'] }
  ];

  const allVisibleItems = adminItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    document.cookie = 'auth-token=; path=/; max-age=0';
    document.cookie = 'auth-role=; path=/; max-age=0';
    document.cookie = 'auth-name=; path=/; max-age=0';
    setIsLoggedIn(false);
    setRole('');
    router.push('/auth/admin-login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Logo />
        {isAuthPage ? (
          <Link href="/" className="ml-4 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Home
          </Link>
        ) : (
          <>
            <nav className="hidden items-center gap-4 overflow-x-auto md:flex">
              {!showPublicNav && visibleNavItems.map((item) => (
                <div key={item.href} className="transition-transform hover:-translate-y-0.5 active:scale-[0.98]">
                  <Link href={item.href} className="whitespace-nowrap text-sm font-medium text-slate-700 transition hover:text-brand-600">
                    {item.label}
                  </Link>
                </div>
              ))}
              {!showPublicNav && visibleNavItems.length === 0 && role ? (
                <Link href={getLandingPath(role)} className="whitespace-nowrap text-sm font-medium text-slate-700 transition hover:text-brand-600">
                  Open portal
                </Link>
              ) : null}
            </nav>
            {isLoggedIn ? (
              <div className="ml-4 flex items-center gap-2">
                <button
                  onClick={() => setIsMenuOpen((current) => !current)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:hidden"
                >
                  {isMenuOpen ? 'Close' : 'Menu'}
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/auth/admin-login" className="ml-4 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
                Login
              </Link>
            )}
          </>
        )}
      </div>
      {isLoggedIn && !isAuthPage && isMenuOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="grid gap-2">
            {allVisibleItems.length === 0 ? (
              <Link href={getLandingPath(role)} onClick={() => setIsMenuOpen(false)} className="min-h-11 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                Open portal
              </Link>
            ) : (
              allVisibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`min-h-11 rounded-2xl px-4 py-3 text-sm font-semibold ${pathname.startsWith(item.href) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  {item.label}
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
