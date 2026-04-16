import type { ExerciseDef, DayType, DayCatalog, StretchExercise } from '../../types'

// ─────────────────────────────────────────────────────────────
// DAY A — PULL
// ─────────────────────────────────────────────────────────────

const gravitronPullup: ExerciseDef = {
  id: 'gravitron_pullup',
  name: 'Подтягивания в гравитоне',
  muscles: ['lats', 'biceps', 'rhomboids'],
  equipment: 'gravitron',
  tracking: ['sets', 'reps', 'assist_weight_kg'],
  progressionRule: 'reduce_assist',
  restSec: 90,
  phases: {
    1: { sets: 3, reps: 10, assist_kg: 35 },
    2: { sets: 4, reps: 10, assist_kg: 30 },
    3: { sets: 4, reps: 8,  assist_kg: 25 },
    4: { sets: 3, reps: 6,  assist_kg: 20 },
    deload: { sets: 2, reps: 8, assist_kg: 35 },
  },
  technique: {
    steps: [
      'Возьмись за перекладину хватом чуть шире плеч, руки прямые',
      'Сведи лопатки вниз и назад — держи весь подход',
      'Тяни локти вниз и к бёдрам, пока грудь не коснётся перекладины',
      'Опускайся медленно — 2–3 секунды',
    ],
    errors: [
      'Тянуть локти к ушам',
      'Раскачка корпусом',
    ],
  },
}

const seatedCableRow: ExerciseDef = {
  id: 'seated_cable_row',
  name: 'Горизонтальная тяга сидя',
  muscles: ['mid_back', 'rhomboids', 'biceps'],
  equipment: 'cable_machine',
  tracking: ['sets', 'reps', 'weight_kg'],
  progressionRule: 'add_weight',
  restSec: 90,
  phases: {
    1: { sets: 3, reps: 12, weight_kg: 45 },
    2: { sets: 4, reps: 12, weight_kg: 50 },
    3: { sets: 4, reps: 10, weight_kg: 55 },
    4: { sets: 3, reps: 8,  weight_kg: 60 },
    deload: { sets: 2, reps: 10, weight_kg: 40 },
  },
  technique: {
    steps: [
      'Сядь, ноги на упорах, колени слегка согнуты, спина прямая',
      'Возьмись за рукоять нейтральным хватом, руки вытянуты — старт',
      'Тяни рукоять к поясу, локти у корпуса',
      'В конечной точке сведи лопатки — 1 секунда',
      'Медленно верни в исходное — 2 секунды',
    ],
    errors: [
      'Откидывание корпуса назад',
      'Округление поясницы',
    ],
  },
}

const facePull: ExerciseDef = {
  id: 'face_pull',
  name: 'Face pull — тяга к лицу',
  muscles: ['rear_delts', 'rotators'],
  equipment: 'cable_machine',
  tracking: ['sets', 'reps', 'weight_kg'],
  progressionRule: 'add_weight_slow',
  restSec: 60,
  phases: {
    1: { sets: 3, reps: 15, weight_kg: 15 },
    2: { sets: 3, reps: 15, weight_kg: 17.5 },
    3: { sets: 4, reps: 15, weight_kg: 20 },
    4: { sets: 3, reps: 15, weight_kg: 20 },
    deload: { sets: 2, reps: 12, weight_kg: 12.5 },
  },
  technique: {
    steps: [
      'Установи блок на уровне лица, возьмись за верёвочную рукоять',
      'Тяни к лицу, разводя локти строго в стороны — выше уровня плеч',
      'В конечной точке разверни кисти наружу — 1 секунда',
      'Медленно верни, не давай локтям упасть',
    ],
    errors: [
      'Локти ниже плеч',
      'Слишком большой вес',
    ],
  },
}

