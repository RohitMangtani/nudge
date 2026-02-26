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
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="animate-fade-in flex items-center gap-3 mb-16">
          <div className="w-11 h-11 rounded-2xl bg-mint flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight">nudge</span>
        </div>

        {/* Hero */}
        <div className="animate-fade-in mb-12">
          <h1 className="text-[40px] font-bold tracking-tight leading-[1.08] mb-5">
            Life maintenance<br />
            <span className="text-mint">on autopilot.</span>
          </h1>
          <p className="text-ink-muted text-[15px] leading-relaxed">
            Oil changes, doctor visits, passport renewals.
            <br />
            Nudge remembers so you don&apos;t have to.
          </p>
        </div>

        {/* CTA */}
        <div className="animate-fade-in-delay">
          <button
            onClick={handleSignIn}
            disabled={signing}
            className="w-full h-[52px] bg-white text-black font-medium rounded-full text-[15px] cursor-pointer disabled:opacity-40 flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {signing ? 'Signing in...' : 'Continue with Google'}
          </button>

          {error && (
            <p className="text-danger text-xs mt-4 text-center">{error}</p>
          )}
        </div>

        {/* Stats */}
        <div className="animate-fade-in-delay-2 mt-20 flex justify-between px-2">
          {[
            { n: '2 min', label: 'to set up' },
            { n: '0', label: 'effort after' },
            { n: '∞', label: 'peace of mind' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xl font-bold text-mint">{s.n}</div>
              <div className="text-[11px] text-ink-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
