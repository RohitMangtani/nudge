'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Question {
  category: string;
  key: string;
  text: string;
  type: 'choice' | 'input' | 'yesno';
  options?: string[];
  placeholder?: string;
  followUp?: Question;
}

function CatIcon({ id, size = 26 }: { id: string; size?: number }) {
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

const CATEGORIES = [
  { id: 'health', label: 'Health', desc: 'Doctor, dentist, meds' },
  { id: 'car', label: 'Car', desc: 'Oil, tires, tags' },
  { id: 'home', label: 'Home', desc: 'Lease, filters, clean' },
  { id: 'finance', label: 'Finance', desc: 'Credit, taxes, subs' },
  { id: 'personal', label: 'Personal', desc: 'License, passport' },
  { id: 'pets', label: 'Pets', desc: 'Vet, meds, grooming' },
];

const QUESTIONS: Record<string, Question[]> = {
  health: [
    { category: 'health', key: 'last_checkup', text: 'Last time you saw a doctor?', type: 'choice', options: ['Recently', 'This year', 'Over a year ago', 'No clue'] },
    { category: 'health', key: 'last_dentist', text: 'How about the dentist?', type: 'choice', options: ['Recently', 'This year', 'Over a year ago', 'No clue'] },
    { category: 'health', key: 'wears_glasses', text: 'Glasses or contacts?', type: 'yesno', followUp: { category: 'health', key: 'last_eye_exam', text: 'Last eye exam?', type: 'choice', options: ['This year', 'A while ago', 'No clue'] } },
    { category: 'health', key: 'takes_prescriptions', text: 'On any regular meds?', type: 'yesno', followUp: { category: 'health', key: 'prescription_refill', text: 'How often do you refill?', type: 'choice', options: ['Monthly', 'Every few months', 'Twice a year', 'Yearly'] } },
  ],
  car: [
    { category: 'car', key: 'car_mileage', text: 'Ballpark miles on your car?', type: 'input', placeholder: 'e.g. 45k' },
    { category: 'car', key: 'last_oil_change', text: 'Last oil change?', type: 'choice', options: ['Pretty recent', 'A few months ago', 'It\'s been a while', 'No idea'] },
    { category: 'car', key: 'registration_month', text: 'When does registration expire?', type: 'input', placeholder: 'e.g. March' },
  ],
  home: [
    { category: 'home', key: 'rent_or_own', text: 'What\'s your living situation?', type: 'choice', options: ['Renting', 'Own it', 'Living with family'] },
    { category: 'home', key: 'lease_end', text: 'When\'s your lease up?', type: 'input', placeholder: 'e.g. Sep 2026' },
    { category: 'home', key: 'last_deep_clean', text: 'Last real deep clean?', type: 'choice', options: ['This month', 'A couple months', 'It\'s been a while', 'No comment'] },
  ],
  finance: [
    { category: 'finance', key: 'last_credit_check', text: 'Checked your credit lately?', type: 'choice', options: ['Yep, recently', 'A few months ago', 'It\'s been a while', 'Never have'] },
    { category: 'finance', key: 'tax_prep', text: 'How do you handle taxes?', type: 'choice', options: ['Do it myself', 'Accountant', 'Parents handle it', 'TBD'] },
    { category: 'finance', key: 'subscription_audit', text: 'Any subscriptions you forgot about?', type: 'choice', options: ['Nah, I\'m on top of it', 'Probably a few', 'Definitely', 'Never checked'] },
  ],
  personal: [
    { category: 'personal', key: 'license_expiry', text: 'License expire anytime soon?', type: 'input', placeholder: 'e.g. 2028' },
    { category: 'personal', key: 'has_passport', text: 'Got a passport?', type: 'yesno', followUp: { category: 'personal', key: 'passport_expiry', text: 'When does it expire?', type: 'input', placeholder: 'e.g. 2029' } },
    { category: 'personal', key: 'haircut_frequency', text: 'How often do you get a trim?', type: 'choice', options: ['Every month', 'Every couple months', 'When it gets bad', 'Rarely'] },
  ],
  pets: [
    { category: 'pets', key: 'pet_type', text: 'Got a furry friend?', type: 'choice', options: ['Dog', 'Cat', 'Both', 'Other'] },
    { category: 'pets', key: 'last_vet_visit', text: 'Last vet trip?', type: 'choice', options: ['Recently', 'This year', 'Over a year ago', 'No clue'] },
    { category: 'pets', key: 'pet_medication', text: 'Are they on any meds?', type: 'yesno', followUp: { category: 'pets', key: 'pet_med_refill', text: 'How often do you refill?', type: 'choice', options: ['Monthly', 'Every few months', 'Twice a year'] } },
  ],
};

export default function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUpdate = searchParams.get('mode') === 'update';
  const [phase, setPhase] = useState<'categories' | 'questions' | 'generating'>('categories');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [currentCatIndex, setCurrentCatIndex] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [collectedAnswers, setCollectedAnswers] = useState<{ category: string; key: string; value: string }[]>([]);
  const [generating, setGenerating] = useState(false);

  const toggleCat = (id: string) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const currentCat = selectedCats[currentCatIndex];
  const questions = currentCat ? QUESTIONS[currentCat] || [] : [];
  const currentQ = questions[currentQIndex];
  const activeQ = showFollowUp && currentQ?.followUp ? currentQ.followUp : currentQ;

  const totalQuestions = selectedCats.reduce((sum, cat) => sum + (QUESTIONS[cat]?.length || 0), 0);
  const answeredSoFar = selectedCats.slice(0, currentCatIndex).reduce((sum, cat) => sum + (QUESTIONS[cat]?.length || 0), 0) + currentQIndex;
  const progress = totalQuestions > 0 ? (answeredSoFar / totalQuestions) * 100 : 0;

  const saveAnswer = (key: string, category: string, value: string) => {
    setCollectedAnswers((prev) => [...prev.filter((a) => !(a.key === key && a.category === category)), { category, key, value }]);
  };

  const advance = () => {
    setShowFollowUp(false);
    setInputValue('');
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else if (currentCatIndex < selectedCats.length - 1) {
      setCurrentCatIndex(currentCatIndex + 1);
      setCurrentQIndex(0);
    } else {
      submitAll();
    }
  };

  const handleChoice = (value: string) => {
    if (!activeQ) return;
    saveAnswer(activeQ.key, activeQ.category, value);
    if (showFollowUp || !currentQ?.followUp) {
      advance();
    } else if (currentQ.type === 'yesno' && value === 'Yes' && currentQ.followUp) {
      setShowFollowUp(true);
    } else {
      advance();
    }
  };

  const handleInput = () => {
    if (!activeQ || !inputValue.trim()) return;
    saveAnswer(activeQ.key, activeQ.category, inputValue.trim());
    advance();
  };

  const submitAll = async () => {
    setPhase('generating');
    setGenerating(true);
    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: collectedAnswers }),
    });
    await fetch('/api/generate', { method: 'POST' });
    setGenerating(false);
    router.push('/dashboard');
    router.refresh();
  };

  /* Phase 1: Categories */
  if (phase === 'categories') {
    return (
      <main className="min-h-dvh px-8 py-14">
        <div className="max-w-md mx-auto animate-fade-in">
          {isUpdate && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[15px] text-ink-muted mb-10 cursor-pointer active:opacity-60 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              Back
            </button>
          )}
          <h1 className="text-[34px] font-bold tracking-tight leading-tight mb-4">
            What should we track?
          </h1>
          <p className="text-ink-muted text-[17px] mb-16">
            Pick the areas that matter to you.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-14">
            {CATEGORIES.map((cat) => {
              const selected = selectedCats.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCat(cat.id)}
                  className={`text-left px-5 py-6 rounded-2xl cursor-pointer transition-all active:scale-[0.97] ${
                    selected
                      ? 'bg-mint-glow ring-[1.5px] ring-mint'
                      : 'bg-surface hover:bg-surface-hover'
                  }`}
                >
                  <div className={`mb-3 ${selected ? 'text-mint' : 'text-ink-muted'}`}>
                    <CatIcon id={cat.id} />
                  </div>
                  <div className="text-[15px] font-semibold mb-1">{cat.label}</div>
                  <div className="text-[13px] text-ink-muted leading-relaxed">{cat.desc}</div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPhase('questions')}
            disabled={selectedCats.length === 0}
            className="w-full h-[56px] bg-mint hover:bg-mint-hover text-white font-semibold rounded-2xl text-[17px] cursor-pointer transition-all disabled:opacity-20 active:scale-[0.98]"
          >
            {selectedCats.length === 0
              ? 'Pick at least one'
              : `Continue with ${selectedCats.length} area${selectedCats.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </main>
    );
  }

  /* Phase 3: Generating */
  if (phase === 'generating' || generating) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-mint mx-auto mb-12 flex items-center justify-center animate-breathe">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-[22px] font-semibold mb-3">Building your reminders</p>
          <p className="text-[17px] text-ink-muted">Just a few seconds...</p>
        </div>
      </main>
    );
  }

  /* Phase 2: Questions */
  if (!activeQ) return null;

  const catInfo = CATEGORIES.find((c) => c.id === currentCat);

  const goBack = () => {
    if (showFollowUp) {
      setShowFollowUp(false);
    } else if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    } else if (currentCatIndex > 0) {
      const prevCat = selectedCats[currentCatIndex - 1];
      setCurrentCatIndex(currentCatIndex - 1);
      setCurrentQIndex((QUESTIONS[prevCat]?.length || 1) - 1);
    } else {
      setPhase('categories');
    }
    setInputValue('');
  };

  return (
    <main className="h-dvh flex flex-col px-8 py-14 overflow-hidden">
      <div className="max-w-md mx-auto w-full">
        {/* Back */}
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-[15px] text-ink-muted mb-6 cursor-pointer active:opacity-60 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back
        </button>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] text-ink-muted font-medium flex items-center gap-2">
              <span className="text-mint"><CatIcon id={currentCat} size={18} /></span>
              {catInfo?.label}
            </span>
            <span className="text-[14px] text-ink-subtle">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-mint rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question centered in remaining space */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full px-0">
          <div key={`${activeQ.category}-${activeQ.key}`} className="animate-slide-up">
            <h2 className="text-[30px] font-bold tracking-tight leading-tight mb-14">
              {activeQ.text}
            </h2>

            {activeQ.type === 'choice' && (
              <div className="space-y-4">
                {activeQ.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleChoice(opt)}
                    className="w-full text-left px-6 py-5 rounded-xl bg-surface hover:bg-surface-hover text-[16px] cursor-pointer transition-all active:scale-[0.98]"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {activeQ.type === 'yesno' && (
              <div className="flex gap-5">
                <button
                  onClick={() => handleChoice('Yes')}
                  className="flex-1 py-5 rounded-xl bg-surface hover:bg-surface-hover text-[16px] font-medium cursor-pointer transition-all active:scale-[0.98]"
                >
                  Yes
                </button>
                <button
                  onClick={() => handleChoice('No')}
                  className="flex-1 py-5 rounded-xl bg-surface hover:bg-surface-hover text-[16px] font-medium cursor-pointer transition-all active:scale-[0.98]"
                >
                  No
                </button>
              </div>
            )}

            {activeQ.type === 'input' && (
              <div className="space-y-5">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInput()}
                  placeholder={activeQ.placeholder}
                  className="w-full px-6 py-5 rounded-xl bg-surface text-ink text-[16px] focus:outline-none focus:ring-[1.5px] focus:ring-mint/50 transition-all placeholder:text-ink-subtle"
                  autoFocus
                />
                <button
                  onClick={handleInput}
                  disabled={!inputValue.trim()}
                  className="w-full py-4 rounded-xl bg-mint text-white font-semibold text-[16px] cursor-pointer transition-all hover:bg-mint-hover disabled:opacity-20 active:scale-[0.98]"
                >
                  Next
                </button>
              </div>
            )}

            <button
              onClick={advance}
              className="mt-10 text-[15px] text-ink-subtle hover:text-ink-muted cursor-pointer transition-all"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
