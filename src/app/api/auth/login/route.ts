import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { verifyPassword } from '@/lib/password';
import { normalizeRole } from '@/lib/access';

type LoginBody = {
  email?: string;
  password?: string;
};

const demoUsers = [
  { email: 'owner@kiakiafoods.com', password: 'Owner@123', role: 'owner', name: 'Owner' },
  { email: 'cofounder1@kiakiafoods.com', password: 'Cofounder@123', role: 'cofounder', name: 'Cofounder 1' },
  { email: 'cofounder2@kiakiafoods.com', password: 'Cofounder2@123', role: 'cofounder', name: 'Cofounder 2' },
  { email: 'runner@kiakiafoods.com', password: 'Runner@123', role: 'runner', name: 'Runner' },
  { email: 'rider@kiakiafoods.com', password: 'Rider@123', role: 'rider', name: 'Rider' }
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, password_hash, name, role, phone')
          .eq('email', email)
          .maybeSingle();

        const storedRole = normalizeRole(data?.role as string | null | undefined);

        if (!error && data?.password_hash && verifyPassword(password, data.password_hash) && storedRole) {
          return NextResponse.json({
            user: {
              id: data.id,
              email: data.email,
              name: data.name,
              role: storedRole,
              phone: data.phone ?? ''
            }
          });
        }
      } catch {
        // Fall through to demo credentials when the database is unavailable.
      }
    }

    const demoUser = demoUsers.find((user) => user.email === email && user.password === password);

    if (!demoUser) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: demoUser.email,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        phone: ''
      },
      demo: true
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed.' },
      { status: 500 }
    );
  }
}
