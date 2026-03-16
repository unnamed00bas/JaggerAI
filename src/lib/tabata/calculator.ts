import type {
  Wave,
  Phase,
  TabataEquipment,
  TabataExerciseId,
  TabataBlock,
  TabataWorkoutPrescription,
  TabataExercise,
} from '../../types'
import { TABATA_EXERCISES } from '../../types'

// --- Tabata Programming Logic ---
// Integrates with the 16-week Juggernaut Method cycle.
//
// Philosophy:
// - Tabata is used as a conditioning finisher AFTER strength work
// - Volume/intensity scales inversely to the strength phase demands
// - Deload weeks use lighter Tabata or rest entirely
// - Exercise selection avoids fatiguing muscles used in the day's main lift
//
// Research basis:
// - Tabata (1996): 20s on / 10s off × 8 rounds = 4 min
// - Concurrent training studies show Tabata-style HIIT produces less
//   interference with strength gains than steady-state cardio
// - Progressive overload: 1 block (wk 1-2) → 2 blocks (wk 3-4) → 3 blocks (wk 5-6)

const STANDARD_WORK = 20
const STANDARD_REST = 10
const ROUNDS_PER_BLOCK = 8

// --- Phase-based volume prescription ---
// Accumulation: high volume strength → moderate Tabata (2 blocks)
// Intensification: heavy strength → light Tabata (1 block)
// Realization: AMRAP week → minimal Tabata (1 block, lower intensity)
// Deload: recovery → optional light Tabata (1 block) or skip

interface TabataPhaseConfig {
  blocks: number
  intensityNote: string
}

const PHASE_CONFIGS: Record<Phase, TabataPhaseConfig> = {
  accumulation: {
    blocks: 2,
    intensityNote: 'tabata.intensity.accumulation',
  },
  intensification: {
    blocks: 1,
    intensityNote: 'tabata.intensity.intensification',
  },
  realization: {
    blocks: 1,
    intensityNote: 'tabata.intensity.realization',
  },
  deload: {
    blocks: 1,
    intensityNote: 'tabata.intensity.deload',
  },
}

// --- Wave-based progression ---
// As waves get heavier (10s → 3s), Tabata focus shifts:
// 10s wave: general conditioning, higher Tabata volume
// 8s wave: balanced
// 5s wave: power-oriented exercises
// 3s wave: minimal conditioning, CNS recovery priority

const WAVE_BLOCK_MODIFIER: Record<Wave, number> = {
  '10s': 1,  // +1 block bonus
  '8s': 0,
  '5s': 0,
  '3s': -1,  // -1 block (minimum 1)
}

// --- Exercise selection by equipment ---

function getExercisesForEquipment(equipment: TabataEquipment): TabataExercise[] {
  if (equipment === 'kettlebell') {
    return TABATA_EXERCISES.filter((e) => e.equipment === 'kettlebell')
  }
  if (equipment === 'bodyweight') {
    return TABATA_EXERCISES.filter((e) => e.equipment === 'bodyweight')
  }
  // mixed: all exercises
  return [...TABATA_EXERCISES]
}

// --- Deterministic exercise selection ---
// Uses wave + phase + block index to select exercises in a rotating pattern
// so the full cycle has variety without randomness

function selectExercise(
  available: TabataExercise[],
  wave: Wave,
  phase: Phase,
  blockIndex: number,
): TabataExerciseId {
  const waveOffset = { '10s': 0, '8s': 3, '5s': 6, '3s': 9 }[wave]
  const phaseOffset = { accumulation: 0, intensification: 1, realization: 2, deload: 3 }[phase]
  const index = (waveOffset + phaseOffset + blockIndex) % available.length
  return available[index].id
}

// --- Main API ---

export function getTabataWorkout(
  wave: Wave,
  phase: Phase,
  weekNumber: number,
  equipment: TabataEquipment = 'mixed',
): TabataWorkoutPrescription {
  const phaseConfig = PHASE_CONFIGS[phase]
  const waveModifier = WAVE_BLOCK_MODIFIER[wave]
  const blockCount = Math.max(1, phaseConfig.blocks + waveModifier)

  const available = getExercisesForEquipment(equipment)
  const blocks: TabataBlock[] = []

  for (let i = 0; i < blockCount; i++) {
    const exerciseId = selectExercise(available, wave, phase, i)
    blocks.push({
      exerciseId,
      rounds: ROUNDS_PER_BLOCK,
      workSeconds: STANDARD_WORK,
      restSeconds: STANDARD_REST,
    })
  }

  const blockMinutes = (STANDARD_WORK + STANDARD_REST) * ROUNDS_PER_BLOCK / 60 // 4 min
  const restBetweenBlocks = blockCount > 1 ? (blockCount - 1) : 0 // 1 min rest between blocks
  const totalMinutes = Math.ceil(blockMinutes * blockCount + restBetweenBlocks)

  return {
    wave,
    phase,
    weekNumber,
    blocks,
    totalMinutes,
    intensityNote: phaseConfig.intensityNote,
  }
}

// --- Generate full cycle Tabata plan ---

export function generateTabataCycle(
  equipment: TabataEquipment = 'mixed',
): TabataWorkoutPrescription[] {
  const waves: Wave[] = ['10s', '8s', '5s', '3s']
  const phases: Phase[] = ['accumulation', 'intensification', 'realization', 'deload']
  const plan: TabataWorkoutPrescription[] = []
  let weekNumber = 1

  for (const wave of waves) {
    for (const phase of phases) {
      plan.push(getTabataWorkout(wave, phase, weekNumber, equipment))
      weekNumber++
    }
  }

  return plan
}

// --- Recommended weekly schedule ---
// Returns how many Tabata sessions per week based on phase
// Accumulation: 2-3 sessions/week (after upper body days ideally)
// Intensification: 2 sessions/week
// Realization: 1 session/week (before AMRAP day, skip day before test)
// Deload: 1-2 light sessions

export function getTabataFrequency(phase: Phase): { min: number; max: number } {
  switch (phase) {
    case 'accumulation':
      return { min: 2, max: 3 }
    case 'intensification':
      return { min: 1, max: 2 }
    case 'realization':
      return { min: 1, max: 1 }
    case 'deload':
      return { min: 1, max: 2 }
  }
}

// --- Calculate total Tabata time for a block ---

export function getBlockDurationSeconds(block: TabataBlock): number {
  return block.rounds * (block.workSeconds + block.restSeconds)
}

export function getTotalWorkoutSeconds(blocks: TabataBlock[]): number {
  if (blocks.length === 0) return 0
  const blockDurations = blocks.reduce((sum, b) => sum + getBlockDurationSeconds(b), 0)
  const restBetween = (blocks.length - 1) * 60 // 1 min rest between blocks
  return blockDurations + restBetween
}
