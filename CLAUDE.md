# JaggerAI — Strength & Rowing Tracker

## Project Overview

Mobile-first PWA for a personal 16-week strength + rowing program with an AI
coach. Single-user, local-first, deployed to GitHub Pages.

## Tech Stack

- **Frontend**: React 19 + TypeScript, Vite bundler
- **PWA**: vite-plugin-pwa / Workbox, offline-first
- **Styling**: Tailwind CSS v4, dark theme default (manual toggle + system)
- **Charts**: Recharts
- **State**: Zustand (persisted via localStorage)
- **Local Storage**: IndexedDB via Dexie.js (only storage — no cloud sync)
- **LLM**: multi-provider (Claude, OpenAI, GLM) — user supplies own API key
- **i18n**: react-i18next (Russian + English)
- **Routing**: react-router-dom (HashRouter)
- **Hosting**: GitHub Pages (static SPA)
- **Testing**: Vitest

No backend, no auth, no Supabase, no network sync. All user data stays on device.

## Core Domain: 16-Week Strength + Rowing Program

### Cycle Structure

- **16 weeks**, 4 phases × 4 weeks + deload week 16
  - Phase 1 — Adaptation (weeks 1–4)
  - Phase 2 — Volume (weeks 5–8)
  - Phase 3 — Intensity (weeks 9–12)
  - Phase 4 — Peak (weeks 13–15)
  - Deload — week 16
- **4 training days / week** in order A → B → D → C:
  - **A — Pull** (lats, rear delts, biceps) — orange `#f07a4a`
  - **B — Lower** (squats, deadlift, core) — yellow-green `#c8f135`
  - **C — Push** (chest, front delts, triceps) — cyan `#4af0c4`
  - **D — Recovery** (light cardio + stretching) — grey `#888888`
- Each session: ~45 min + rowing (except day D).

### Exercises

Catalog in `src/lib/exercises/catalog.ts`. Each exercise carries a
`phases` map (1/2/3/4/deload) with a `PhasePrescription`:
- `sets`, `reps`, target `weightKg` or `assistKg` (gravitron), `addedKg`
  (dips/pullups), `durationSec` (plank), `restSec`, RPE target, notes.

Main lifts: `gravitron_pullup`, `seated_cable_row`, `face_pull`,
`dumbbell_curl`, `front_squat`, `deadlift`, `plank`, `bench_press`,
`overhead_press`, `dips`.

### Rowing (Technogym)

8 protocols in `src/lib/rowing/protocols.ts`, each mapped to specific
day/phase combinations with target 500 m split and SPM. Logged with splits,
average/max power, SPM, level, calories, optional screenshot.

### Progression Rules

- **Clean sets at RPE ≤ 8** → +2.5 kg next session.
- **Grinding last reps** → hold weight.
- **Missed target reps** → −5 %.
- **Form breakdown** → −10 %, optional regression.
- **Missed 1 day** → repeat session; **missed 3+ days** → drop back 1 week.
- All weights rounded to nearest 2.5 kg.

Logic in `src/lib/program/progression.ts`.

### Personal Records

Auto-detected on workout/rowing save:
- **Strength**: best `weight × reps` and Brzycki-estimated 1RM
  (`weight × 36 / (37 − reps)`, capped at 12 reps).
- **Rowing**: best 2 km time, best 500 m split, highest avg power.

Persisted to `db.personalRecords` via `src/lib/records/detect.ts`.

## Key Features

1. **Dashboard** — current week/phase, today's day card (color-coded),
   weekly progress, streak, last rowing summary.
2. **Active Workout** — phase-aware prescriptions, +/− weight & reps,
   rest timer with vibration, per-exercise notes.
3. **Rowing Logger** — 500 m splits, Technogym metrics, optional screenshot
   attachment (stored as data URL in IndexedDB).
4. **History** — filterable A/B/C/D, top sets summary.
5. **Plan** — full 16-week grid with per-day, per-exercise prescriptions.
6. **Analytics** — exercise weight trend, rowing pace/power, weekly tonnage,
   PR list.
7. **AI Coach** — chat with full training context (profile, phase, recent
   workouts, working weights, PRs, last rowing) via Claude/OpenAI/GLM.
8. **Settings** — profile, cycle week, theme, language, rest timer, LLM
   provider/model/key, data export (JSON).

## Architecture Principles

- **Local-first**: every feature works offline. No remote DB, no sync.
- **Mobile-first**: phone widths 360–428 px primary target.
- **Type-safe**: strict TypeScript, avoid `any`.
- **Domain in `lib/`**: components stay presentational; business rules live
  in `src/lib/program`, `src/lib/exercises`, `src/lib/rowing`, `src/lib/records`.
- **i18n keys**: never hardcode UI strings.
- **Accessible**: WCAG 2.1 AA, tap targets ≥ 44 px.

## Project Structure

```
src/
  components/
    ui/              # buttons, cards, inputs
    layout/          # AppShell, BottomNav
    workout/         # ActiveWorkout, RowingEntry, RestTimerBar,
                     # WorkoutHistory, WorkoutStartPicker, PlanPage
    analytics/       # AnalyticsPage
    settings/        # SettingsPage
    ai/              # CoachPage
  hooks/             # useRestTimer, useTheme
  stores/            # profileStore, workoutStore, settingsStore, coachChatStore
  lib/
    exercises/       # day/exercise catalog + stretching + recovery cardio
    rowing/          # Technogym protocols
    program/         # phase math, progression rules, weekly schedule
    records/         # PR detection
    db/              # Dexie schema (workouts, rowingSessions, personalRecords)
    llm/             # provider abstraction + coach system prompt
    ui/              # day-color helpers
  i18n/locales/      # ru.json, en.json
  types/             # domain types
```

## Commands

```bash
npm install --legacy-peer-deps   # install (peer-dep conflict on vite 8)
npm run dev                      # dev server
npm run build                    # production build
npm run preview                  # preview dist/
npm run test                     # vitest
npm run type-check               # tsc --noEmit
npm run lint                     # eslint
```

## Theming

Dark theme default. Day colors exposed as CSS custom properties in
`src/index.css`:

```css
--color-day-a: #f07a4a;  /* Pull */
--color-day-b: #c8f135;  /* Lower */
--color-day-c: #4af0c4;  /* Push */
--color-day-d: #888888;  /* Recovery */
--color-accent-500: #f07a4a;
```

Helper `DAY_COLORS` in `src/lib/ui/dayStyle.ts` maps `DayType` →
Tailwind arbitrary-value class strings.

## Code Style

- Functional components, hooks, named exports.
- Business logic in `lib/`, not components.
- UI strings via i18n keys only.
- Tests for `src/lib/program` (phase, progression, rounding, 1RM).
