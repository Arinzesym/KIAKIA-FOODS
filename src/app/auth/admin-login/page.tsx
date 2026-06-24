'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const adminLoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

type LoginRole = 'owner' | 'cofounder' | 'runner';

const demoUsers: Array<{ email: string; password: string; role: LoginRole; redirectTo: string; name: string }> = [
  {
    email: 'owner@kiakiafoods.com',
    password: 'Owner@123',
    role: 'owner',
    redirectTo: '/admin/dashboard',
    name: 'Owner'
  },
  {
    email: 'cofounder1@kiakiafoods.com',
    password: 'Cofounder@123',
    role: 'cofounder',
    redirectTo: '/admin/dashboard',
    name: 'Cofounder 1'
  },
  {
    email: 'cofounder2@kiakiafoods.com',
    password: 'Cofounder2@123',
    role: 'cofounder',
    redirectTo: '/admin/dashboard',
    name: 'Cofounder 2'
  },
  {
    email: 'runner@kiakiafoods.com',
    password: 'Runner@123',
    role: 'runner',
    redirectTo: '/runner',
    name: 'Runner'
  }
];

export default function AdminLoginPage() {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AdminLoginFormValues>({ resolver: zodResolver(adminLoginSchema) });

  async function onSubmit(data: AdminLoginFormValues) {
    setIsLoading(true);
    try {
      const matchedUser = demoUsers.find(
        (user) => user.email.toLowerCase() === data.email.toLowerCase() && user.password === data.password
      );

      if (matchedUser) {
        const maxAge = 60 * 60 * 24 * 7;
        document.cookie = `auth-token=${btoa(matchedUser.email)}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `auth-role=${matchedUser.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `auth-name=${encodeURIComponent(matchedUser.name)}; path=/; max-age=${maxAge}; SameSite=Lax`;

        setMessage(`Login successful as ${matchedUser.role}. Redirecting...`);
        setTimeout(() => {
          window.location.href = matchedUser.redirectTo;
        }, 1000);
      } else {
        setMessage('Invalid credentials. Please try again.');
      }
    } catch (error) {
      setMessage('Login failed. Please try again.');
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
          <p className="text-xs text-slate-500">Demo credentials:</p>
          <div className="mt-2 space-y-2 text-xs text-slate-600">
            <p>Owner: owner@kiakiafoods.com / Owner@123</p>
            <p>Cofounder 1: cofounder1@kiakiafoods.com / Cofounder@123</p>
            <p>Cofounder 2: cofounder2@kiakiafoods.com / Cofounder2@123</p>
            <p>Runner: runner@kiakiafoods.com / Runner@123</p>
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
