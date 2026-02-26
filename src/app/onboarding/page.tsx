import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OnboardingFlow from '@/components/OnboardingFlow';

export default async function OnboardingPage() {
  let user = null;
  try { user = await getUser(); } catch { /* not logged in */ }
  if (!user) redirect('/');
  return <OnboardingFlow />;
}
