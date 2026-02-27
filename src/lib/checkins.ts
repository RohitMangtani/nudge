export interface StalenessRule {
  category: string;
  key: string;
  months: number;
  prompt: string;
}

export const STALENESS_RULES: StalenessRule[] = [
  { category: 'car', key: 'car_mileage', months: 6, prompt: 'How many miles on your car now?' },
  { category: 'car', key: 'last_oil_change', months: 6, prompt: 'Have you gotten an oil change recently?' },
  { category: 'health', key: 'last_checkup', months: 12, prompt: 'Have you seen a doctor this year?' },
  { category: 'health', key: 'last_dentist', months: 6, prompt: 'Been to the dentist lately?' },
  { category: 'finance', key: 'last_credit_check', months: 6, prompt: 'Checked your credit recently?' },
  { category: 'pets', key: 'last_vet_visit', months: 12, prompt: 'Has your pet been to the vet this year?' },
  { category: 'home', key: 'last_deep_clean', months: 3, prompt: 'Time for another deep clean?' },
];

export function isStale(updatedAt: string, thresholdMonths: number): boolean {
  const updated = new Date(updatedAt);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - thresholdMonths);
  return updated < cutoff;
}