const dumbbellCurl: ExerciseDef = {
  id: 'dumbbell_curl',
  name: 'Сгибание рук с гантелями',
  muscles: ['biceps'],
  equipment: 'dumbbells',
  tracking: ['sets', 'reps', 'weight_kg_per_hand'],
  progressionRule: 'add_weight',
  restSec: 60,
  phases: {
    1: { sets: 2, reps: 12, weight_kg: 14 },
    2: { sets: 3, reps: 12, weight_kg: 16 },
    3: { sets: 3, reps: 10, weight_kg: 18 },
    4: { sets: 3, reps: 8,  weight_kg: 20 },
    deload: { sets: 2, reps: 10, weight_kg: 12 },
  },
  technique: {
    steps: [
      'Стоя, гантели в опущенных руках, локти прижаты к корпусу',
      'Поднимай к плечам, вращая кисти ладонями вверх',
      'Пауза 1 секунда в верхней точке',
      'Опускай медленно — 2 секунды',
    ],
    errors: [
      'Раскачка корпусом',
      'Локти уходят вперёд',
    ],
  },
}

// ─────────────────────────────────────────────────────────────
// DAY B — LOWER
// ─────────────────────────────────────────────────────────────

const frontSquat: ExerciseDef = {
  id: 'front_squat',
  name: 'Фронтальный присед со штангой',
  muscles: ['quads', 'glutes', 'core', 'upper_back'],
  equipment: 'barbell',
  tracking: ['sets', 'reps', 'weight_kg'],
  progressionRule: 'add_weight',
  restSec: 120,
  phases: {
    1: { sets: 3, reps: 5, note: 'Найти рабочий вес, техника приоритет' },
    2: { sets: 4, reps: 5 },
    3: { sets: 5, reps: 3 },
    4: { sets: 3, reps: 3, note: 'Пиковые веса' },
    deload: { sets: 3, reps: 5, weight_modifier: 0.6 },
  },
  technique: {
    steps: [
      'Гриф лежит на передних дельтах, локти как можно выше и вперёд — параллельно полу',
      'Стопы чуть шире плеч, носки 20–30° наружу',
      'Приседай — колени строго по линии носков, не заваливай внутрь',
      'Опускайся до параллели или ниже, торс максимально вертикальный',
      'Вставай через пятки, локти не опускать',
    ],
    errors: [
      'Локти падают — штанга скатывается, опасно',
      'Наклон торса вперёд',
      'Колени внутрь',
    ],
  },
}

const deadlift: ExerciseDef = {
  id: 'deadlift',
  name: 'Становая тяга',
  muscles: ['hamstrings', 'glutes', 'lower_back', 'traps'],
  equipment: 'barbell',
  tracking: ['sets', 'reps', 'weight_kg'],
  progressionRule: 'add_weight',
  restSec: 120,
  note: 'После фронтального приседа — вес чуть консервативнее обычного',
  phases: {
    1: { sets: 3, reps: 5 },
    2: { sets: 4, reps: 5 },
    3: { sets: 5, reps: 3 },
    4: { sets: 3, reps: 3 },
    deload: { sets: 3, reps: 5, weight_modifier: 0.6 },
  },
  technique: {
    steps: [
      'Ступни на ширине бёдер, гриф над серединой стопы',
      'Нагнись, возьмись за гриф — руки прямые, голени касаются грифа',
      'Вдох, напряги живот, спина нейтральная',
      'Тяни вдоль голеней вверх, одновременно выпрямляя ноги и корпус',
      'Наверху — бёдра вперёд, плечи назад',
    ],
    errors: [
      'Округление поясницы — критически опасно',
      'Гриф далеко от ног',
      'Рывок с пола',
    ],
  },
}

