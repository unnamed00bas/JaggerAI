# JaggerAI - Development Plan

## Phase 1: Foundation & Core Calculator (MVP)

### 1.1 Project Setup
- Initialize Vite + React + TypeScript project
- Configure Tailwind CSS with dark/light theme (system preference + toggle)
- Set up PWA with Workbox (manifest, service worker, icons)
- Configure Vitest + React Testing Library
- Set up ESLint + Prettier
- Configure GitHub Pages deployment (gh-pages branch or GitHub Actions)

### 1.2 Core Calculation Engine (`src/lib/juggernaut/`)
- Implement Training Max calculator (1RM input -> 90% TM)
- Implement percentage tables for all 4 waves x 4 phases (Classic JM 2.0)
- Implement Inverted JM variant (swapped sets/reps)
- Implement weight rounding to nearest 2.5 kg
- Implement AMRAP progression formula (new TM from realization results)
- Implement estimated 1RM calculator (Epley formula)
- **Unit tests** for all calculation functions (critical path)

### 1.3 Data Layer (`src/lib/db/`)
- Define TypeScript types for Cycle, Wave, Phase, Workout, Set, Lift
- Set up Dexie.js (IndexedDB) database schema
- CRUD operations for cycles, workouts, AMRAP results
- Zustand stores for app state (current cycle, active workout, settings)

### 1.4 Basic UI Shell
- App layout with bottom navigation (mobile-first)
- Navigation: Dashboard, Workout, Analytics, AI Coach, Settings
- i18n setup with react-i18next (Russian + English)
- Theme toggle component

---

## Phase 2: Workout Tracker UI

### 2.1 Cycle Setup Flow
- Screen: Input 1RM for each lift (Squat, Bench, OH Press, Deadlift)
- Select method variant (Classic / Inverted)
- Generate and display full 16-week program overview
- Week-by-week calendar view

### 2.2 Workout Day Screen
- Display today's workout: lift, sets, reps, target weights
- Checkable set list (mark sets as completed)
- AMRAP input on Realization weeks (rep count entry)
- Rest timer between sets (configurable duration)
- Workout completion summary

### 2.3 Cycle Overview
- Visual timeline of 16 weeks (current week highlighted)
- Wave/Phase indicators with color coding
- Completed vs upcoming workouts
- Quick navigation to any week

---

## Phase 3: Analytics & Charts

### 3.1 Training Max Progression
- Line chart: TM for each lift across waves/cycles
- Show percentage change between waves

### 3.2 Estimated 1RM Chart
- Line chart: calculated e1RM from AMRAP results over time
- Epley formula visualization

### 3.3 Volume/Tonnage Chart
- Bar chart: weekly tonnage (sets x reps x weight) per lift
- Cumulative volume across cycle

### 3.4 AMRAP Results
- Bar chart: reps achieved vs target reps on each Realization
- Performance trend analysis

---

## Phase 4: LLM AI Coach

### 4.1 LLM Provider Abstraction (`src/lib/llm/`)
- Abstract interface for LLM providers
- Claude API integration
- OpenAI API integration
- API key storage in settings (localStorage, encrypted)
- Rate limiting and error handling

### 4.2 AI Coach UI (`src/components/ai/`)
- Chat interface for asking questions
- Pre-built prompt templates:
  - "Analyze my progress this cycle"
  - "What are my weak points?"
  - "Suggest recovery strategies"
  - "Should I adjust my TM?"
- Context injection: automatically include training history in prompts

### 4.3 Smart Insights
- Auto-generated insights after AMRAP (performance vs expectation)
- Weekly training summary with AI commentary
- Nutrition/recovery tips based on training phase (Accumulation = eat more, etc.)
- Program adjustment suggestions (when to reset TM, when to switch variants)

---

## Phase 5: Cloud Sync (Supabase)

### 5.1 Supabase Setup
- Create Supabase project and database schema
- Row-level security policies
- Auth setup (email/password or magic link)

### 5.2 Sync Logic (`src/lib/sync/`)
- Offline-first: local DB is source of truth
- Sync on reconnect: push local changes, pull remote changes
- Conflict resolution strategy (last-write-wins with timestamps)
- Sync status indicator in UI

### 5.3 Auth UI
- Login/Register screens
- Optional: can use app fully without account (local only)
- Settings: enable/disable sync

---

## Phase 5B: Health & Wearable Integration (Supabase Backend)

> Depends on Phase 5 (Supabase infrastructure must be in place)

### 5B.1 Garmin API Backend (Supabase Edge Functions)

