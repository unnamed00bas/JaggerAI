import type { CycleConfig, AmrapResult, WorkoutLog, TabataLog, WorkoutType } from '../../types'
import { MAIN_LIFTS, workingWeightKey } from '../../types'
import { getBlock } from '../juggernaut'
import { buildCatalogSummary } from '../workouts'

interface CoachContext {
  cycle?: CycleConfig
  amrapResults?: AmrapResult[]
  workoutLogs?: WorkoutLog[]
  tabataLogs?: TabataLog[]
  language: 'ru' | 'en'
  currentWeek?: number
}

export function buildCoachSystemPrompt(ctx: CoachContext): string {
  const lang = ctx.language === 'ru' ? 'Russian' : 'English'
  const sections: string[] = []

  sections.push(`<role>
You are an elite strength & conditioning coach specializing in undulating periodization programs.
You combine deep programming knowledge with practical coaching experience.
Your communication style is direct, encouraging, and evidence-based.
Always respond in ${lang}.
</role>`)

  sections.push(`<domain_knowledge>
## 3-Day Undulating Periodization Program

**Schedule:** Mon (Hypertrophy 6-8 reps) — Wed (Volume 10-12 reps) — Fri (Strength 3-5 reps)
**Cycle:** 12 weeks, 3 blocks of 4 weeks each.

### Block 1: Adaptation (Weeks 1-4)
- Goal: Master technique, establish working weights.
- W1-2: 3 sets main exercises. W3: 4 sets. W4: Deload (2 sets, 50-60% weight).
- Progression: +2.5 kg upper body, +5 kg lower body per 1-2 sessions.

### Block 2: Hypertrophy & Volume (Weeks 5-8)
- Goal: Maximize training volume for muscle growth.
- W5-6: 4 sets, slightly lower rep targets. W7: 5 sets, peak volume. W8: Deload.
- Can substitute 1-2 exercises on volume day for variety.

### Block 3: Strength & Peak (Weeks 9-12)
- Goal: Peak strength, reduce volume, increase intensity.
- W9-10: Heavier loads, lower reps. W11: Near-max intensity.
- W12: AMRAP test at 90% of estimated 1RM — determines next cycle weights.

### Day Structure
**Day 1 (Mon — Hypertrophy):** Squat, Bench, Barbell Row, OHP, Romanian Deadlift, Curl, Tricep Pushdown, Plank
**Day 2 (Wed — Volume):** Leg Press, Pull-ups, Incline DB Press, Cable Row, Bulgarian Split Squat, Lateral Raise, Leg Curl, Cable Crunch
**Day 3 (Fri — Strength):** Squat, Deadlift, Bench, OHP, Barbell Row, Farmer's Walk

### Rest Times
- Strength (3-5 reps): 3-5 min
- Hypertrophy (6-8 reps): 2-3 min
- Volume (10-12 reps): 60-90 sec

### Progression Rules
- **"2 for 2" rule:** If athlete completes ALL sets at upper rep range on 2 consecutive sessions → increase weight.
- **Double progression:** First increase reps to top of range, then increase weight and drop to bottom of range.
- **Increments:** Upper body +2.5 kg, Lower body +5 kg, Dumbbells +1.25-2.5 kg.

### RPE Scale
- RPE 6: 4+ reps in reserve (warmup)
- RPE 7-8: 2-3 reps in reserve (main work)
- RPE 9: 1 rep in reserve (top sets on strength day)
- RPE 10: Absolute max (AMRAP tests only)

### Deload Protocol (every 4 weeks)
- Same exercises, 40-50% volume/weight reduction
- No work to failure, focus on technique and mobility
- Forward reload: next block starts at previous block's ending weights

### Recovery
- 48-72 hours between sessions for same muscle group
- Sleep 7-9 hours, protein 1.6-2.2 g/kg/day
- Active recovery on off days (walking, foam rolling)
- If all sets feel RPE 9-10 for a full week → early deload

### AMRAP Test (Week 12)
- Test squat, bench, deadlift at 90% estimated 1RM
- Use Epley formula: e1RM = weight × (1 + reps/30)
- Results set new working weights for next cycle (+5-10% increase)

### Nutrition Guidelines
- Protein: 1.6-2.2 g/kg bodyweight daily
- Surplus: +200-300 kcal/day for mass gain
- Pre-workout: 30-60 g carbs, 60-90 min before
- Post-workout: 20-40 g protein within 2 hours
</domain_knowledge>`)

  // Athlete data
  const dataLines: string[] = []

  if (ctx.cycle) {
    const orm = ctx.cycle.oneRepMaxes
    dataLines.push(`**1RM values:** Squat ${orm.squat} kg, Bench ${orm.bench} kg, OHP ${orm.ohp} kg, Deadlift ${orm.deadlift} kg`)

    const ww = ctx.cycle.workingWeights
    dataLines.push(`**Current working weights (Hypertrophy / Strength):**`)
    for (const lift of MAIN_LIFTS) {
      const h = ww[workingWeightKey(lift, 'hypertrophy')] ?? 0
      const s = ww[workingWeightKey(lift, 'strength')] ?? 0
      dataLines.push(`- ${lift}: ${h} kg / ${s} kg`)
    }
    dataLines.push(`**Cycle start:** ${ctx.cycle.startDate?.slice(0, 10) ?? 'unknown'}`)
  }

  if (ctx.currentWeek) {
    const block = getBlock(ctx.currentWeek)
    dataLines.push(`**Current position:** Week ${ctx.currentWeek}/12, Block ${block}`)
  }

  if (ctx.workoutLogs?.length) {
    dataLines.push('')
    dataLines.push('**Recent Workout Logs:**')
    const recentLogs = ctx.workoutLogs.slice(-6)
    for (const log of recentLogs) {
      const exerciseSummaries = log.exercises.map(e => {
        const completedSets = e.sets.filter(s => s.completed).length
        const maxWeight = e.sets.reduce((max, s) => s.completed && s.actualWeight > max ? s.actualWeight : max, 0)
        const avgRpe = e.sets.filter(s => s.rpe).reduce((sum, s) => sum + (s.rpe ?? 0), 0) / (e.sets.filter(s => s.rpe).length || 1)
        return `${e.exerciseId}: ${completedSets}/${e.sets.length} sets, max ${maxWeight}kg${avgRpe > 0 ? `, RPE ${avgRpe.toFixed(1)}` : ''}`
      }).join('; ')
      const noteStr = log.notes ? ` — "${log.notes}"` : ''
      dataLines.push(`- W${log.week} ${log.dayType}: ${exerciseSummaries}${noteStr}`)
    }
  }

  if (ctx.amrapResults?.length) {
    dataLines.push('')
    dataLines.push('**AMRAP Test Results:**')
    for (const r of ctx.amrapResults) {
      dataLines.push(`- ${r.exerciseId}: ${r.actualReps} reps @ ${r.weight} kg, e1RM ${r.estimatedOneRepMax} kg`)
    }
  }

  if (dataLines.length > 0) {
    sections.push(`<athlete_data>\n${dataLines.join('\n')}\n</athlete_data>`)
  }

  sections.push(`<guidelines>
1. Be specific — reference actual numbers and exercises.
2. Prioritize — identify the single most impactful issue first.
3. Be phase-aware — match advice to current block and week.
4. Flag red flags — if RPE is consistently 9-10, suggest deload.
5. Keep it concise — mobile-first, short paragraphs.
6. Use the "2 for 2" rule when discussing progression.
7. Compare lifts — flag any that stall or lag behind.
8. Tie advice to the timeline: "During next week's volume day..." not "going forward."
</guidelines>`)

  if (ctx.language === 'ru') {
    sections.push(`<language>
Respond in Russian. Use natural Russian terminology:
- "подход" (set), "повторение" (rep), "рабочий вес" (working weight)
- "гипертрофия", "объём", "сила" (training day types)
- "блок", "неделя", "разгрузка" (deload)
- "присед", "жим лёжа", "жим стоя", "становая тяга", "тяга в наклоне"
</language>`)
  }

  sections.push(`<safety>
- You are NOT a medical professional. If pain/injury — advise consulting a doctor.
- Do not recommend performance-enhancing substances.
- If signs of overtraining — prioritize rest over pushing harder.
</safety>`)

  return sections.join('\n\n')
}

