'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabaseClient } from '@/lib/supabaseClient';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function CustomerLoginPage() {
  const [message, setMessage] = useState<string>('');
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginFormValues) {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage('Login successful. Redirecting to your dashboard...');
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-10 shadow-lg shadow-slate-200/50">
      <h1 className="text-3xl font-semibold text-slate-950">Customer login</h1>
      <p className="mt-3 text-slate-600">Secure access to your KiaKia Foods customer dashboard.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
        <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
        <Button type="submit" className="w-full">Continue</Button>
      </form>
      <div className="mt-4 text-sm text-slate-600">
        <Link href="/customer/auth/register" className="font-medium text-brand-600 hover:underline">Create account</Link>
        <span className="mx-2">•</span>
        <Link href="/customer/auth/reset-password" className="font-medium text-brand-600 hover:underline">Reset password</Link>
      </div>
      {message ? <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
