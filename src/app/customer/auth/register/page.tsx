'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { isSupabaseConfigured, supabaseClient } from '@/lib/supabaseClient';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function CustomerRegisterPage() {
  const [message, setMessage] = useState<string>('');
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterFormValues) {
    if (!supabaseClient) {
      setMessage('Registration is temporarily unavailable. Please contact support.');
      return;
    }

    const { error } = await supabaseClient.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone
        }
      }
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage('Account created. Please verify your email to continue.');
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-10 shadow-lg shadow-slate-200/50">
      <h1 className="text-3xl font-semibold text-slate-950">Create your KiaKia account</h1>
      <p className="mt-3 text-slate-600">Start saving orders, addresses, and favorite lists.</p>
      {!isSupabaseConfigured ? (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Customer authentication is not configured yet. Add Supabase environment variables to enable registration.
        </p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <Input label="Full Name" {...register('fullName')} error={errors.fullName?.message} />
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
        <Input label="Phone Number" type="tel" {...register('phone')} error={errors.phone?.message} />
        <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
        <Button type="submit" className="w-full">Create account</Button>
      </form>
      <div className="mt-4 text-sm text-slate-600">
        Already have an account? <Link href="/customer/auth/login" className="font-medium text-brand-600 hover:underline">Login</Link>
      </div>
      {message ? <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
