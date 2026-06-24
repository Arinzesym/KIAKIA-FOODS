import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { hashPassword } from '@/lib/password';

type CreateUserBody = {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  password?: string;
};

function sanitizeUser(user: Record<string, unknown>) {
  return {
    id: String(user.id ?? ''),
    name: String(user.name ?? ''),
    email: String(user.email ?? ''),
    phone: String(user.phone ?? ''),
    role: String(user.role ?? '')
  };
}

function isOwnerRequest() {
  return cookies().get('auth-role')?.value === 'owner';
}

export async function GET() {
  if (!isOwnerRequest()) {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured. Add Supabase env vars first.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone, role, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: (data ?? []).map(sanitizeUser) });
}

export async function POST(request: Request) {
  if (!isOwnerRequest()) {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  }

  const body = (await request.json()) as CreateUserBody;
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim() ?? '';
  const role = body.role?.trim();
  const password = body.password ?? '';

  if (!name || !email || !role || !password) {
    return NextResponse.json({ error: 'Name, email, role, and password are required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured. Add Supabase env vars first.' }, { status: 503 });
  }

  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const passwordHash = hashPassword(password);

  const { error } = await supabase.from('users').insert({
    id,
    name,
    email,
    phone,
    role,
    password_hash: passwordHash,
    created_at: timestamp,
    updated_at: timestamp
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: { id, name, email, phone, role } }, { status: 201 });
}
