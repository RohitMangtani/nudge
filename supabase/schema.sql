CREATE TABLE nudge_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT 'Friend',
  firebase_uid text UNIQUE,
  onboarding_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE nudge_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES nudge_users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category, key)
);

CREATE TABLE nudge_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES nudge_users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  recurring boolean DEFAULT false,
  recurrence_label text,
  completed boolean DEFAULT false,
  snoozed_until date,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_nudge_answers_user ON nudge_answers(user_id);
CREATE INDEX idx_nudge_reminders_user ON nudge_reminders(user_id);
CREATE INDEX idx_nudge_reminders_due ON nudge_reminders(user_id, due_date) WHERE completed = false;

-- v2: recurring reminders, check-ins, tracking columns
ALTER TABLE nudge_reminders
  ADD COLUMN source text NOT NULL DEFAULT 'ai',
  ADD COLUMN parent_id uuid REFERENCES nudge_reminders(id) ON DELETE SET NULL,
  ADD COLUMN recurrence_interval text,
  ADD COLUMN completed_at timestamptz;

ALTER TABLE nudge_answers
  ADD COLUMN updated_at timestamptz DEFAULT now();

ALTER TABLE nudge_users
  ADD COLUMN last_generated_at timestamptz;

CREATE TABLE nudge_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES nudge_users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  key text NOT NULL,
  prompt text NOT NULL,
  due_date date NOT NULL,
  dismissed boolean DEFAULT false,
  answered boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_nudge_checkins_user ON nudge_checkins(user_id);
CREATE INDEX idx_nudge_checkins_active ON nudge_checkins(user_id) WHERE dismissed = false AND answered = false;
