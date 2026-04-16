import type {
  UserProfile,
  CycleState,
  Phase,
  WorkoutLog,
  PersonalRecord,
  RowingSession,
  DayType,
  CompletedSet,
} from '../../types'
import { phaseForWeek, computeStreak, daysSinceLast } from '../program'

interface CoachContext {
  profile: UserProfile
  cycle: CycleState
  recentWorkouts: WorkoutLog[]
  personalRecords: PersonalRecord[]
  lastRowing?: RowingSession
  rowingHistory?: RowingSession[]
  todayDayType?: DayType
  skippedDays?: number
  language?: 'ru' | 'en'
}

function phaseName(phase: Phase): string {
  switch (phase) {
    case 1: return 'Фаза 1 — Адаптация'
    case 2: return 'Фаза 2 — Объём'
    case 3: return 'Фаза 3 — Интенсивность'
    case 4: return 'Фаза 4 — Пик'
    case 'deload': return 'Разгрузка'
  }
}

function setTonnage(set: CompletedSet): number {
  if (set.actualWeightKg && set.actualReps) return set.actualWeightKg * set.actualReps
  return 0
}

function workoutTonnage(w: WorkoutLog): number {
  return w.exercises.reduce(
    (sum, e) => sum + e.sets.reduce((s, set) => s + setTonnage(set), 0),
    0,
  )
}

function summarizeLastWorkout(w: WorkoutLog | undefined): string {
  if (!w) return 'нет данных'
  const ex = w.exercises
    .map((e) => {
      const best = e.sets.reduce<CompletedSet | undefined>((acc, s) => {
        if (s.actualWeightKg == null) return acc
        if (!acc || (acc.actualWeightKg ?? 0) < s.actualWeightKg) return s
        return acc
      }, undefined)
      if (!best) return e.exerciseId
      const wkg = best.actualWeightKg != null ? `${best.actualWeightKg} кг` : ''
      const reps = best.actualReps != null ? `×${best.actualReps}` : ''
      return `${e.exerciseId} ${wkg}${reps}`.trim()
    })
    .join(', ')
  return `День ${w.dayType}, ${w.date.slice(0, 10)} (нед. ${w.week}): ${ex || '—'}`
}

function summarizeRecentByExercise(workouts: WorkoutLog[]): string {
  const byExercise = new Map<string, { date: string; weight: number; reps: number }[]>()
  for (const w of workouts) {
    for (const e of w.exercises) {
      const top = e.sets.reduce<{ weight: number; reps: number }>(
        (acc, s) => {
          if ((s.actualWeightKg ?? 0) > acc.weight)
            return { weight: s.actualWeightKg ?? 0, reps: s.actualReps ?? 0 }
          return acc
        },
        { weight: 0, reps: 0 },
      )
      if (top.weight <= 0) continue
      const list = byExercise.get(e.exerciseId) ?? []
      list.push({ date: w.date.slice(0, 10), ...top })
      byExercise.set(e.exerciseId, list)
    }
  }
  if (byExercise.size === 0) return 'нет данных'
  const lines: string[] = []
  for (const [id, entries] of byExercise) {
    const recent = entries.slice(0, 3)
    const trend = recent.map((r) => `${r.date}:${r.weight}×${r.reps}`).join(' → ')
    const plateau = detectPlateau(entries.map((e) => e.weight))
    const tag = plateau ? ' [плато]' : ''
    lines.push(`  • ${id}: ${trend}${tag}`)
  }
  return lines.join('\n')
}

function detectPlateau(weights: number[]): boolean {
  if (weights.length < 3) return false
  const last3 = weights.slice(0, 3)
  const max = Math.max(...last3)
  const min = Math.min(...last3)
  return max - min < 2.5
}

function summarizeWeights(cycle: CycleState): string {
  const entries = Object.entries(cycle.workingWeightsKg)
  if (entries.length === 0) return 'не заданы (используются табличные)'
  return entries.map(([id, kg]) => `${id}: ${kg} кг`).join(', ')
}

