import Link from 'next/link';
import { Logo } from '@/components/Logo';

export function Footer() {
  return (
    <footer className="border-t border-brand-900/20 bg-brand-900 text-brand-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <Logo />
          <p className="mt-2 max-w-xl text-sm leading-6 text-brand-200">
            A digital operating system for market-based grocery orders and grouped estate delivery.
          </p>
        </div>
        <div className="space-y-2 text-sm text-brand-200">
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <Link href="/admin" className="hover:text-white">Admin Portal</Link>
          <Link href="/customer" className="hover:text-white">Customer Portal</Link>
        </div>
      </div>
    </footer>
  );
}
