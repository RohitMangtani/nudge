import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NudgeDashboard from '@/components/Dashboard';

export default async function DashboardPage() {
  let user = null;
  try { user = await getUser(); } catch { /* not logged in */ }
  if (!user) redirect('/');
  if (!user.onboarding_complete) redirect('/onboarding');
  return <NudgeDashboard userName={user.name || 'Friend'} />;
}
