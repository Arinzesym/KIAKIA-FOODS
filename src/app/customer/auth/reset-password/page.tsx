'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabaseClient } from '@/lib/supabaseClient';

const resetSchema = z.object({ email: z.string().email('Enter a valid email') });

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [message, setMessage] = useState<string>('');
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetFormValues>({ resolver: zodResolver(resetSchema) });

  async function onSubmit(data: ResetFormValues) {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/customer/auth/login`
    });
    setMessage(error ? error.message : 'Password reset email sent. Please check your inbox.');
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-10 shadow-lg shadow-slate-200/50">
      <h1 className="text-3xl font-semibold text-slate-950">Reset password</h1>
      <p className="mt-3 text-slate-600">Enter your email and we will send a secure reset link.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
        <Button type="submit" className="w-full">Send reset link</Button>
      </form>
      {message ? <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
