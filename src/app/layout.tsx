import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StoreProvider } from '@/lib/StoreContext';

export const metadata: Metadata = {
  title: 'KiaKia Foods | OMS',
  description: 'KiaKia Foods Operations Management System for estate delivery, sourcing, and reporting.',
  metadataBase: new URL('https://www.kiakiafoods.com')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-50 text-slate-950 antialiased">
        <StoreProvider>
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
