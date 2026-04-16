# JaggerAI

Mobile-first PWA for a personal 16-week strength + rowing program with an AI coach.

## Program

- **16 weeks** split into 4 phases (Adaptation → Volume → Intensity → Peak) + deload week 16.
- **4 training days/week**: A (Pull), B (Lower), C (Push), D (Recovery).
- **Rowing protocols** (Technogym) per phase/day: neuromuscular, aerobic, intensive, test.
- **Automatic progression** by completion quality.
- **AI coach** with full context (history, weights, PRs, rowing) via Claude / OpenAI / GLM.

## Features

- Start/continue active workout with rest timer (vibration on finish).
- Phase-aware prescriptions: sets × reps × target weight (with gravitron assist, added weight, plank time).
- Rowing session logger with 500 m splits and Technogym screenshot attachment.
- Weight + reps + assist quick-adjust controls.
- Progress charts: exercise weight, rowing pace/power, weekly tonnage, personal records.
- Full 16-week plan with recommended weights per week.
- Dark theme default (gym-friendly), RU + EN localization.
- Local-first storage (IndexedDB via Dexie) — works offline.

## Tech Stack

React + TypeScript + Vite + Tailwind CSS + Dexie (IndexedDB) + Zustand + Recharts + react-i18next + Workbox.

## Quick Start

```bash
npm install
npm run dev
```
