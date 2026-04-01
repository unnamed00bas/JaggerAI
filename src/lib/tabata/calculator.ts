import type {
  Block,
  TabataEquipment,
  TabataExerciseId,
  TabataBlock,
  TabataWorkoutPrescription,
  TabataExercise,
} from '../../types'
import { TABATA_EXERCISES } from '../../types'

// --- Tabata Programming Logic ---
// Standalone conditioning module — works with or without the main cycle.
//
// Uses the 12-week cycle block structure:
//   Block 1 (wk 1-4): Foundation → moderate Tabata (2 blocks)
//   Block 2 (wk 5-8): Development → higher Tabata (2-3 blocks)
//   Block 3 (wk 9-12): Peak/Test → lighter Tabata (1-2 blocks)
//
// Deload weeks (4, 8) and AMRAP test week (12) use minimal volume.
//
// Research basis:
// - Tabata (1996): 20s on / 10s off × 8 rounds = 4 min
// - Concurrent training studies show Tabata-style HIIT produces less
//   interference with strength gains than steady-state cardio

const STANDARD_WORK = 20
const STANDARD_REST = 10
const ROUNDS_PER_BLOCK = 8

// --- Block-based volume prescription ---
interface BlockConfig {
  blocks: number
  intensityNote: string
}

const BLOCK_CONFIGS: Record<Block, BlockConfig> = {
  1: { blocks: 2, intensityNote: 'tabata.intensity.block1' },
  2: { blocks: 2, intensityNote: 'tabata.intensity.block2' },
  3: { blocks: 1, intensityNote: 'tabata.intensity.block3' },
}

// Deload / AMRAP test weeks get reduced volume
const DELOAD_CONFIG: BlockConfig = { blocks: 1, intensityNote: 'tabata.intensity.deload' }

// --- Exercise selection by equipment ---

function getExercisesForEquipment(equipment: TabataEquipment): TabataExercise[] {
  if (equipment === 'mixed') return [...TABATA_EXERCISES]
  return TABATA_EXERCISES.filter((e) => e.equipment === equipment)
}

// --- Deterministic exercise selection ---
// Uses week + blockIndex to select exercises in a rotating pattern

function selectExercise(
  available: TabataExercise[],
  week: number,
  blockIndex: number,
): TabataExerciseId {
  const index = (week * 3 + blockIndex) % available.length
  return available[index].id
}

// --- Main API ---

export function getTabataWorkout(
  week: number,
  block: Block,
  equipment: TabataEquipment = 'mixed',
  isDeload = false,
  isAmrapTest = false,
): TabataWorkoutPrescription {
  const config = (isDeload || isAmrapTest) ? DELOAD_CONFIG : BLOCK_CONFIGS[block]
  const blockCount = config.blocks

  const available = getExercisesForEquipment(equipment)
  const blocks: TabataBlock[] = []

  for (let i = 0; i < blockCount; i++) {
    const exerciseId = selectExercise(available, week, i)
    blocks.push({
      exerciseId,
      rounds: ROUNDS_PER_BLOCK,
      workSeconds: STANDARD_WORK,
      restSeconds: STANDARD_REST,
    })
  }

  const blockMinutes = (STANDARD_WORK + STANDARD_REST) * ROUNDS_PER_BLOCK / 60
  const totalMinutes = Math.ceil(blockMinutes * blockCount)

  return {
    blocks,
    totalMinutes,
    intensityNote: config.intensityNote,
  }
}

// --- Generate full cycle Tabata plan ---

export function generateTabataCycle(
  equipment: TabataEquipment = 'mixed',
): TabataWorkoutPrescription[] {
  const plan: TabataWorkoutPrescription[] = []
  const deloadWeeks = [4, 8]
  const amrapWeek = 12

  for (let week = 1; week <= 12; week++) {
    const block: Block = week <= 4 ? 1 : week <= 8 ? 2 : 3
    const isDeload = deloadWeeks.includes(week)
    const isAmrap = week === amrapWeek
    plan.push(getTabataWorkout(week, block, equipment, isDeload, isAmrap))
  }

  return plan
}

// --- Recommended weekly Tabata frequency based on block ---

export function getTabataFrequency(block: Block, isDeload: boolean): { min: number; max: number } {
  if (isDeload) return { min: 1, max: 1 }
  switch (block) {
    case 1: return { min: 2, max: 3 }
    case 2: return { min: 2, max: 2 }
    case 3: return { min: 1, max: 2 }
  }
}

// --- Calculate total Tabata time for a block ---

export function getBlockDurationSeconds(block: TabataBlock): number {
  return block.rounds * (block.workSeconds + block.restSeconds)
}

export function getTotalWorkoutSeconds(blocks: TabataBlock[]): number {
  if (blocks.length === 0) return 0
  return blocks.reduce((sum, b) => sum + getBlockDurationSeconds(b), 0)
}
