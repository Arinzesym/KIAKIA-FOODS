import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLandingPath, normalizeRole } from '@/lib/access';

export default function HomePage() {
  const cookieStore = cookies();
  const authToken = cookieStore.get('auth-token')?.value;
  const authRole = normalizeRole(cookieStore.get('auth-role')?.value);

  if (!authToken) {
    redirect('/auth/admin-login');
  }

  redirect(getLandingPath(authRole));
}
