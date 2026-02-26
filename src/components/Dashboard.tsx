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

const CAT_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  health: { icon: '🩺', label: 'Health', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  car: { icon: '🚗', label: 'Car', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  home: { icon: '🏠', label: 'Home', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  finance: { icon: '💰', label: 'Finance', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  personal: { icon: '🪪', label: 'Personal', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  pets: { icon: '🐾', label: 'Pets', color: 'text-orange-400', bg: 'bg-orange-400/10' },
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function urgencyLabel(days: number): { text: string; color: string } {
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: 'text-danger' };
  if (days === 0) return { text: 'Today', color: 'text-mint' };
  if (days === 1) return { text: 'Tomorrow', color: 'text-mint' };
  if (days <= 7) return { text: `${days} days`, color: 'text-warn' };
  if (days <= 30) return { text: `${days} days`, color: 'text-ink-muted' };
  return { text: `${days} days`, color: 'text-ink-subtle' };
}

export default function NudgeDashboard({ userName }: { userName: string }) {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<string>('upcoming');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    const res = await fetch('/api/reminders');
    const data = await res.json();
    setReminders(data.reminders || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const markDone = async (id: string) => {
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, completed: true } : r));
    await fetch('/api/reminders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderId: id, completed: true }),
    });
  };

  const snooze = async (id: string) => {
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + 7);
    const dateStr = snoozeDate.toISOString().split('T')[0];
    setReminders((prev) =>
      prev.map((r) => r.id === id ? { ...r, snoozed_until: dateStr } : r)
    );
    await fetch('/api/reminders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderId: id, snoozed_until: dateStr }),
    });
  };

  const handleSignOut = async () => {
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
  const upcoming = active.filter((r) => daysUntil(r.due_date) > 7);

  const filteredList = filter === 'upcoming' ? active : filter === 'completed' ? completed : snoozed;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-ink-muted animate-pulse text-lg">Loading your reminders...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <p className="text-xs text-ink-muted">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</p>
            <h1 className="text-2xl font-bold tracking-tight">{userName.split(' ')[0]}</h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full border-2 border-mint bg-mint/20 flex items-center justify-center font-bold text-mint text-sm cursor-pointer"
            >
              {userName[0]?.toUpperCase()}
            </button>
            {menuOpen && (
              <div className="absolute top-12 right-0 bg-surface border border-border rounded-xl shadow-lg py-2 z-10 min-w-[140px]">
                <button onClick={() => { router.push('/onboarding'); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-surface-hover cursor-pointer">
                  Edit answers
                </button>
                <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-sm hover:bg-surface-hover cursor-pointer">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-8 animate-fade-in">
          <div className={`p-4 rounded-xl border ${overdue.length > 0 ? 'border-danger/30 bg-danger/5' : 'border-border bg-surface'}`}>
            <div className={`text-2xl font-bold ${overdue.length > 0 ? 'text-danger' : 'text-ink'}`}>{overdue.length}</div>
            <div className="text-xs text-ink-muted">Overdue</div>
          </div>
          <div className="p-4 rounded-xl border border-mint/20 bg-mint-dim">
            <div className="text-2xl font-bold text-mint">{thisWeek.length}</div>
            <div className="text-xs text-ink-muted">This week</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface">
            <div className="text-2xl font-bold">{upcoming.length}</div>
            <div className="text-xs text-ink-muted">Upcoming</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 animate-fade-in-delay">
          {[
            { key: 'upcoming', label: `Active (${active.length})` },
            { key: 'snoozed', label: `Snoozed (${snoozed.length})` },
            { key: 'completed', label: `Done (${completed.length})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs px-4 py-2 rounded-lg cursor-pointer transition-all ${
                filter === f.key
                  ? 'bg-ink text-dark font-medium'
                  : 'text-ink-muted hover:text-ink border border-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Reminder list */}
        <div className="space-y-3 animate-fade-in-delay">
          {filteredList.length === 0 && (
            <div className="text-center py-16">
              <p className="text-ink-muted text-sm">
                {filter === 'upcoming' ? 'All clear. Nothing due right now.' : filter === 'completed' ? "Nothing completed yet." : 'No snoozed reminders.'}
              </p>
            </div>
          )}

          {filteredList.map((reminder) => {
            const days = daysUntil(reminder.due_date);
            const urgency = urgencyLabel(days);
            const cat = CAT_CONFIG[reminder.category] || { icon: '📌', label: reminder.category, color: 'text-ink-muted', bg: 'bg-ink-muted/10' };

            return (
              <div
                key={reminder.id}
                className={`p-4 rounded-xl border transition-all ${
                  reminder.completed
                    ? 'border-border bg-surface opacity-50'
                    : days < 0
                    ? 'border-danger/30 bg-danger/5'
                    : 'border-border bg-surface hover:border-border-light'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${cat.bg} ${cat.color}`}>
                        {cat.icon} {cat.label}
                      </span>
                      {reminder.recurring && (
                        <span className="text-[10px] text-ink-subtle">↻ {reminder.recurrence_label}</span>
                      )}
                    </div>
                    <p className={`text-sm font-medium ${reminder.completed ? 'line-through' : ''}`}>
                      {reminder.title}
                    </p>
                    {reminder.description && (
                      <p className="text-xs text-ink-muted mt-0.5">{reminder.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-xs font-medium ${urgency.color}`}>{urgency.text}</div>
                    <div className="text-[10px] text-ink-subtle">
                      {new Date(reminder.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                {!reminder.completed && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => markDone(reminder.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-mint/10 text-mint hover:bg-mint/20 cursor-pointer transition-all"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => snooze(reminder.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-border-light text-ink-muted cursor-pointer transition-all"
                    >
                      Snooze 1 week
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
