import type { RowingProtocol, DayType, Phase } from '../../types'

export const ROWING_PROTOCOLS: Record<string, RowingProtocol> = {
  neuro_5x15: {
    id: 'neuro_5x15',
    nameKey: 'rowing.neuro_5x15',
    type: 'neuromuscular',
    days: ['A'],
    activePhases: [1, 2, 3, 4],
    format: '5 × 15 rows / 1:00r',
    targetSplitByPhase: {
      1: '2:08–2:12',
      2: '2:03–2:08',
      3: '1:58–2:03',
      4: '< 1:58',
    },
    targetSpmByPhase: {
      1: '21–24',
      2: '22–25',
      3: '23–26',
      4: '24–27',
    },
  },
  aerobic_15min: {
    id: 'aerobic_15min',
    nameKey: 'rowing.aerobic_15min',
    type: 'aerobic',
    days: ['B'],
    activePhases: [1, 2],
    format: '15 min / 4:00 / 1:00r',
    targetSplitByPhase: {
      1: '2:08–2:12',
      2: '2:03–2:08',
    },
    targetSpmByPhase: {
      1: '21–24',
      2: '22–25',
    },
  },
  intensive_12min: {
    id: 'intensive_12min',
    nameKey: 'rowing.intensive_12min',
    type: 'intensive',
    days: ['C'],
    activePhases: [1, 2],
    format: '12 min / 1:00 / 0:30r',
    targetSplitByPhase: {
      1: '2:08–2:12',
      2: '2:03–2:08',
    },
    targetSpmByPhase: {
      1: '21–24',
      2: '22–25',
    },
  },
  intensive_plus_7min: {
    id: 'intensive_plus_7min',
    nameKey: 'rowing.intensive_plus_7min',
    type: 'intensive_plus',
    days: ['C'],
    activePhases: [2, 3, 4],
    format: '7 min / 0:30 / 0:30r',
    targetSplitByPhase: {
      2: '2:03–2:08',
      3: '1:58–2:03',
      4: '< 1:58',
    },
    targetSpmByPhase: {
      2: '22–25',
      3: '23–26',
      4: '24–27',
    },
  },
  constant_power: {
    id: 'constant_power',
    nameKey: 'rowing.constant_power',
    type: 'neuromuscular',
    days: ['B'],
    activePhases: [2, 3, 4],
    format: 'Constant power',
    targetSplitByPhase: {
      2: '2:03–2:08',
      3: '1:58–2:03',
      4: '< 1:58',
    },
  },
  three_cadences: {
    id: 'three_cadences',
    nameKey: 'rowing.three_cadences',
    type: 'neuromuscular',
    days: ['B'],
    activePhases: [3, 4],
    format: '3 Cadences',
    targetSplitByPhase: {
      3: '1:58–2:03',
      4: '< 1:58',
    },
  },
  splits_500: {
    id: 'splits_500',
    nameKey: 'rowing.splits_500',
    type: 'test',
    days: ['A'],
    activePhases: [4],
    format: 'Splits — 500 m max effort',
    targetSplitByPhase: {
      4: '< 1:58',
    },
  },
  recovery_easy: {
    id: 'recovery_easy',
    nameKey: 'rowing.recovery_easy',
    type: 'recovery',
    days: ['A', 'B', 'C', 'D'],
    activePhases: [1, 2, 3, 4],
    format: 'Лёгкая гребля (по дистанции)',
  },
}

/**
 * Pick the primary rowing protocol for a given day and phase.
 * Falls back to recovery if nothing matches.
 */
export function getProtocolForDay(
  dayType: DayType,
  phase: Phase,
): RowingProtocol {
  if (dayType === 'D' || phase === 'deload') {
    return ROWING_PROTOCOLS.recovery_easy
  }
  const activePhase = phase as 1 | 2 | 3 | 4

  const priorities: Record<DayType, string[]> = {
    A: ['splits_500', 'neuro_5x15'],
    B: ['three_cadences', 'constant_power', 'aerobic_15min'],
    C: ['intensive_plus_7min', 'intensive_12min'],
    D: ['recovery_easy'],
  }

  for (const id of priorities[dayType]) {
    const p = ROWING_PROTOCOLS[id]
    if (p && p.activePhases.includes(activePhase)) return p
  }
  return ROWING_PROTOCOLS.recovery_easy
}

/** Parse "mm:ss" to total seconds (integer). Accepts "m:ss" too. */
export function parseSplit(input: string): number | null {
  const m = input.trim().match(/^(\d{1,2}):(\d{2}(?:\.\d+)?)$/)
  if (!m) return null
  return parseInt(m[1], 10) * 60 + parseFloat(m[2])
}

/** Format seconds as mm:ss (rounded to whole seconds). */
export function formatSplit(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