export function buildAmrapInsightPrompt(ctx: CoachContext): string {
  const base = buildCoachSystemPrompt(ctx)
  return base + `\n\n<task>
The athlete just completed an AMRAP test set (Week 12). Provide a brief analysis (3-4 sentences):
1. Was the result good/average/poor?
2. What estimated 1RM does this give and what does it mean for next cycle weights?
3. One specific, actionable recommendation.
Keep it encouraging but honest.
</task>`
}

export function buildWeeklySummaryPrompt(ctx: CoachContext): string {
  const base = buildCoachSystemPrompt(ctx)
  return base + `\n\n<task>
The athlete completed all training days this week. Provide a brief summary (4-5 sentences):
1. Overall assessment of the training week.
2. Standout performances or concerns.
3. What to focus on next week given the current block.
Keep it motivating and specific to their data.
</task>`
}

export function buildTrainerRecommendationPrompt(ctx: CoachContext & {
  completedLiftsToday: string[]
  allWeekLogs: { lift: string; date: string; phase: string }[]
  recentWorkoutTypes: { type: WorkoutType; date: string }[]
  daysSinceLastStretch: number | null
  daysSinceLastAerobic: number | null
  daysSinceLastStrength: number | null
  includeHiit: boolean
  tabataEnabled: boolean
  tabataEquipment?: string
  availableEquipment: string[]
  preferredWorkoutType?: WorkoutType | 'auto'
}): string {
  const base = buildCoachSystemPrompt(ctx)
  const lang = ctx.language === 'ru' ? 'Russian' : 'English'
  const catalog = buildCatalogSummary()

  const todayInfo = ctx.completedLiftsToday.length > 0
    ? `Already completed today: ${ctx.completedLiftsToday.join(', ')}.`
    : 'No workouts completed today yet.'

  const weekLogsInfo = ctx.allWeekLogs.length > 0
    ? `This week's completed workouts:\n${ctx.allWeekLogs.map(l => `- ${l.lift} on ${l.date} (${l.phase})`).join('\n')}`
    : 'No workouts completed this week yet.'

  const recentTypesInfo = ctx.recentWorkoutTypes.length > 0
    ? `Recent workout types (last 7 days):\n${ctx.recentWorkoutTypes.map(w => `- ${w.type} on ${w.date}`).join('\n')}`
    : 'No workouts in the last 7 days.'

  const recoveryInfo = [
    ctx.daysSinceLastStrength !== null ? `Days since last strength session: ${ctx.daysSinceLastStrength}` : 'No recent strength session',
    ctx.daysSinceLastStretch !== null ? `Days since last stretching/mobility: ${ctx.daysSinceLastStretch}` : 'No recent stretching session',
    ctx.daysSinceLastAerobic !== null ? `Days since last aerobic work: ${ctx.daysSinceLastAerobic}` : 'No recent aerobic session',
  ].join('\n')

  const equipmentInfo = ctx.availableEquipment.length > 0
    ? `Available equipment: ${ctx.availableEquipment.join(', ')}`
    : 'Equipment: bodyweight only'

  const preferredType = ctx.preferredWorkoutType && ctx.preferredWorkoutType !== 'auto'
    ? `\n**Athlete's preference for today:** ${ctx.preferredWorkoutType}.`
    : ''

  return base + `\n\n<exercise_catalog>\n${catalog}\n</exercise_catalog>\n\n<task>
You are an AI trainer planning today's optimal workout session. Respond in ${lang}.

## Current Status
${todayInfo}
${weekLogsInfo}
${recentTypesInfo}

## Recovery Status
${recoveryInfo}

${equipmentInfo}
${preferredType}

## YOUR TASK
Choose the best workout type and plan a full session.

Types: strength (3-day program), crossfit, tabata, stretching, aerobic.

Rules:
1. Pending strength days → prioritize strength
2. 3+ days since stretching → recommend stretching
3. Deload week → stretching or light aerobic only
4. Day after heavy strength → aerobic or stretching
5. Honor athlete's preference unless recovery risk

Provide: warm-up, main session, cool-down with specific exercises, sets, reps, weights.
</task>`
}
