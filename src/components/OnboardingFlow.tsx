'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  category: string;
  key: string;
  text: string;
  type: 'choice' | 'input' | 'yesno';
  options?: string[];
  placeholder?: string;
  followUp?: Question;
}

/* SVG icons for each category */
function CatIcon({ id, size = 24 }: { id: string; size?: number }) {
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
  { id: 'health', label: 'Health', desc: 'Checkups, dentist, prescriptions' },
  { id: 'car', label: 'Car', desc: 'Oil changes, registration, tires' },
  { id: 'home', label: 'Home', desc: 'Lease, filters, deep cleaning' },
  { id: 'finance', label: 'Finance', desc: 'Credit score, taxes, subscriptions' },
  { id: 'personal', label: 'Personal', desc: 'License, passport, haircuts' },
  { id: 'pets', label: 'Pets', desc: 'Vet visits, medication, grooming' },
];

const QUESTIONS: Record<string, Question[]> = {
  health: [
    { category: 'health', key: 'last_checkup', text: 'When was your last doctor checkup?', type: 'choice', options: ['Less than 6 months', '6-12 months', '1-2 years', '2+ years', "Don't remember"] },
    { category: 'health', key: 'last_dentist', text: 'Last dentist visit?', type: 'choice', options: ['Less than 6 months', '6-12 months', '1-2 years', '2+ years', "Don't remember"] },
    { category: 'health', key: 'wears_glasses', text: 'Do you wear contacts or glasses?', type: 'yesno', followUp: { category: 'health', key: 'last_eye_exam', text: 'When was your last eye exam?', type: 'choice', options: ['Less than 1 year', '1-2 years', '2+ years', "Don't remember"] } },
    { category: 'health', key: 'takes_prescriptions', text: 'Any regular prescriptions?', type: 'yesno', followUp: { category: 'health', key: 'prescription_refill', text: 'How often do you refill?', type: 'choice', options: ['Monthly', 'Every 3 months', 'Every 6 months', 'Yearly'] } },
  ],
  car: [
    { category: 'car', key: 'car_mileage', text: 'Roughly how many miles on your car?', type: 'input', placeholder: 'e.g. 45000' },
    { category: 'car', key: 'last_oil_change', text: 'When was your last oil change?', type: 'choice', options: ['Less than 3 months', '3-6 months', '6+ months', "Don't remember"] },
    { category: 'car', key: 'registration_month', text: 'What month does your registration expire?', type: 'choice', options: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', "Don't know"] },
    { category: 'car', key: 'last_tire_rotation', text: 'Last tire rotation?', type: 'choice', options: ['Less than 6 months', '6-12 months', '1+ year', "Don't remember", 'Never'] },
  ],
  home: [
    { category: 'home', key: 'rent_or_own', text: 'Do you rent or own?', type: 'choice', options: ['Rent', 'Own', 'Live with family'] },
    { category: 'home', key: 'lease_end', text: 'When does your lease end?', type: 'input', placeholder: 'e.g. September 2026' },
    { category: 'home', key: 'last_air_filter', text: 'When did you last change the air filter?', type: 'choice', options: ['Less than 3 months', '3-6 months', '6+ months', "Don't remember", "Don't have one"] },
    { category: 'home', key: 'last_deep_clean', text: 'Last time you did a deep clean?', type: 'choice', options: ['This month', '1-3 months', '3-6 months', '6+ months', "Don't remember"] },
  ],
  finance: [
    { category: 'finance', key: 'last_credit_check', text: 'When did you last check your credit score?', type: 'choice', options: ['This month', '1-3 months', '3-6 months', '6+ months', 'Never', "Don't remember"] },
    { category: 'finance', key: 'tax_prep', text: 'Do you file taxes yourself or use someone?', type: 'choice', options: ['File myself', 'Use an accountant', 'Parents handle it', 'Not sure yet'] },
    { category: 'finance', key: 'subscription_audit', text: 'When did you last check for unused subscriptions?', type: 'choice', options: ['Recently', '3-6 months', '6+ months', 'Never'] },
    { category: 'finance', key: 'insurance_review', text: 'When did you last review your insurance?', type: 'choice', options: ['This year', '1-2 years', '2+ years', 'Never', "Don't have any"] },
  ],
  personal: [
    { category: 'personal', key: 'license_expiry', text: 'When does your driver\'s license expire?', type: 'input', placeholder: 'e.g. 2028' },
    { category: 'personal', key: 'has_passport', text: 'Do you have a passport?', type: 'yesno', followUp: { category: 'personal', key: 'passport_expiry', text: 'When does it expire?', type: 'input', placeholder: 'e.g. 2029' } },
    { category: 'personal', key: 'haircut_frequency', text: 'How often do you get a haircut?', type: 'choice', options: ['Every 4 weeks', 'Every 6-8 weeks', 'Every few months', 'Rarely'] },
    { category: 'personal', key: 'last_flu_shot', text: 'When was your last flu shot?', type: 'choice', options: ['This season', 'Last year', '2+ years', 'Never'] },
  ],
  pets: [
    { category: 'pets', key: 'pet_type', text: 'What kind of pet do you have?', type: 'choice', options: ['Dog', 'Cat', 'Both', 'Other'] },
    { category: 'pets', key: 'last_vet_visit', text: 'When was their last vet visit?', type: 'choice', options: ['Less than 6 months', '6-12 months', '1+ year', "Don't remember"] },
    { category: 'pets', key: 'pet_medication', text: 'Are they on any regular medication?', type: 'yesno', followUp: { category: 'pets', key: 'pet_med_refill', text: 'How often do you refill it?', type: 'choice', options: ['Monthly', 'Every 3 months', 'Every 6 months'] } },
    { category: 'pets', key: 'pet_grooming', text: 'Do they need regular grooming?', type: 'yesno', followUp: { category: 'pets', key: 'grooming_frequency', text: 'How often?', type: 'choice', options: ['Every 4 weeks', 'Every 6-8 weeks', 'Every few months'] } },
  ],
};

export default function OnboardingFlow() {
  const router = useRouter();
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

  /* Phase 1: Category selection */
  if (phase === 'categories') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full animate-fade-in">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[15px] text-ink-muted mb-10 cursor-pointer active:opacity-60 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Back
          </button>
          <h1 className="text-[32px] font-bold tracking-tight leading-tight mb-4">
            What should we track?
          </h1>
          <p className="text-ink-muted text-[16px] mb-14">
            Pick the areas that matter to you.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-14">
            {CATEGORIES.map((cat) => {
              const selected = selectedCats.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCat(cat.id)}
                  className={`text-left p-6 rounded-2xl cursor-pointer transition-all active:scale-[0.97] ${
                    selected
                      ? 'bg-mint-glow ring-[1.5px] ring-mint'
                      : 'bg-surface hover:bg-surface-hover'
                  }`}
                >
                  <div className={`mb-4 ${selected ? 'text-mint' : 'text-ink-muted'}`}>
                    <CatIcon id={cat.id} />
                  </div>
                  <div className="text-[16px] font-semibold mb-1">{cat.label}</div>
                  <div className="text-[14px] text-ink-muted leading-snug">{cat.desc}</div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPhase('questions')}
            disabled={selectedCats.length === 0}
            className="w-full h-[58px] bg-mint hover:bg-mint-hover text-black font-semibold rounded-full text-[16px] cursor-pointer transition-all disabled:opacity-20 active:scale-[0.98]"
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
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-mint mx-auto mb-10 flex items-center justify-center animate-breathe">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-[20px] font-semibold mb-3">Building your reminders</p>
          <p className="text-[16px] text-ink-muted">Just a few seconds...</p>
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
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        {/* Back + Progress */}
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-[15px] text-ink-muted mb-10 cursor-pointer active:opacity-60 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back
        </button>
        <div className="mb-14">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[15px] text-ink-muted font-medium flex items-center gap-2">
              <span className="text-mint"><CatIcon id={currentCat} size={18} /></span>
              {catInfo?.label}
            </span>
            <span className="text-[14px] text-ink-subtle">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-mint rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div key={`${activeQ.category}-${activeQ.key}`} className="animate-slide-up">
          <h2 className="text-[26px] font-bold tracking-tight leading-tight mb-12">
            {activeQ.text}
          </h2>

          {activeQ.type === 'choice' && (
            <div className="space-y-3">
              {activeQ.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleChoice(opt)}
                  className="w-full text-left px-6 py-5 rounded-2xl bg-surface hover:bg-surface-hover text-[16px] cursor-pointer transition-all active:scale-[0.98]"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {activeQ.type === 'yesno' && (
            <div className="flex gap-4">
              <button
                onClick={() => handleChoice('Yes')}
                className="flex-1 py-5 rounded-2xl bg-surface hover:bg-surface-hover text-[16px] font-medium cursor-pointer transition-all active:scale-[0.98]"
              >
                Yes
              </button>
              <button
                onClick={() => handleChoice('No')}
                className="flex-1 py-5 rounded-2xl bg-surface hover:bg-surface-hover text-[16px] font-medium cursor-pointer transition-all active:scale-[0.98]"
              >
                No
              </button>
            </div>
          )}

          {activeQ.type === 'input' && (
            <div className="flex gap-4">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInput()}
                placeholder={activeQ.placeholder}
                className="flex-1 px-6 py-5 rounded-2xl bg-surface text-ink text-[16px] focus:outline-none focus:ring-[1.5px] focus:ring-mint/50 transition-all placeholder:text-ink-subtle"
                autoFocus
              />
              <button
                onClick={handleInput}
                disabled={!inputValue.trim()}
                className="px-8 py-5 rounded-2xl bg-mint text-black font-semibold text-[16px] cursor-pointer transition-all hover:bg-mint-hover disabled:opacity-20 active:scale-[0.98]"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Skip */}
        <button
          onClick={advance}
          className="mt-12 text-[15px] text-ink-subtle hover:text-ink-muted cursor-pointer transition-all"
        >
          Skip this question
        </button>
      </div>
    </main>
  );
}