const plank: ExerciseDef = {
  id: 'plank',
  name: 'Планка на предплечьях',
  muscles: ['core', 'transverse', 'glutes'],
  equipment: 'bodyweight',
  tracking: ['sets', 'duration_sec'],
  progressionRule: 'add_time',
  restSec: 45,
  phases: {
    1: { sets: 3, duration_sec: 45 },
    2: { sets: 3, duration_sec: 60 },
    3: { sets: 4, duration_sec: 60 },
    4: { sets: 3, duration_sec: 75 },
    deload: { sets: 2, duration_sec: 45 },
  },
  technique: {
    steps: [
      'Локти строго под плечами, предплечья параллельны',
      'Тело — прямая линия от головы до пят',
      'Напряги ягодицы и живот одновременно',
      'Шея нейтральная, смотри в пол перед собой',
      'Дыши равномерно, не задерживай',
    ],
    errors: [
      'Таз вверх — нагрузка с кора уходит',
      'Провис поясницы',
    ],
  },
}

// ─────────────────────────────────────────────────────────────
// DAY C — PUSH
// ─────────────────────────────────────────────────────────────

const benchPress: ExerciseDef = {
  id: 'bench_press',
  name: 'Жим штанги лёжа',
  muscles: ['chest', 'front_delts', 'triceps'],
  equipment: 'barbell',
  tracking: ['sets', 'reps', 'weight_kg'],
  progressionRule: 'add_weight',
  restSec: 120,
  phases: {
    1: { sets: 3, reps: 5 },
    2: { sets: 4, reps: 5 },
    3: { sets: 5, reps: 3 },
    4: { sets: 3, reps: 3 },
    deload: { sets: 3, reps: 5, weight_modifier: 0.6 },
  },
  technique: {
    steps: [
      'Ляг: глаза под грифом, ноги на полу, поясница с небольшим прогибом',
      'Хват чуть шире плеч, большой палец обхватывает гриф',
      'Лопатки вниз и назад, прижми к скамье — держи весь подход',
      'Опусти к нижней части груди — локти ~45° к корпусу',
      'Жми вверх и чуть назад к стойкам — выдох на усилии',
    ],
    errors: [
      'Локти перпендикулярно телу — нагрузка на суставы',
      'Лопатки не сведены',
      'Отбив грифом от груди',
    ],
  },
}

const overheadPress: ExerciseDef = {
  id: 'overhead_press',
  name: 'Жим штанги стоя (OHP)',
  muscles: ['delts', 'triceps', 'core'],
  equipment: 'barbell',
  tracking: ['sets', 'reps', 'weight_kg'],
  progressionRule: 'add_weight',
  restSec: 120,
  phases: {
    1: { sets: 3, reps: 5 },
    2: { sets: 4, reps: 5 },
    3: { sets: 5, reps: 3 },
    4: { sets: 3, reps: 3 },
    deload: { sets: 3, reps: 5, weight_modifier: 0.6 },
  },
  technique: {
    steps: [
      'Хват чуть шире плеч, гриф на ключицах, локти чуть впереди',
      'Ноги на ширине бёдер, напряги ягодицы и кор',
      'Жми: голову чуть назад, чтобы гриф прошёл мимо лица',
      'Как гриф прошёл — голову вперёд, жми строго вверх',
      'Наверху: уши между руками, гриф над серединой стопы',
    ],
    errors: [
      'Прогиб поясницы назад',
      'Жим вперёд вместо вверх',
    ],
  },
}

const dips: ExerciseDef = {
  id: 'dips',
  name: 'Отжимания на брусьях',
  muscles: ['triceps', 'lower_chest'],
  equipment: 'parallel_bars',
  tracking: ['sets', 'reps', 'added_weight_kg'],
  progressionRule: 'add_weight_or_reps',
  restSec: 75,
  phases: {
    1: { sets: 3, reps: 10, added_weight_kg: 0 },
    2: { sets: 3, reps: 12, added_weight_kg: 0 },
    3: { sets: 4, reps: 10, added_weight_kg: 5 },
    4: { sets: 3, reps: 8,  added_weight_kg: 10 },
    deload: { sets: 2, reps: 10, added_weight_kg: 0 },
  },
  technique: {
    steps: [
      'Руки прямые, корпус вертикальный, плечи не у ушей',
      'Опускайся медленно: локти назад вдоль корпуса — 3 секунды',
      'Опускайся до угла ~90° в локтях',
      'Жми вверх до полного выпрямления',
    ],
    errors: [
      'Локти в стороны — риск для плеч',
      'Корпус наклонён вперёд',
    ],
  },
}

