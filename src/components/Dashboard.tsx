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

const CAT_META: Record<string, { icon: string; label: string }> = {
  health: { icon: '🩺', label: 'Health' },
  car: { icon: '🚗', label: 'Car' },
  home: { icon: '🏠', label: 'Home' },
  finance: { icon: '💰', label: 'Finance' },
  personal: { icon: '🪪', label: 'Personal' },
  pets: { icon: '🐾', label: 'Pets' },
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function urgencyText(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days}d`;
}

function urgencyColor(days: number): string {
  if (days < 0) return 'text-danger';
  if (days <= 1) return 'text-mint';
  if (days <= 7) return 'text-warn';
  return 'text-ink-muted';
}

export default function NudgeDashboard({ userName }: { userName: string }) {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<string>('active');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const today = new Date().toISOString().split('T')[0];
  const active = reminders.filter((r) => !r.completed && (!r.snoozed_until || r.snoozed_until <= today));
  const completed = reminders.filter((r) => r.completed);
  const snoozed = reminders.filter((r) => !r.completed && r.snoozed_until && r.snoozed_until > today);

  const overdue = active.filter((r) => daysUntil(r.due_date) < 0);
  const thisWeek = active.filter((r) => { const d = daysUntil(r.due_date); return d >= 0 && d <= 7; });
  const later = active.filter((r) => daysUntil(r.due_date) > 7);

  const filteredList = filter === 'active' ? active : filter === 'done' ? completed : snoozed;
  const firstName = userName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Loading skeleton
  if (loading) {
    return (
      <main className="min-h-screen px-5 py-10">
        <div className="max-w-md mx-auto">
          <div className="h-6 w-32 animate-shimmer rounded-lg mb-2" />
          <div className="h-8 w-48 animate-shimmer rounded-lg mb-10" />
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-shimmer rounded-2xl" />)}
          </div>
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-shimmer rounded-2xl mb-3" />)}
        </div>
      </main>
    );
  }

  return (
    <>
      {/* Menu overlay — rendered at root level to escape all stacking contexts */}
      {menuOpen && (
        <div className="fixed inset-0 z-[999]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          {/* Bottom sheet menu for mobile */}
          <div className="absolute bottom-0 left-0 right-0 bg-elevated rounded-t-3xl p-6 pb-10 safe-area-bottom animate-slide-up">
            <div className="w-10 h-1 bg-ink-subtle rounded-full mx-auto mb-6" />
            <button
              onClick={() => { setMenuOpen(false); router.push('/onboarding'); }}
              className="block w-full text-left py-4 text-[16px] font-medium cursor-pointer active:opacity-60 transition-all"
            >
              Edit answers
            </button>
            <div className="h-px bg-border my-1" />
            <button
              onClick={handleSignOut}
              className="block w-full text-left py-4 text-[16px] text-ink-muted cursor-pointer active:opacity-60 transition-all"
            >
              Sign out
            </button>
            <button
              onClick={() => setMenuOpen(false)}
              className="block w-full mt-4 py-3.5 text-center text-[15px] font-medium bg-surface rounded-2xl cursor-pointer active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <main className="min-h-screen px-5 py-10">
        <div className="max-w-md mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-10 animate-fade-in">
            <div>
              <p className="text-[13px] text-ink-muted mb-0.5">{greeting}</p>
              <h1 className="text-[26px] font-bold tracking-tight">{firstName}</h1>
            </div>
            <button
              onClick={() => setMenuOpen(true)}
              className="w-11 h-11 rounded-full bg-mint/15 flex items-center justify-center font-bold text-mint text-[14px] cursor-pointer hover:bg-mint/25 active:scale-95 transition-all"
            >
              {firstName[0]?.toUpperCase()}
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-10 animate-fade-in-delay">
            <div className={`p-4 sm:p-5 rounded-2xl transition-all ${overdue.length > 0 ? 'bg-danger-dim' : 'bg-surface'}`}>
              <div className={`text-[22px] sm:text-[24px] font-bold ${overdue.length > 0 ? 'text-danger' : 'text-ink'}`}>
                {overdue.length}
              </div>
              <div className="text-[11px] sm:text-[12px] text-ink-muted mt-1">Overdue</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-mint-dim">
              <div className="text-[22px] sm:text-[24px] font-bold text-mint">{thisWeek.length}</div>
              <div className="text-[11px] sm:text-[12px] text-ink-muted mt-1">This week</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-surface">
              <div className="text-[22px] sm:text-[24px] font-bold">{later.length}</div>
              <div className="text-[11px] sm:text-[12px] text-ink-muted mt-1">Later</div>
            </div>
          </div>

          {/* Filters — horizontal scroll on tiny screens */}
          <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar animate-fade-in-delay-2">
            {[
              { key: 'active', label: 'Active', count: active.length },
              { key: 'snoozed', label: 'Snoozed', count: snoozed.length },
              { key: 'done', label: 'Done', count: completed.length },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-[13px] px-4 py-2.5 rounded-full cursor-pointer transition-all active:scale-95 whitespace-nowrap ${
                  filter === f.key
                    ? 'bg-ink text-dark font-medium'
                    : 'text-ink-muted hover:text-ink-secondary hover:bg-surface'
                }`}
              >
                {f.label} {f.count > 0 && <span className="ml-0.5 opacity-60">{f.count}</span>}
              </button>
            ))}
          </div>

          {/* Reminders */}
          <div className="space-y-2 animate-fade-in-delay-3">
            {filteredList.length === 0 && (
              <div className="text-center py-20">
                <div className="text-[32px] mb-4">
                  {filter === 'active' ? '✨' : filter === 'done' ? '🎯' : '😴'}
                </div>
                <p className="text-ink-muted text-[14px]">
                  {filter === 'active'
                    ? 'All clear — nothing due right now.'
                    : filter === 'done'
                    ? 'Nothing completed yet.'
                    : 'No snoozed reminders.'}
                </p>
              </div>
            )}

            {filteredList.map((reminder) => {
              const days = daysUntil(reminder.due_date);
              const cat = CAT_META[reminder.category] || { icon: '📌', label: reminder.category };
              const dateLabel = new Date(reminder.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              return (
                <div
                  key={reminder.id}
                  className={`p-5 rounded-2xl transition-all ${
                    reminder.completed
                      ? 'bg-surface opacity-40'
                      : days < 0
                      ? 'bg-danger-dim'
                      : 'bg-surface hover:bg-surface-hover'
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[12px] text-ink-muted">
                      {cat.icon} {cat.label}
                      {reminder.recurring && (
                        <span className="text-ink-subtle ml-2">↻ {reminder.recurrence_label}</span>
                      )}
                    </span>
                    <span className={`text-[12px] font-medium ${urgencyColor(days)}`}>
                      {urgencyText(days)}
                    </span>
                  </div>

                  {/* Title */}
                  <p className={`text-[15px] font-medium leading-snug ${reminder.completed ? 'line-through text-ink-muted' : ''}`}>
                    {reminder.title}
                  </p>

                  {/* Description */}
                  {reminder.description && (
                    <p className="text-[13px] text-ink-muted mt-1.5 leading-relaxed">{reminder.description}</p>
                  )}

                  {/* Date + actions — stacked on very small screens for tap targets */}
                  {!reminder.completed && (
                    <div className="flex items-center justify-between mt-4 gap-3">
                      <span className="text-[12px] text-ink-subtle flex-shrink-0">{dateLabel}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => markDone(reminder.id)}
                          className="text-[13px] font-medium px-5 py-2 rounded-full bg-mint-soft text-mint hover:bg-mint/25 cursor-pointer transition-all active:scale-95"
                        >
                          Done
                        </button>
                        <button
                          onClick={() => snooze(reminder.id)}
                          className="text-[13px] font-medium px-5 py-2 rounded-full bg-elevated text-ink-muted hover:text-ink-secondary cursor-pointer transition-all active:scale-95"
                        >
                          Snooze
                        </button>
                      </div>
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
