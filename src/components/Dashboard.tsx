'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { firebaseSignOut } from '@/lib/firebase-client';

interface Reminder {
  id: string;
  category: string;
  title: string;
  description: string | null;
  due_date: string;
  recurring: boolean;
  recurrence_label: string | null;
  completed: boolean;
  snoozed_until: string | null;
}

function CatIcon({ id, size = 22 }: { id: string; size?: number }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'health':
      return <svg {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
    case 'car':
      return <svg {...props}><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M5 17H3v-4l2-5h10l2 5h2v4h-2" /><path d="M5 12h14" /></svg>;
    case 'home':
      return <svg {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
    case 'finance':
      return <svg {...props}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
    case 'personal':
      return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case 'pets':
      return <svg {...props}><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" /><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="10" /></svg>;
  }
}

const CAT_META: Record<string, { label: string }> = {
  health: { label: 'Health' },
  car: { label: 'Car' },
  home: { label: 'Home' },
  finance: { label: 'Finance' },
  personal: { label: 'Personal' },
  pets: { label: 'Pets' },
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function friendlyDue(days: number): string {
  if (days < -1) return `${Math.abs(days)} days late`;
  if (days === -1) return 'Yesterday';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;
  return `In ${days} days`;
}

function dueBadgeStyle(days: number): string {
  if (days < 0) return 'bg-danger/10 text-danger';
  if (days <= 1) return 'bg-mint/12 text-mint';
  if (days <= 7) return 'bg-warn/10 text-warn';
  return 'bg-surface-hover text-ink-muted';
}

export default function NudgeDashboard({ userName }: { userName: string }) {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<string>('active');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const fetchReminders = useCallback(async () => {
    const res = await fetch('/api/reminders');
    const data = await res.json();
    setReminders(data.reminders || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const markDone = async (id: string) => {
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, completed: true } : r));
    await fetch('/api/reminders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderId: id, completed: true }),
    });
  };

  const snooze = async (id: string) => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const dateStr = d.toISOString().split('T')[0];
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, snoozed_until: dateStr } : r));
    await fetch('/api/reminders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderId: id, snoozed_until: dateStr }),
    });
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await firebaseSignOut();
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const handleReset = async () => {
    setResetting(true);
    await fetch('/api/reset', { method: 'POST' });
    setMenuOpen(false);
    setResetting(false);
    router.push('/onboarding');
    router.refresh();
  };

  const today = new Date().toISOString().split('T')[0];
  const active = reminders.filter((r) => !r.completed && (!r.snoozed_until || r.snoozed_until <= today));
  const completed = reminders.filter((r) => r.completed);
  const snoozed = reminders.filter((r) => !r.completed && r.snoozed_until && r.snoozed_until > today);

  const filteredList = filter === 'active' ? active : filter === 'done' ? completed : snoozed;
  const firstName = userName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <main className="min-h-dvh px-6 py-12">
        <div className="max-w-lg mx-auto">
          <div className="h-5 w-28 animate-shimmer rounded-lg mb-3" />
          <div className="h-9 w-44 animate-shimmer rounded-lg mb-16" />
          <div className="h-52 animate-shimmer rounded-3xl mb-8" />
          <div className="h-52 animate-shimmer rounded-3xl" />
        </div>
      </main>
    );
  }

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-[999]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-elevated rounded-t-3xl p-8 pb-12 safe-area-bottom animate-slide-up">
            <div className="flex items-center gap-4 mb-10">
              <button onClick={() => setMenuOpen(false)} className="w-11 h-11 rounded-full bg-surface flex items-center justify-center cursor-pointer active:scale-95 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <span className="text-[18px] font-semibold">Settings</span>
            </div>
            <div className="space-y-3">
              <button onClick={() => { setMenuOpen(false); router.push('/onboarding'); }} className="flex items-center gap-4 w-full px-6 py-5 rounded-2xl bg-surface hover:bg-surface-hover text-[16px] font-medium cursor-pointer active:scale-[0.98] transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                Update my info
              </button>
              <button onClick={handleSignOut} className="flex items-center gap-4 w-full px-6 py-5 rounded-2xl bg-surface hover:bg-surface-hover text-[16px] font-medium text-ink-muted cursor-pointer active:scale-[0.98] transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Sign out
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <button onClick={handleReset} disabled={resetting} className="flex items-center gap-4 w-full px-6 py-4 rounded-2xl text-[15px] font-medium text-danger cursor-pointer active:scale-[0.98] transition-all disabled:opacity-40 hover:bg-danger/5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                {resetting ? 'Resetting...' : 'Start over'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-dvh px-6 py-12">
        <div className="max-w-lg mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-12 animate-fade-in">
            <div>
              <p className="text-[15px] text-ink-muted mb-1">{greeting}</p>
              <h1 className="text-[32px] font-bold tracking-tight">{firstName}</h1>
            </div>
            <button
              onClick={() => setMenuOpen(true)}
              className="w-12 h-12 rounded-full bg-mint/15 flex items-center justify-center font-bold text-mint text-[16px] cursor-pointer hover:bg-mint/25 active:scale-95 transition-all"
            >
              {firstName[0]?.toUpperCase()}
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-4 mb-12 overflow-x-auto no-scrollbar animate-fade-in-delay">
            {[
              { key: 'active', label: 'Upcoming', count: active.length },
              { key: 'snoozed', label: 'Snoozed', count: snoozed.length },
              { key: 'done', label: 'Done', count: completed.length },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-[16px] px-7 py-3.5 rounded-full cursor-pointer transition-all active:scale-95 whitespace-nowrap flex items-center gap-2.5 ${
                  filter === f.key
                    ? 'bg-ink text-dark font-semibold'
                    : 'text-ink-muted hover:text-ink-secondary hover:bg-surface'
                }`}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={`text-[13px] min-w-[24px] h-[24px] px-1.5 rounded-full flex items-center justify-center ${
                    filter === f.key ? 'bg-dark/20 text-dark' : 'bg-surface text-ink-muted'
                  }`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="animate-fade-in-delay-2">
            {filteredList.length === 0 && (
              <div className="text-center py-32">
                <div className="w-20 h-20 rounded-3xl bg-surface mx-auto mb-8 flex items-center justify-center text-ink-subtle">
                  {filter === 'active' ? (
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : filter === 'done' ? (
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="16 12 12 8 8 12" /><line x1="12" y1="16" x2="12" y2="8" /></svg>
                  ) : (
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M1 1l22 22" /></svg>
                  )}
                </div>
                <p className="text-ink text-[20px] font-semibold mb-2">
                  {filter === 'active' ? 'You\'re all caught up!' : filter === 'done' ? 'Nothing done yet' : 'Nothing snoozed'}
                </p>
                <p className="text-ink-muted text-[16px]">
                  {filter === 'active' ? 'Nothing coming up. Enjoy your day.' : filter === 'done' ? 'Completed reminders show up here.' : 'Snoozed reminders will appear here.'}
                </p>
              </div>
            )}

            {filteredList.map((reminder, i) => {
              const days = daysUntil(reminder.due_date);
              const cat = CAT_META[reminder.category] || { label: reminder.category };
              const dateLabel = new Date(reminder.due_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

              return (
                <div
                  key={reminder.id}
                  className={`rounded-3xl transition-all ${i > 0 ? 'mt-8' : ''} ${
                    reminder.completed
                      ? 'bg-surface/60 opacity-50'
                      : 'bg-elevated border border-border'
                  }`}
                >
                  <div className="px-8 pt-8 pb-7">
                    {/* Category icon + due badge */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          days < 0 ? 'bg-danger/10 text-danger' : 'bg-mint/12 text-mint'
                        }`}>
                          <CatIcon id={reminder.category} />
                        </div>
                        <span className="text-[15px] text-ink-muted font-medium">{cat.label}</span>
                      </div>
                      {!reminder.completed && (
                        <span className={`text-[14px] font-semibold px-4 py-2 rounded-full ${dueBadgeStyle(days)}`}>
                          {friendlyDue(days)}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <p className={`text-[20px] font-semibold leading-snug ${reminder.completed ? 'line-through text-ink-muted' : ''}`}>
                      {reminder.title}
                    </p>

                    {/* Description */}
                    {reminder.description && (
                      <p className="text-[16px] text-ink-muted mt-3 leading-relaxed">{reminder.description}</p>
                    )}

                    {/* Date */}
                    {!reminder.completed && (
                      <p className="text-[15px] text-ink-subtle mt-6">{dateLabel}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {!reminder.completed && (
                    <div className="flex border-t border-border">
                      <button
                        onClick={() => markDone(reminder.id)}
                        className="flex-1 py-5 text-[16px] font-semibold text-mint cursor-pointer transition-all active:bg-mint/5 rounded-bl-3xl"
                      >
                        Done
                      </button>
                      <div className="w-px bg-border" />
                      <button
                        onClick={() => snooze(reminder.id)}
                        className="flex-1 py-5 text-[16px] font-semibold text-ink-muted cursor-pointer transition-all active:bg-surface rounded-br-3xl"
                      >
                        Snooze
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </main>
    </>
  );
}
