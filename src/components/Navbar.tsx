'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Estates', href: '/admin/estate-batching' },
  { label: 'Runner', href: '/runner' },
  { label: 'Customers', href: '/admin/customers' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Finance', href: '/admin/finance' },
  { label: 'Reports', href: '/admin/reports' },
  { label: 'Settings', href: '/admin/settings' }
];

export function Navbar() {
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
          {navItems.map((item) => (
            <motion.div key={item.href} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link href={item.href} className="text-sm font-medium text-slate-700 transition hover:text-brand-600 whitespace-nowrap">
                {item.label}
              </Link>
            </motion.div>
          ))}
        </nav>
      </div>
    </motion.header>
  );
}
