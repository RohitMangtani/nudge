import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/LandingPage';

export default async function Home() {
  let user = null;
  try { user = await getUser(); } catch { /* not logged in */ }

  if (user?.onboarding_complete) redirect('/dashboard');
  if (user) redirect('/onboarding');

  return <LandingPage />;
}
