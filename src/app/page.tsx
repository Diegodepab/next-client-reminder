import { cookies } from 'next/headers';
import { Login } from '@/components/Login';
import { Dashboard } from '@/components/Dashboard';

export default async function HomePage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has('auth_token');

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Dashboard />;
}
