'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type TeamUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

type TeamFormValues = {
  name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
};

const defaultValues: TeamFormValues = {
  name: '',
  email: '',
  phone: '',
  role: 'cofounder',
  password: ''
};

const allowedRoles = [
  { value: 'cofounder', label: 'Cofounder' },
  { value: 'runner', label: 'Runner' },
  { value: 'rider', label: 'Rider' }
];

export default function AdminTeamPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState<TeamFormValues>(defaultValues);

  useEffect(() => {
    const loadUsers = async () => {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load users right now.');
      }
      setUsers(data.users ?? []);
    };

    loadUsers().catch((error) => setMessage(error instanceof Error ? error.message : 'Unable to load users right now.'));
  }, []);

  const handleChange = (key: keyof TeamFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user.');
      }

      setUsers((current) => [data.user, ...current]);
      setFormValues(defaultValues);
      setMessage('User created successfully. They can now log in with their credentials.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-100">Team access</p>
        <h1 className="mt-3 text-3xl font-bold">Create and manage team logins</h1>
        <p className="mt-2 text-brand-100">Add cofounders, runners, and riders with database-backed credentials. Cofounder access is capped at two users.</p>
      </div>

      {message === 'Owner access required.' ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Owner access is required to manage logins. Sign in as the owner to continue.
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-5">
        <form onSubmit={handleCreateUser} className="lg:col-span-2 space-y-4 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Create login</h2>
          <Input label="Full Name" value={formValues.name} onChange={(event) => handleChange('name', event.target.value)} />
          <Input label="Email" type="email" value={formValues.email} onChange={(event) => handleChange('email', event.target.value)} />
          <Input label="Phone" value={formValues.phone} onChange={(event) => handleChange('phone', event.target.value)} />
          <label className="block text-sm font-medium text-slate-700">
            Role
            <select
              value={formValues.role}
              onChange={(event) => handleChange('role', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {allowedRoles.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <Input label="Password" type="password" value={formValues.password} onChange={(event) => handleChange('password', event.target.value)} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create login'}
          </Button>
          {message ? <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p> : null}
        </form>

        <div className="lg:col-span-3 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Existing logins</h2>
          <p className="mt-2 text-sm text-slate-600">These users are stored in your database and can sign in with the login page.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="rounded-3xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-950">{user.name}</p>
                  <p className="text-sm text-slate-600 break-all">{user.email}</p>
                  <p className="mt-3 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{user.role}</p>
                  {user.phone ? <p className="mt-2 text-sm text-slate-600">{user.phone}</p> : null}
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-slate-600 md:col-span-2 xl:col-span-3">
                No users loaded yet. Configure Supabase environment variables and create your first login.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