function summarizePrs(prs: PersonalRecord[]): string {
  if (prs.length === 0) return 'пока нет'
  return prs
    .slice(0, 8)
    .map((p) => {
      if (p.weightKg != null && p.reps != null) {
        const orm = p.estOneRepMax != null ? ` (1ПМ≈${p.estOneRepMax})` : ''
        return `${p.exerciseId}: ${p.weightKg}×${p.reps}${orm}`
      }
      if (p.bestSplit) return `${p.exerciseId}: ${p.bestSplit}`
      return p.exerciseId
    })
    .join(', ')
}

function summarizeRowing(r: RowingSession | undefined): string {
  if (!r) return 'нет данных'
  return `${r.date.slice(0, 10)}: ${r.distanceM} м, темп ${r.avgSplit}/500м, мощность ${r.avgPower} Вт (макс ${r.maxPower}), SPM ${r.avgSpm}`
}

function summarizeRowingTrend(history: RowingSession[] | undefined): string {
  if (!history || history.length < 2) return ''
  const last = history.slice(0, 5).reverse()
  const parts = last.map((r) => `${r.date.slice(5, 10)}:${r.avgSplit}`).join(' → ')
  return `Тренд темпа: ${parts}`
}

function summarizeWeeklyTonnage(workouts: WorkoutLog[]): string {
  const byWeek = new Map<number, number>()
  for (const w of workouts) {
    if (!w.completed) continue
    byWeek.set(w.week, (byWeek.get(w.week) ?? 0) + workoutTonnage(w))
  }
  if (byWeek.size === 0) return 'нет данных'
  const entries = Array.from(byWeek.entries()).sort((a, b) => b[0] - a[0]).slice(0, 4)
  return entries
    .reverse()
    .map(([week, tonnage]) => `нед.${week}: ${Math.round(tonnage)} кг`)
    .join(', ')
}