#### Garmin Developer Program Setup
- Apply to Garmin Connect Developer Program (approval ~2 business days)
- Register application, obtain Consumer Key and Consumer Secret
- Configure OAuth 1.0a credentials in Supabase secrets (vault)

#### Supabase Edge Functions for Garmin Health API
- `garmin-auth`: OAuth 1.0a flow — initiate user authorization, handle callback, store tokens in `garmin_tokens` table
- `garmin-webhook`: Receive push notifications from Garmin Health API (steps, heart rate, sleep, stress, Body Battery)
- `garmin-activity-webhook`: Receive activity/workout data push (including .FIT file URLs)
- `garmin-deregister`: Handle user deregistration callback

#### Supabase Database Schema (Garmin)
```sql
-- Garmin OAuth tokens
create table garmin_tokens (
  user_id uuid references auth.users primary key,
  access_token text not null,
  token_secret text not null,
  garmin_user_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Daily health summaries from Garmin
create table garmin_daily_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  calendar_date date not null,
  steps integer,
  resting_heart_rate integer,
  avg_heart_rate integer,
  max_heart_rate integer,
  sleep_duration_seconds integer,
  sleep_score integer,
  stress_avg integer,
  body_battery_high integer,
  body_battery_low integer,
  active_calories integer,
  raw_payload jsonb,
  created_at timestamptz default now(),
  unique(user_id, calendar_date)
);

-- Activity/workout data from Garmin
create table garmin_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  garmin_activity_id text not null,
  activity_type text,
  start_time timestamptz,
  duration_seconds integer,
  avg_heart_rate integer,
  max_heart_rate integer,
  calories integer,
  fit_file_url text,
  raw_payload jsonb,
  created_at timestamptz default now(),
  unique(user_id, garmin_activity_id)
);
```

- Row-Level Security (RLS) policies: users can only read their own health data
- Indexes on `(user_id, calendar_date)` and `(user_id, start_time)`

### 5B.2 Garmin Training API — Push Workouts to Watch

#### Supabase Edge Function: `garmin-push-workout`
- Accept Juggernaut Method workout definition from PWA
- Convert to Garmin Training API workout format (structured workout with steps: warmup, work sets with reps/weight, rest intervals)
- POST to Garmin Training API → syncs to user's Garmin watch
- Map JM phases to Garmin workout step types:
  - Warmup sets → `warmup` step type
  - Work sets → `active` step type with target reps and weight notes
  - AMRAP sets → `active` step type with open-ended rep target
  - Deload → `cooldown` step type

#### Supabase Edge Function: `garmin-schedule-workouts`
- Accept full 16-week cycle from PWA
- Batch-create Garmin calendar entries for each workout day
- Support rescheduling when user shifts workout days

### 5B.3 Apple Health Integration (Shortcuts → Supabase Pipeline)

#### Supabase Edge Function: `apple-health-ingest`
- HTTPS POST endpoint that receives JSON payload from Apple Shortcuts
- Validate bearer token (simple shared secret per user, stored in Supabase vault)
- Parse and store health metrics:
  - Steps, active energy, resting heart rate
  - Sleep analysis (asleep duration, time in bed)
  - HRV (heart rate variability)
  - Workout sessions (type, duration, calories, avg HR)

#### Supabase Database Schema (Apple Health)
```sql
create table apple_health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  metric_date date not null,
  steps integer,
  active_energy_kcal numeric,
  resting_heart_rate integer,
  hrv_ms numeric,
  sleep_asleep_seconds integer,
  sleep_in_bed_seconds integer,
  raw_payload jsonb,
  created_at timestamptz default now(),
  unique(user_id, metric_date)
);

create table apple_health_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  workout_type text,
  start_time timestamptz,
  duration_seconds integer,
  calories integer,
  avg_heart_rate integer,
  raw_payload jsonb,
  created_at timestamptz default now()
);
```

- RLS: users read only their own data
- Provide Apple Shortcut template (.shortcut file) for users to install:
  - Runs daily on schedule (or manually)
  - Reads last 24h of HealthKit data
  - POSTs JSON to `apple-health-ingest` endpoint

### 5B.4 PWA Frontend — Health Dashboard

#### Health Data API Client (`src/lib/health/`)
- `garminClient.ts` — fetch Garmin summaries and activities from Supabase
- `appleHealthClient.ts` — fetch Apple Health metrics from Supabase
- `healthTypes.ts` — TypeScript types for health data (DailySummary, Activity, SleepData, etc.)
- `healthUtils.ts` — normalize data from different sources into common format

