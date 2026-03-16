# JaggerAI - Juggernaut Method Training Tracker

## Project Overview

Mobile-first PWA for calculating, tracking, and analyzing Juggernaut Method strength training cycles with AI-powered coaching advice. Personal use app deployed to GitHub Pages.

## Tech Stack

- **Frontend**: React 18+ with TypeScript, Vite as bundler
- **PWA**: Workbox for service worker, offline-first architecture
- **Styling**: Tailwind CSS with auto dark/light theme (system preference + manual toggle)
- **Charts**: Recharts for training analytics visualization
- **State Management**: Zustand (lightweight, persistent stores)
- **Local Storage**: IndexedDB via Dexie.js for training data
- **Cloud Sync**: Supabase (PostgreSQL + Auth) for backup and cross-device sync
- **LLM Integration**: Multi-provider support (Claude API, OpenAI API, configurable)
- **i18n**: react-i18next (Russian + English)
- **Hosting**: GitHub Pages (static SPA)
- **Testing**: Vitest + React Testing Library

## Core Domain: Juggernaut Method 2.0

### Program Structure
- **16-week cycle** with 4 waves: 10s, 8s, 5s, 3s
- **4 phases per wave**: Accumulation, Intensification, Realization, Deload
- **4 main lifts**: Squat, Bench Press, Overhead Press, Deadlift
- **Two variants**: Classic JM 2.0 and Inverted JM

### Percentage Tables (Classic JM 2.0)

#### Accumulation Phase
| Wave | Sets x Reps | % of TM |
|------|-------------|---------|
| 10s  | 5 x 10      | 60%     |
| 8s   | 5 x 8       | 65%     |
| 5s   | 6 x 5       | 70%     |
| 3s   | 7 x 3       | 75%     |

#### Intensification Phase
| Wave | Warmup Sets              | Work Sets    | % of TM        |
|------|--------------------------|-------------|-----------------|
| 10s  | 55%x5, 60%x3             | 67.5% x 3x10 | 67.5%          |
| 8s   | 62.5%x5, 67.5%x3         | 72.5% x 3x8  | 72.5%          |
| 5s   | 65%x2, 70%x1             | 77.5% x 4x5  | 77.5%          |
| 3s   | 72.5%x2, 77.5%x1         | 82.5% x 5x3  | 82.5%          |

#### Realization Phase (AMRAP)
| Wave | Ramping Sets                              | AMRAP Set |
|------|-------------------------------------------|-----------|
| 10s  | 50%x5, 60%x3, 70%x1                      | 75% x AMRAP |
| 8s   | 50%x5, 60%x3, 70%x2, 75%x1               | 80% x AMRAP |
| 5s   | 50%x5, 60%x3, 70%x2, 75%x1, 80%x1        | 85% x AMRAP |
| 3s   | 50%x5, 60%x3, 70%x2, 75%x1, 80%x1, 85%x1 | 90% x AMRAP |

#### Deload Phase
| Wave | Sets                     |
|------|--------------------------|
| 10s  | 40%x5, 50%x5, 60%x5     |
| 8s   | 40%x5, 50%x5, 60%x5     |
| 5s   | 40%x5, 50%x5, 60%x5     |
| 3s   | 40%x5, 50%x5, 60%x5     |

### Inverted Juggernaut Method
Inverted version swaps sets and reps in Accumulation:
| Wave | Classic    | Inverted   |
|------|-----------|------------|
| 10s  | 5x10 @60% | 10x5 @60%  |
| 8s   | 5x8 @65%  | 8x5 @65%   |
| 5s   | 6x5 @70%  | 5x6 @70%   |
| 3s   | 7x3 @75%  | 3x7 @75%   |

### Progression Formula
- Training Max (TM) = 90% of actual/tested 1RM
- After Realization AMRAP: New TM = Old TM + (Reps over target x Weight increment)
  - Weight increment per extra rep: ~1.25-2.5 kg depending on lift
- Estimated 1RM from AMRAP: Epley formula = Weight x (1 + Reps/30)

### Weight Rounding
- All calculated weights rounded to nearest 2.5 kg

## Key Features

1. **Cycle Calculator**: Auto-generate full 16-week program from 1RM or TM inputs
2. **Workout Tracker**: Log sets, reps, weights with timer between sets
3. **AMRAP Logger**: Record realization AMRAP results, auto-calculate new TM
4. **Progress Analytics**: Charts for TM progression, estimated 1RM, volume/tonnage, AMRAP history
5. **LLM Coach**: AI analysis of progress, weak points, recovery/nutrition advice, program adjustments
6. **Offline-First**: Full functionality without internet, sync when connected
7. **Cloud Sync**: Supabase for data backup and multi-device access

## Architecture Principles

- **Offline-first**: All core features must work without internet
- **Mobile-first**: Design for phone screens (360-428px width primary)
- **Component-based**: Small, focused React components
- **Type-safe**: Strict TypeScript, no `any` types
- **Simple state**: Zustand stores, avoid unnecessary complexity
- **Accessible**: WCAG 2.1 AA compliance

## Project Structure

```
src/
  components/       # React components
    ui/             # Reusable UI primitives
    layout/         # App shell, navigation
    workout/        # Workout-related components
    analytics/      # Charts and analytics
    settings/       # Settings screens
    ai/             # LLM chat/advice UI
  hooks/            # Custom React hooks
  stores/           # Zustand stores
  lib/
    juggernaut/     # Core JM calculation engine
    llm/            # LLM provider abstraction
    sync/           # Supabase sync logic
    db/             # Dexie.js database schema
  i18n/             # Translation files (ru, en)
  types/            # TypeScript type definitions
  utils/            # Utility functions
```

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

## Code Style

- Functional components with hooks
- Named exports (not default)
- Descriptive variable names in English
- UI text via i18n keys, never hardcoded strings
- Business logic in `lib/`, not in components
- Tests for calculation engine (critical path)
