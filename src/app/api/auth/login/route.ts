import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { verifyPassword } from '@/lib/password';

type LoginBody = {
  email?: string;
  password?: string;
};

const demoUsers = [
  { email: 'owner@kiakiafoods.com', password: 'Owner@123', role: 'owner', name: 'Owner' },
  { email: 'cofounder1@kiakiafoods.com', password: 'Cofounder@123', role: 'cofounder', name: 'Cofounder 1' },
  { email: 'cofounder2@kiakiafoods.com', password: 'Cofounder2@123', role: 'cofounder', name: 'Cofounder 2' },
  { email: 'runner@kiakiafoods.com', password: 'Runner@123', role: 'runner', name: 'Runner' }
];

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, password_hash, name, role, phone')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data?.password_hash && verifyPassword(password, data.password_hash)) {
      return NextResponse.json({
        user: {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          phone: data.phone ?? ''
        }
      });
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
}
