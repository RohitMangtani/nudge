'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase-client';

export default function LandingPage() {
  const router = useRouter();
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');

  const completeSignIn = async (token: string) => {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    const data = await res.json();
    if (data.user?.onboarding_complete) {
      router.push('/dashboard');
    } else {
      router.push('/onboarding');
    }
    router.refresh();
  };

  const handleSignIn = async () => {
    setSigning(true);
    setError('');
    try {
      const token = await signInWithGoogle();
      if (token) await completeSignIn(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setSigning(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between px-6 py-16 sm:py-20">

      {/* Top: Logo */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <span className="text-[18px] font-semibold tracking-tight">nudge</span>
        </div>
      </div>

      {/* Center: Hero */}
      <div className="flex-1 flex flex-col justify-center max-w-lg py-20">
        <div className="animate-fade-in-delay">
          <h1 className="text-[48px] sm:text-[60px] font-bold tracking-[-0.035em] leading-[1.04] mb-8">
            Life maintenance<br />
            <span className="text-mint">on autopilot.</span>
          </h1>
          <p className="text-ink-muted text-[18px] leading-[1.65] max-w-[380px]">
            Oil changes, doctor visits, passport renewals — nudge remembers so you don&apos;t have to.
          </p>
        </div>
      </div>

      {/* Bottom: CTA + proof */}
      <div className="max-w-lg w-full space-y-10">
        <div className="animate-fade-in-delay-2">
          <button
            onClick={handleSignIn}
            disabled={signing}
            className="w-full h-[60px] bg-mint text-black font-semibold rounded-full text-[17px] cursor-pointer disabled:opacity-40 flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            {signing ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Get started</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </>
            )}
          </button>

          {error && (
            <p className="text-danger text-[14px] mt-4 text-center">{error}</p>
          )}
        </div>
      </div>
    </main>
  );
}
