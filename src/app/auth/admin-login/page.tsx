'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { getLandingPath, normalizeRole } from '@/lib/access';

const adminLoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AdminLoginFormValues>({ resolver: zodResolver(adminLoginSchema) });

  useEffect(() => {
    const hasAuth = document.cookie.split('; ').some((row) => row.startsWith('auth-token='));
    const role = normalizeRole(document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth-role='))
      ?.split('=')[1]);

    if (hasAuth) {
      router.replace(getLandingPath(role));
    }
  }, [router]);

  async function onSubmit(data: AdminLoginFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const responseText = await response.text();
      let result: { error?: string; user?: { email: string; name: string; role: string } } = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        result = { error: responseText || 'Invalid response from server.' };
      }

      if (!response.ok) {
        throw new Error(result.error || 'Invalid credentials. Please try again.');
      }

      const user = result.user;

      if (user) {
        const maxAge = 60 * 60 * 24 * 7;
        document.cookie = `auth-token=${btoa(user.email)}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `auth-role=${user.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `auth-name=${encodeURIComponent(user.name)}; path=/; max-age=${maxAge}; SameSite=Lax`;

        setMessage(`Login successful as ${user.role}. Redirecting...`);
        setTimeout(() => {
          window.location.href = getLandingPath(normalizeRole(user.role));
        }, 1000);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-10 shadow-lg shadow-slate-200/50">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Admin access</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">KiaKia Foods OMS</h1>
          <p className="mt-2 text-slate-600">Operations Management System</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <Input 
            label="Email" 
            type="email" 
            placeholder="admin@kiakiafoods.com"
            {...register('email')} 
            error={errors.email?.message} 
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="Enter your password"
            {...register('password')} 
            error={errors.password?.message} 
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in to OMS'}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-6 text-center">
          <p className="text-xs text-slate-500">Use the Team page to create your own logins.</p>
          <div className="mt-2 space-y-2 text-xs text-slate-600">
            <p>Team management: /admin/team</p>
          </div>
        </div>

        {message && (
          <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            message.includes('successful') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
