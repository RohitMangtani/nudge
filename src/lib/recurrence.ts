const INTERVAL_MAP: Record<string, { months?: number; days?: number }> = {
  '1_month': { months: 1 },
  '2_months': { months: 2 },
  '3_months': { months: 3 },
  '6_months': { months: 6 },
  '1_year': { months: 12 },
  '2_years': { months: 24 },
  '1_week': { days: 7 },
  '2_weeks': { days: 14 },
  '30_days': { days: 30 },
  '90_days': { days: 90 },
};

export function computeNextDueDate(currentDue: string, interval: string): string {
  const delta = INTERVAL_MAP[interval];
  if (!delta) return currentDue;

  const base = new Date(currentDue + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Use the later of (due date, today) so overdue items don't create past-due children
  const start = base > today ? base : today;

  if (delta.months) {
    start.setMonth(start.getMonth() + delta.months);
  }
  if (delta.days) {
    start.setDate(start.getDate() + delta.days);
  }

  return start.toISOString().split('T')[0];
}

const LABEL_PATTERNS: [RegExp, string][] = [
  [/every\s+week/i, '1_week'],
  [/every\s+2\s+weeks/i, '2_weeks'],
  [/every\s+month/i, '1_month'],
  [/every\s+2\s+months/i, '2_months'],
  [/every\s+3\s+months/i, '3_months'],
  [/quarterly/i, '3_months'],
  [/every\s+6\s+months/i, '6_months'],
  [/semi[- ]?annual/i, '6_months'],
  [/every\s+year/i, '1_year'],
  [/yearly/i, '1_year'],
  [/annual/i, '1_year'],
  [/every\s+2\s+years/i, '2_years'],
  [/every\s+30\s+days/i, '30_days'],
  [/every\s+90\s+days/i, '90_days'],
];

export function parseRecurrenceLabel(label: string | null): string | null {
  if (!label) return null;
  for (const [pattern, interval] of LABEL_PATTERNS) {
    if (pattern.test(label)) return interval;
  }
  return null;
}