#### Health Dashboard UI (`src/components/health/`)
- `HealthOverview.tsx` — daily card: steps, HR, sleep, Body Battery, HRV
- `RecoveryScore.tsx` — composite recovery indicator (sleep + HRV + stress + Body Battery)
- `HealthTrends.tsx` — Recharts line/bar charts: sleep trend, resting HR trend, step trend
- `GarminConnect.tsx` — OAuth flow trigger, connection status, disconnect
- `AppleHealthSetup.tsx` — instructions + downloadable Shortcut link, token display, test endpoint

#### Integration with AI Coach (Phase 4 extension)
- Inject health context into LLM prompts:
  - "Recovery score is low (poor sleep + high stress) — suggest lighter accessory work"
  - "HRV trending down over 5 days — consider extra deload day"
  - "Body Battery was 85 at workout start — good readiness, push AMRAP hard"
- Pre-built prompt: "How is my recovery affecting my training?"

### 5B.5 .FIT File Export/Import (Client-Side, No Backend)

#### Dependencies
- `@garmin/fitsdk` — official Garmin FIT SDK for JavaScript (read + write)

#### Export: JM Workout → .FIT File (`src/lib/health/fitExport.ts`)
- Generate .FIT workout file from Juggernaut Method workout definition
- Include structured workout steps: warmup, work sets (reps, weight targets), rest periods
- User downloads .FIT file → manually imports into Garmin Connect
- Support batch export of full week or full cycle

#### Import: .FIT Activity → Workout Log (`src/lib/health/fitImport.ts`)
- Parse .FIT activity file exported from Garmin Connect
- Extract: exercise type, sets, reps, weight (if recorded), heart rate zones, duration
- Match to JM workout and auto-fill workout log
- UI: drag-and-drop or file picker on Workout Day screen

### 5B.6 Supabase Infrastructure

#### Edge Functions Deployment
```
supabase/functions/
  garmin-auth/index.ts
  garmin-webhook/index.ts
  garmin-activity-webhook/index.ts
  garmin-push-workout/index.ts
  garmin-schedule-workouts/index.ts
  garmin-deregister/index.ts
  apple-health-ingest/index.ts
```

#### Environment / Secrets (Supabase Vault)
- `GARMIN_CONSUMER_KEY`, `GARMIN_CONSUMER_SECRET`
- `APPLE_HEALTH_SHARED_SECRET` (per-user token for Shortcuts auth)

#### Database Migrations
- Migration file for all health-related tables
- RLS policies for each table
- Indexes for query performance

#### Monitoring & Error Handling
- Edge Function logging to Supabase dashboard
- Webhook retry handling (Garmin may retry failed deliveries)
- Stale data detection: flag if no Apple Health data received in >48h

---

## Phase 6: Polish & Production

### 6.1 PWA Enhancements
- App icons (multiple sizes)
- Splash screen
- "Add to Home Screen" prompt
- Offline indicator
- Background sync for pending changes

### 6.2 UX Polish
- Loading skeletons
- Animations/transitions (Framer Motion or CSS)
- Haptic feedback on mobile (Vibration API)
- Pull-to-refresh for sync

### 6.3 Testing & QA
- E2e tests for critical flows (create cycle, log workout, AMRAP progression)
- Cross-browser testing (Chrome, Safari mobile)
- Performance audit (Lighthouse)
- Accessibility audit

### 6.4 Deployment
- GitHub Actions CI/CD pipeline
- Auto-deploy to GitHub Pages on push to main
- Environment variables for Supabase/API keys

---

## Priority Order

Start with **Phase 1 + 2** (usable calculator + tracker in ~1-2 sessions), then:
- Phase 3 (analytics) — visual feedback motivates
- Phase 4 (AI coach) — the differentiating feature
- Phase 5 (cloud sync) — backup and multi-device
- Phase 5B (health & wearables) — Garmin API + Apple Health via Supabase, .FIT file support
- Phase 6 (polish) — ongoing

## Tech Decisions Summary

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Bundler | Vite | Fast, great React/TS support |
| UI Framework | React 18 | Ecosystem, PWA support |
| Styling | Tailwind CSS | Utility-first, dark mode built-in |
| State | Zustand | Simple, persistent, no boilerplate |
| Local DB | Dexie.js (IndexedDB) | Offline-first, structured queries |
| Cloud | Supabase | Free tier, PostgreSQL, auth included |
| Charts | Recharts | React-native, declarative |
| i18n | react-i18next | Industry standard |
| LLM | Multi-provider | Flexibility, no vendor lock-in |
| Tests | Vitest | Fast, Vite-native |
