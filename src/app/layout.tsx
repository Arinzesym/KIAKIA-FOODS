import './globals.css';
import type { Metadata } from 'next';
import type { Viewport } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StoreProvider } from '@/lib/StoreContext';
import { PWARegistration } from '@/components/PWARegistration';

export const metadata: Metadata = {
  title: 'KiaKia Foods | OMS',
  description: 'KiaKia Foods Operations Management System for estate delivery, sourcing, and reporting.',
  metadataBase: new URL('https://www.kiakiafoods.com'),
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KiaKia OMS'
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.svg', type: 'image/svg+xml', sizes: '192x192' },
      { url: '/icons/icon-512.svg', type: 'image/svg+xml', sizes: '512x512' }
    ],
    apple: [{ url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }]
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2f9956'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-50 text-slate-950 antialiased">
        <StoreProvider>
          <PWARegistration />
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
