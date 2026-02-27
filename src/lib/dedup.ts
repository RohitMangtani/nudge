function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function isDuplicate(newTitle: string, existingTitles: string[]): boolean {
  const n = normalize(newTitle);
  return existingTitles.some((t) => {
    const e = normalize(t);
    return e === n || e.includes(n) || n.includes(e);
  });
}
