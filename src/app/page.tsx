import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function HomePage() {
  const cookieStore = cookies();
  const authToken = cookieStore.get('auth-token')?.value;
  const authRole = cookieStore.get('auth-role')?.value;

  if (!authToken) {
    redirect('/auth/admin-login');
  }

  if (authRole === 'runner') {
    redirect('/runner');
  }

  redirect('/admin/dashboard');
}