// ─────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────

export const EXERCISES: Record<string, ExerciseDef> = {
  [gravitronPullup.id]: gravitronPullup,
  [seatedCableRow.id]: seatedCableRow,
  [facePull.id]: facePull,
  [dumbbellCurl.id]: dumbbellCurl,
  [frontSquat.id]: frontSquat,
  [deadlift.id]: deadlift,
  [plank.id]: plank,
  [benchPress.id]: benchPress,
  [overheadPress.id]: overheadPress,
  [dips.id]: dips,
}

export const DAY_CATALOG: Record<DayType, DayCatalog> = {
  A: {
    dayType: 'A',
    exerciseIds: ['gravitron_pullup', 'seated_cable_row', 'face_pull', 'dumbbell_curl'],
    rowingProtocolIds: ['neuro_5x15', 'splits_500'],
  },
  B: {
    dayType: 'B',
    exerciseIds: ['front_squat', 'deadlift', 'plank'],
    rowingProtocolIds: ['aerobic_15min', 'constant_power', 'three_cadences'],
  },
  C: {
    dayType: 'C',
    exerciseIds: ['bench_press', 'overhead_press', 'dips'],
    rowingProtocolIds: ['intensive_12min', 'intensive_plus_7min'],
  },
  D: {
    dayType: 'D',
    exerciseIds: [],
    rowingProtocolIds: ['recovery_easy'],
  },
}

// ─────────────────────────────────────────────────────────────
// Stretching (Day D)
// ─────────────────────────────────────────────────────────────

export const DAY_D_CARDIO = {
  id: 'assault_bike_easy',
  name: 'Assault bike — лёгкое кардио',
  equipment: 'assault_bike',
  durationMin: 10,
  targetHr: '120–130 bpm',
  intensity: 'conversational',
} as const

export const STRETCHING: StretchExercise[] = [
  { id: 'thoracic_extension',   name: 'Разгибание грудного отдела на скамье',  durationSec: 120, sets: 2, target: 'Грудной отдел' },
  { id: 'shoulder_crossbody',   name: 'Растяжка плеча поперёк груди',          durationSec: 45,  sets: 2, sides: true, target: 'Задние дельты' },
  { id: 'lat_hang',             name: 'Вис на турнике с наклоном',             durationSec: 30,  sets: 3, sides: true, target: 'Широчайшие' },
  { id: 'pigeon_pose',          name: 'Поза голубя',                            durationSec: 90,  sets: 2, sides: true, target: 'Ягодичные, ротаторы' },
  { id: 'hip_flexor_lunge',     name: 'Выпад — сгибатели бедра',                durationSec: 60,  sets: 2, sides: true, target: 'Подвздошно-поясничная' },
  { id: 'lateral_lunge',        name: 'Боковой выпад',                           durationSec: 45,  sets: 2, sides: true, target: 'Приводящие' },
  { id: 'forward_fold',         name: 'Наклон вперёд стоя',                      durationSec: 60,  sets: 2, target: 'Задняя поверхность бедра' },
  { id: 'knees_to_chest',       name: 'Колени к груди лёжа',                    durationSec: 60,  sets: 1, target: 'Поясница' },
  { id: 'supine_twist',         name: 'Скрутка лёжа',                            durationSec: 45,  sets: 2, sides: true, target: 'Ротаторы позвоночника' },
  { id: 'childs_pose',          name: 'Детская поза',                            durationSec: 90,  sets: 1, target: 'Поясница, широчайшие' },
  { id: 'neck_tilt',            name: 'Наклон шеи в сторону',                   durationSec: 30,  sets: 2, sides: true, target: 'Шея, верхние трапеции' },
]

export function getExercise(id: string): ExerciseDef | undefined {
  return EXERCISES[id]
}
