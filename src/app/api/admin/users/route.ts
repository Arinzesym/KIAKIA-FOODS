import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { hashPassword } from '@/lib/password';
import { normalizeRole } from '@/lib/access';

type CreateUserBody = {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  password?: string;
};

const allowedCreateRoles = new Set(['cofounder', 'runner', 'rider']);

function formatDbError(message: string) {
  if (/invalid path specified in request url/i.test(message) || /failed to parse url/i.test(message)) {
    return 'Supabase URL is invalid. Set NEXT_PUBLIC_SUPABASE_URL to https://<project-ref>.supabase.co and redeploy.';
  }

  return message;
}

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
    return NextResponse.json({ error: formatDbError(error.message) }, { status: 500 });
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
  const role = normalizeRole(body.role);
  const password = body.password ?? '';

  if (!name || !email || !role || !password) {
    return NextResponse.json({ error: 'Name, email, role, and password are required.' }, { status: 400 });
  }

  if (!allowedCreateRoles.has(role)) {
    return NextResponse.json({ error: 'Only cofounder, runner, and rider logins can be created here.' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured. Add Supabase env vars first.' }, { status: 503 });
  }

  if (role === 'cofounder') {
    const { count, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'cofounder');

    if (countError) {
      return NextResponse.json({ error: formatDbError(countError.message) }, { status: 500 });
    }

    if ((count ?? 0) >= 2) {
      return NextResponse.json({ error: 'Cofounder access is limited to 2 users.' }, { status: 400 });
    }
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
    return NextResponse.json({ error: formatDbError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ user: { id, name, email, phone, role } }, { status: 201 });
}
