'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Team', href: '/admin/team' },
  { label: 'Estates', href: '/admin/estate-batching' },
  { label: 'Runner', href: '/runner' },
  { label: 'Customers', href: '/admin/customers' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Finance', href: '/admin/finance' },
  { label: 'Reports', href: '/admin/reports' },
  { label: 'Settings', href: '/admin/settings' }
];

export function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('');

  const getCookieValue = (name: string) => {
    const value = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.split('=')[1];
    return value ? decodeURIComponent(value) : '';
  };

  useEffect(() => {
    const authToken = getCookieValue('auth-token');
    const authRole = getCookieValue('auth-role');
    setIsLoggedIn(!!authToken);
    setRole(authRole);
  }, []);

  const visibleNavItems = role === 'runner' ? navItems.filter((item) => item.href === '/runner') : navItems;
  const showPublicNav = !isLoggedIn;

  const handleLogout = () => {
    document.cookie = 'auth-token=; path=/; max-age=0';
    document.cookie = 'auth-role=; path=/; max-age=0';
    document.cookie = 'auth-name=; path=/; max-age=0';
    setIsLoggedIn(false);
    setRole('');
    router.push('/auth/admin-login');
  };

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-40 border-b border-brand-100 bg-white/90 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-4 md:flex overflow-x-auto">
          {!showPublicNav && visibleNavItems.map((item) => (
            <motion.div key={item.href} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link href={item.href} className="text-sm font-medium text-slate-700 transition hover:text-brand-600 whitespace-nowrap">
                {item.label}
              </Link>
            </motion.div>
          ))}
        </nav>
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="ml-4 rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Logout
          </button>
        ) : (
          <Link href="/auth/admin-login" className="ml-4 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
            Login
          </Link>
        )}
      </div>
    </motion.header>
  );
}