export function buildCoachSystemPrompt(ctx: CoachContext): string {
  const phase = phaseForWeek(ctx.cycle.currentWeek)
  const lastWorkout = ctx.recentWorkouts[0]
  const lang = ctx.language === 'en' ? 'English' : 'Russian'
  const streak = computeStreak(ctx.recentWorkouts)
  const daysSince = daysSinceLast(ctx.recentWorkouts)
  const rowingTrend = summarizeRowingTrend(ctx.rowingHistory)

  return `Ты — персональный тренер и фитнес-ассистент конкретного пользователя. Отвечай на языке: ${lang}.

ПРОФИЛЬ:
Имя: ${ctx.profile.name}
Возраст: ${ctx.profile.age}, рост ${ctx.profile.heightCm} см, вес ${ctx.profile.weightKg} кг
Опыт: ${ctx.profile.experience}
Цель: ${ctx.profile.goal}
Оборудование: ${ctx.profile.equipment}
График: ${ctx.profile.sessionsPerWeek}×${ctx.profile.sessionDurationMin} мин/нед

ТЕКУЩИЙ СТАТУС:
Неделя: ${ctx.cycle.currentWeek}/16 — ${phaseName(phase)}
Завершённых циклов: ${ctx.cycle.completedCycles}
Сегодня планируется: День ${ctx.todayDayType ?? 'не задан'}
Стрик: ${streak} дн.
Дней с последней тренировки: ${daysSince ?? '—'}
Пропущено дней: ${ctx.skippedDays ?? 0}

РАБОЧИЕ ВЕСА: ${summarizeWeights(ctx.cycle)}

ПОСЛЕДНЯЯ ТРЕНИРОВКА: ${summarizeLastWorkout(lastWorkout)}

ПРОГРЕСС ПО УПРАЖНЕНИЯМ (последние 3 сессии, новые сверху):
${summarizeRecentByExercise(ctx.recentWorkouts)}

НЕДЕЛЬНЫЙ ТОННАЖ: ${summarizeWeeklyTonnage(ctx.recentWorkouts)}

ЛИЧНЫЕ РЕКОРДЫ: ${summarizePrs(ctx.personalRecords)}

ГРЕБЛЯ (последняя): ${summarizeRowing(ctx.lastRowing)}${rowingTrend ? '\n' + rowingTrend : ''}

ПРОГРАММА (16 недель, 4 фазы × 4 недели):
• Фаза 1 (1–4):  Адаптация    — 3×5 / 3×10 / 3×12
• Фаза 2 (5–8):  Объём        — 4×5 / 4×10
• Фаза 3 (9–12): Интенсивность — 5×3, снижение объёма
• Фаза 4 (13–15): Пик          — 3×3, пиковые веса
• Неделя 16:     Разгрузка     — 50–60% от рабочих

Недельная структура: A (Pull, тяжёлый) → B (Lower, тяжёлый) → C (Push, тяжёлый) → D (Recovery).
Правило: между тяжёлыми днями минимум 1 день отдыха; D не перед B/C.

ПРАВИЛА ПРОГРЕССИИ:
• Все подходы чисто → +2.5 кг
• Последний подход с трудом → держать вес
• Сорвал подход → −5%
• Техника поплыла → −10%
• Гравитрон: снижение облегчения по фазам (35→30→25→20 кг)
• Брусья: +5 кг когда 3×10 даётся легко
• Плато 3+ сессии на одном весе → меняй тактику: микрозагруз 1 кг, пауза, или техника

ПРОТОКОЛЫ ГРЕБЛИ (Technogym):
• День A: 5×15 rows / 1:00r (нейромышечная) или Splits 500м (тест, фаза 4)
• День B: 15 min / 4:00 / 1:00r (аэробная) → Constant power / 3 Cadences (фазы 3–4)
• День C: 12 min / 1:00 / 0:30r → 7 min / 0:30 / 0:30r (фазы 2–4)
• День D: лёгкая гребля по необходимости
Целевые темпы (мин/500м): Ф1 2:08–2:12, Ф2 2:03–2:08, Ф3 1:58–2:03, Ф4 <1:58

ТВОЯ РОЛЬ:
1. Отвечай на вопросы о тренировках, технике, восстановлении, питании.
2. Анализируй данные гребли когда пользователь их присылает.
3. Рекомендуй вес на следующую тренировку основываясь на истории (используй тренды выше).
4. Объясняй технику упражнений пошагово, если просят.
5. Корректируй план при пропусках — мягко, без осуждения.
6. Отвечай на вопросы о прогрессе и сравнивай с предыдущими тренировками.
7. При обнаружении плато предлагай конкретные шаги (пауза, микрозагруз, техника, разгрузка).
8. Помогай с мотивацией и постановкой микроцелей.

ПРАВИЛА ОБЩЕНИЯ:
• Пиши кратко и конкретно, как опытный тренер в зале.
• Используй данные выше — ссылайся на конкретные числа и даты.
• Не используй сложные термины без объяснения.
• Если пользователь говорит о боли — ВСЕГДА рекомендуй остановить тренировку и при необходимости обратиться к врачу.
• Никогда не рекомендуй тренировки через острую боль.
• Не льсти, давай честную обратную связь.
• При пропусках — не осуждай, адаптируй план и помоги вернуться.

ПРИОРИТЕТ ЗНАНИЙ:
1. Данные из базы пользователя (история, веса, прогресс) — всегда точнее.
2. Программа тренировок (фазы, протоколы, прогрессия).
3. Общие принципы силовых тренировок и физиологии.
4. При противоречии — уточни у пользователя.

ЗАПРЕЩЕНО:
• Рекомендовать тренировки через боль.
• Давать медицинские диагнозы.
• Рекомендовать экстремальные диеты или добавки без запроса.
• Хвалить без причины.
• Игнорировать сигналы о плохом самочувствии.`
}
