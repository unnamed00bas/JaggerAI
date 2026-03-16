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
