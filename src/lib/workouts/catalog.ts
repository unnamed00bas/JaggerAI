import type {
  CrossfitWod,
  StretchExercise,
  AerobicWorkout,
} from '../../types'

// ─────────────────────────────────────────────────────────
// Workout Exercise Catalog
// Reference database for AI trainer to compose daily plans.
// Covers: CrossFit WODs, stretching/mobility, aerobic work.
// ─────────────────────────────────────────────────────────

// ── CROSSFIT BENCHMARK WODs ──

export const CROSSFIT_WODS: CrossfitWod[] = [
  // --- The Girls (classic benchmarks) ---
  {
    id: 'fran',
    name: 'Fran',
    format: 'for_time',
    timeCap: 10,
    exercises: [
      { name: 'Thrusters', reps: '21-15-9', weight: '43/30 kg' },
      { name: 'Pull-ups', reps: '21-15-9' },
    ],
    difficulty: 'intermediate',
    targetMuscles: ['legs', 'push', 'pull'],
    scalingNotes: 'Scale thrusters to 30/20 kg, use band-assisted pull-ups or ring rows',
  },
  {
    id: 'cindy',
    name: 'Cindy',
    format: 'amrap',
    timeCap: 20,
    exercises: [
      { name: 'Pull-ups', reps: 5 },
      { name: 'Push-ups', reps: 10 },
      { name: 'Air Squats', reps: 15 },
    ],
    difficulty: 'beginner',
    targetMuscles: ['pull', 'push', 'legs'],
    scalingNotes: 'Ring rows instead of pull-ups, knee push-ups',
  },
  {
    id: 'helen',
    name: 'Helen',
    format: 'rounds_for_time',
    rounds: 3,
    exercises: [
      { name: 'Run', reps: '400m' },
      { name: 'Kettlebell Swings', reps: 21, weight: '24/16 kg' },
      { name: 'Pull-ups', reps: 12 },
    ],
    difficulty: 'intermediate',
    targetMuscles: ['legs', 'posterior', 'pull', 'core'],
    scalingNotes: 'Row 500m instead of run, lighter KB, band pull-ups',
  },
  {
    id: 'grace',
    name: 'Grace',
    format: 'for_time',
    timeCap: 10,
    exercises: [
      { name: 'Clean & Jerk', reps: 30, weight: '61/43 kg' },
    ],
    difficulty: 'advanced',
    targetMuscles: ['full', 'legs', 'push'],
    scalingNotes: 'Scale to 43/30 kg, power clean + push press',
  },
  {
    id: 'diane',
    name: 'Diane',
    format: 'for_time',
    exercises: [
      { name: 'Deadlifts', reps: '21-15-9', weight: '102/70 kg' },
      { name: 'Handstand Push-ups', reps: '21-15-9' },
    ],
    difficulty: 'advanced',
    targetMuscles: ['posterior', 'push', 'shoulders'],
    scalingNotes: 'Scale DL to 70/47 kg, pike push-ups or DB press instead of HSPU',
  },
  {
    id: 'annie',
    name: 'Annie',
    format: 'for_time',
    exercises: [
      { name: 'Double-unders', reps: '50-40-30-20-10' },
      { name: 'Sit-ups', reps: '50-40-30-20-10' },
    ],
    difficulty: 'beginner',
    targetMuscles: ['core', 'legs'],
    scalingNotes: 'Single-unders x2 instead of double-unders',
  },
  {
    id: 'jackie',
    name: 'Jackie',
    format: 'for_time',
    exercises: [
      { name: 'Row', reps: '1000m' },
      { name: 'Thrusters', reps: 50, weight: '20/15 kg' },
      { name: 'Pull-ups', reps: 30 },
    ],
    difficulty: 'intermediate',
    targetMuscles: ['full', 'legs', 'push', 'pull'],
    scalingNotes: 'Row 750m, lighter thrusters, ring rows',
  },
  {
    id: 'karen',
    name: 'Karen',
    format: 'for_time',
    exercises: [
      { name: 'Wall Ball Shots', reps: 150, weight: '9/6 kg ball' },
    ],
    difficulty: 'intermediate',
    targetMuscles: ['legs', 'push', 'core'],
    scalingNotes: 'Scale to 100 reps or lighter ball',
  },
  {
    id: 'barbara',
    name: 'Barbara',
    format: 'rounds_for_time',
    rounds: 5,
    exercises: [
      { name: 'Pull-ups', reps: 20 },
      { name: 'Push-ups', reps: 30 },
      { name: 'Sit-ups', reps: 40 },
      { name: 'Air Squats', reps: 50 },
    ],
    difficulty: 'intermediate',
    targetMuscles: ['pull', 'push', 'core', 'legs'],
    scalingNotes: '3 rounds, reduce reps by half, band pull-ups',
  },
  {
    id: 'elizabeth',
    name: 'Elizabeth',
    format: 'for_time',
    exercises: [
      { name: 'Squat Cleans', reps: '21-15-9', weight: '61/43 kg' },
      { name: 'Ring Dips', reps: '21-15-9' },
    ],
    difficulty: 'advanced',
    targetMuscles: ['legs', 'pull', 'push'],
    scalingNotes: 'Power cleans, bar dips or bench dips',
  },
  // --- Bodyweight / Minimal Equipment WODs ---
  {
    id: 'murph',
    name: 'Murph',
    format: 'for_time',
    timeCap: 60,
    exercises: [
      { name: 'Run', reps: '1 mile' },
      { name: 'Pull-ups', reps: 100 },
      { name: 'Push-ups', reps: 200 },
      { name: 'Air Squats', reps: 300 },
      { name: 'Run', reps: '1 mile' },
    ],
    difficulty: 'advanced',
    targetMuscles: ['full'],
    scalingNotes: 'Half reps, no vest, partition as 20 rounds of 5-10-15',
  },
  {
    id: 'fight_gone_bad',
    name: 'Fight Gone Bad',
    format: 'rounds_for_time',
    rounds: 3,
    exercises: [
      { name: 'Wall Ball Shots', reps: '1 min', weight: '9/6 kg' },
      { name: 'Sumo Deadlift High Pull', reps: '1 min', weight: '34/24 kg' },
      { name: 'Box Jumps', reps: '1 min', weight: '60/50 cm' },
      { name: 'Push Press', reps: '1 min', weight: '34/24 kg' },
      { name: 'Row (calories)', reps: '1 min' },
    ],
    difficulty: 'intermediate',
    targetMuscles: ['full', 'legs', 'push', 'pull'],
    scalingNotes: 'Lighter weights, step-ups instead of box jumps',
  },
  // --- Short & Intense WODs (good for conditioning days) ---
  {
    id: 'death_by_burpees',
    name: 'Death by Burpees',
    format: 'emom',
    exercises: [
      { name: 'Burpees', reps: '+1 per minute' },
    ],
    difficulty: 'intermediate',
    targetMuscles: ['full'],
    scalingNotes: 'Start at minute 1 with 1 burpee, add 1 each minute until failure',
  },
  {
    id: 'chelsea',
    name: 'Chelsea',
    format: 'emom',
    timeCap: 30,
    exercises: [
      { name: 'Pull-ups', reps: 5 },
      { name: 'Push-ups', reps: 10 },
      { name: 'Air Squats', reps: 15 },
    ],
    difficulty: 'intermediate',
    targetMuscles: ['pull', 'push', 'legs'],
    scalingNotes: 'Reduce to 3-6-9, band pull-ups',
  },
  {
    id: 'mary',
    name: 'Mary',
    format: 'amrap',
    timeCap: 20,
    exercises: [
      { name: 'Handstand Push-ups', reps: 5 },
      { name: 'Pistol Squats (alt)', reps: 10 },
      { name: 'Pull-ups', reps: 15 },
    ],
    difficulty: 'advanced',
    targetMuscles: ['push', 'legs', 'pull', 'shoulders'],
    scalingNotes: 'Pike push-ups, assisted pistols, band pull-ups',
  },
  {
    id: 'nancy',
    name: 'Nancy',
    format: 'rounds_for_time',
    rounds: 5,
    exercises: [
      { name: 'Run', reps: '400m' },
      { name: 'Overhead Squats', reps: 15, weight: '43/30 kg' },
    ],
    difficulty: 'intermediate',
    targetMuscles: ['legs', 'shoulders', 'core'],
    scalingNotes: 'Front squats or air squats, row instead of run',
  },
]

// ── STRETCHING & MOBILITY EXERCISES ──

export const STRETCH_EXERCISES: StretchExercise[] = [
  // --- Dynamic (pre-workout) ---
  {
    id: 'leg_swings_forward',
    name: 'Leg Swings (Forward/Back)',
    type: 'dynamic',
    targetMuscles: ['hips', 'legs'],
    reps: 15,
    description: 'Stand next to wall for support. Swing one leg forward and back in controlled motion. 15 per leg.',
  },
  {
    id: 'leg_swings_lateral',
    name: 'Leg Swings (Side to Side)',
    type: 'dynamic',
    targetMuscles: ['hips', 'legs'],
    reps: 15,
    description: 'Face wall, swing leg side to side across body. 15 per leg.',
  },
  {
    id: 'arm_circles',
    name: 'Arm Circles',
    type: 'dynamic',
    targetMuscles: ['shoulders'],
    reps: 15,
    description: 'Arms extended, small to large circles. 15 forward, 15 backward.',
  },
  {
    id: 'walking_lunge_twist',
    name: 'Walking Lunge with Twist',
    type: 'dynamic',
    targetMuscles: ['hips', 'legs', 'core'],
    reps: 10,
    description: 'Lunge forward, twist torso toward front leg. 10 per side.',
  },
  {
    id: 'cat_cow',
    name: 'Cat-Cow',
    type: 'dynamic',
    targetMuscles: ['thoracic', 'core'],
    reps: 10,
    description: 'On all fours, alternate between arching and rounding spine. 10 cycles.',
  },
  {
    id: 'inchworm',
    name: 'Inchworm',
    type: 'dynamic',
    targetMuscles: ['posterior', 'core', 'shoulders'],
    reps: 8,
    description: 'Stand, fold forward, walk hands to plank, walk feet to hands, stand up. 8 reps.',
  },
  {
    id: 'hip_circles',
    name: 'Hip Circles',
    type: 'dynamic',
    targetMuscles: ['hips'],
    reps: 10,
    description: 'Stand on one leg, draw large circles with knee. 10 each direction per leg.',
  },
  {
    id: 'world_greatest_stretch',
    name: 'World\'s Greatest Stretch',
    type: 'dynamic',
    targetMuscles: ['hips', 'thoracic', 'legs'],
    reps: 5,
    description: 'Lunge, place hand on floor, rotate opposite arm to ceiling. 5 per side.',
  },
  {
    id: 'band_pull_apart',
    name: 'Band Pull-Apart',
    type: 'dynamic',
    targetMuscles: ['shoulders', 'pull'],
    reps: 15,
    description: 'Hold band at chest height, pull apart to stretch band across chest. 15 reps.',
  },
  {
    id: 'ankle_circles',
    name: 'Ankle Circles',
    type: 'mobility',
    targetMuscles: ['ankles'],
    reps: 10,
    description: 'Rotate ankle in circles. 10 each direction per foot.',
  },
  // --- Static (post-workout / recovery) ---
  {
    id: 'standing_quad_stretch',
    name: 'Standing Quad Stretch',
    type: 'static',
    targetMuscles: ['legs'],
    holdSeconds: 30,
    description: 'Stand, grab ankle behind, pull heel to glute. 30s per leg.',
  },
  {
    id: 'pigeon_pose',
    name: 'Pigeon Pose',
    type: 'static',
    targetMuscles: ['hips', 'posterior'],
    holdSeconds: 60,
    description: 'Front shin across body, back leg extended. Fold forward. 60s per side.',
  },
  {
    id: 'seated_hamstring_stretch',
    name: 'Seated Hamstring Stretch',
    type: 'static',
    targetMuscles: ['posterior', 'legs'],
    holdSeconds: 30,
    description: 'Sit with one leg extended, reach toward toes. 30s per leg.',
  },
  {
    id: 'doorway_chest_stretch',
    name: 'Doorway Chest Stretch',
    type: 'static',
    targetMuscles: ['push', 'shoulders'],
    holdSeconds: 30,
    description: 'Place forearm on doorframe, gently turn away. 30s per side.',
  },
  {
    id: 'lat_stretch',
    name: 'Lat Stretch (Child\'s Pose variant)',
    type: 'static',
    targetMuscles: ['pull', 'shoulders'],
    holdSeconds: 45,
    description: 'Kneel, reach arms forward on floor, sink hips back. Shift to each side. 45s per side.',
  },
  {
    id: 'butterfly_stretch',
    name: 'Butterfly Stretch',
    type: 'static',
    targetMuscles: ['hips', 'legs'],
    holdSeconds: 45,
    description: 'Sit, soles of feet together, gently press knees down. 45s.',
  },
  {
    id: 'supine_spinal_twist',
    name: 'Supine Spinal Twist',
    type: 'static',
    targetMuscles: ['thoracic', 'core', 'hips'],
    holdSeconds: 30,
    description: 'Lie on back, cross one knee over body, arms extended. 30s per side.',
  },
  {
    id: 'calf_stretch_wall',
    name: 'Calf Stretch (Wall)',
    type: 'static',
    targetMuscles: ['legs', 'ankles'],
    holdSeconds: 30,
    description: 'Face wall, one foot back, press heel down and lean in. 30s per leg.',
  },
  {
    id: 'couch_stretch',
    name: 'Couch Stretch',
    type: 'static',
    targetMuscles: ['hips', 'legs'],
    holdSeconds: 60,
    description: 'Rear foot on wall/bench, lunge position. Stretches hip flexors and quads. 60s per side.',
  },
  {
    id: 'figure_four_stretch',
    name: 'Figure-4 Stretch',
    type: 'static',
    targetMuscles: ['hips', 'posterior'],
    holdSeconds: 30,
    description: 'Lie on back, cross ankle over opposite knee, pull thigh toward chest. 30s per side.',
  },
  // --- Mobility drills ---
  {
    id: 'thoracic_rotation',
    name: 'Thoracic Spine Rotation',
    type: 'mobility',
    targetMuscles: ['thoracic'],
    reps: 10,
    description: 'Side-lying, rotate upper body opening chest to ceiling. 10 per side.',
  },
  {
    id: 'deep_squat_hold',
    name: 'Deep Squat Hold',
    type: 'mobility',
    targetMuscles: ['hips', 'ankles', 'legs'],
    holdSeconds: 60,
    description: 'Sit in deep squat with heels down, elbows pushing knees out. 60s.',
  },
  {
    id: 'wall_slides',
    name: 'Wall Slides',
    type: 'mobility',
    targetMuscles: ['shoulders', 'thoracic'],
    reps: 10,
    description: 'Stand with back to wall, arms in "W", slide up to "Y". 10 reps.',
  },
  {
    id: 'banded_hip_distraction',
    name: 'Banded Hip Distraction',
    type: 'mobility',
    targetMuscles: ['hips'],
    holdSeconds: 45,
    description: 'Band around hip joint, step away to create tension, lunge and oscillate. 45s per side.',
  },
  {
    id: 'foam_roll_thoracic',
    name: 'Foam Roll Thoracic Spine',
    type: 'mobility',
    targetMuscles: ['thoracic'],
    reps: 10,
    description: 'Lie on foam roller perpendicular to spine at mid-back. Roll up and down. 10 passes.',
  },
  {
    id: 'foam_roll_quads',
    name: 'Foam Roll Quads',
    type: 'mobility',
    targetMuscles: ['legs'],
    holdSeconds: 60,
    description: 'Prone on foam roller, roll from hip to just above knee. Pause on tender spots. 60s per leg.',
  },
  {
    id: 'foam_roll_glutes',
    name: 'Foam Roll Glutes/Piriformis',
    type: 'mobility',
    targetMuscles: ['hips', 'posterior'],
    holdSeconds: 60,
    description: 'Sit on foam roller, cross one ankle over opposite knee. Roll through glute. 60s per side.',
  },
]

// ── AEROBIC / CARDIO WORKOUTS ──

export const AEROBIC_WORKOUTS: AerobicWorkout[] = [
  // --- Assault Bike ---
  {
    id: 'bike_steady_state',
    name: 'Assault Bike Steady State',
    equipment: 'assault_bike',
    format: 'steady_state',
    durationMinutes: 20,
    intensity: 'low',
    description: 'Low-intensity steady state for active recovery and blood flow',
    phases: [
      { type: 'warmup', durationSeconds: 180, intensity: 'Easy pace, RPE 3' },
      { type: 'work', durationSeconds: 900, intensity: 'Moderate pace, RPE 5-6, nasal breathing' },
      { type: 'cooldown', durationSeconds: 120, intensity: 'Easy pace, RPE 3' },
    ],
  },
  {
    id: 'bike_intervals_30_30',
    name: 'Assault Bike 30/30 Intervals',
    equipment: 'assault_bike',
    format: 'intervals',
    durationMinutes: 15,
    intensity: 'high',
    description: '30s sprint / 30s easy. Builds anaerobic capacity',
    phases: [
      { type: 'warmup', durationSeconds: 180, intensity: 'Easy spin, RPE 4' },
      { type: 'work', durationSeconds: 30, intensity: 'Max effort sprint, RPE 9-10', repeats: 10 },
      { type: 'rest', durationSeconds: 30, intensity: 'Easy spin, RPE 3', repeats: 10 },
      { type: 'cooldown', durationSeconds: 120, intensity: 'Easy spin, RPE 3' },
    ],
  },
  {
    id: 'bike_intervals_2min',
    name: 'Assault Bike 2:00/0:30 Intervals',
    equipment: 'assault_bike',
    format: 'intervals',
    durationMinutes: 25,
    intensity: 'moderate',
    description: '2 min moderate work / 30s sprint bursts. Builds aerobic base with speed',
    phases: [
      { type: 'warmup', durationSeconds: 180, intensity: 'Easy pace, RPE 4' },
      { type: 'work', durationSeconds: 120, intensity: 'Moderate, RPE 6-7', repeats: 8 },
      { type: 'work', durationSeconds: 30, intensity: 'Sprint, RPE 9', repeats: 8 },
      { type: 'cooldown', durationSeconds: 120, intensity: 'Easy spin, RPE 3' },
    ],
  },
  {
    id: 'bike_calories_emom',
    name: 'Assault Bike Calorie EMOM',
    equipment: 'assault_bike',
    format: 'emom',
    durationMinutes: 12,
    intensity: 'high',
    description: 'Every minute: hit target calories, rest remainder. Start at 10/8 cal (M/F)',
    phases: [
      { type: 'work', durationSeconds: 60, intensity: '10/8 cal sprint, rest remainder of minute', repeats: 12 },
    ],
  },
  // --- Rowing ---
  {
    id: 'row_steady_state',
    name: 'Rowing Steady State',
    equipment: 'rowing',
    format: 'steady_state',
    durationMinutes: 20,
    intensity: 'low',
    description: 'Low-intensity rowing for active recovery. Focus on stroke technique',
    phases: [
      { type: 'warmup', durationSeconds: 180, intensity: 'Light rowing, 18-20 s/m, RPE 3' },
      { type: 'work', durationSeconds: 900, intensity: '22-24 s/m, RPE 5-6, controlled breathing' },
      { type: 'cooldown', durationSeconds: 120, intensity: 'Light rowing, 18 s/m, RPE 3' },
    ],
  },
  {
    id: 'row_intervals_500m',
    name: 'Rowing 500m Intervals',
    equipment: 'rowing',
    format: 'intervals',
    durationMinutes: 20,
    intensity: 'high',
    description: '500m hard / 1:00 rest. Classic rowing interval for power endurance',
    phases: [
      { type: 'warmup', durationSeconds: 180, intensity: 'Easy rowing, RPE 4' },
      { type: 'work', durationSeconds: 120, intensity: '500m hard, RPE 8-9', repeats: 5 },
      { type: 'rest', durationSeconds: 60, intensity: 'Easy paddle, RPE 3', repeats: 5 },
      { type: 'cooldown', durationSeconds: 120, intensity: 'Light rowing, RPE 3' },
    ],
  },
  {
    id: 'row_pyramid',
    name: 'Rowing Pyramid',
    equipment: 'rowing',
    format: 'pyramid',
    durationMinutes: 25,
    intensity: 'moderate',
    description: '250m-500m-750m-1000m-750m-500m-250m with 1:00 rest between',
    phases: [
      { type: 'warmup', durationSeconds: 180, intensity: 'Easy rowing, RPE 4' },
      { type: 'work', durationSeconds: 60, intensity: '250m, RPE 7' },
      { type: 'rest', durationSeconds: 60, intensity: 'Rest' },
      { type: 'work', durationSeconds: 120, intensity: '500m, RPE 7-8' },
      { type: 'rest', durationSeconds: 60, intensity: 'Rest' },
      { type: 'work', durationSeconds: 180, intensity: '750m, RPE 8' },
      { type: 'rest', durationSeconds: 60, intensity: 'Rest' },
      { type: 'work', durationSeconds: 240, intensity: '1000m, RPE 8-9' },
      { type: 'rest', durationSeconds: 60, intensity: 'Rest' },
      { type: 'work', durationSeconds: 180, intensity: '750m, RPE 8' },
      { type: 'rest', durationSeconds: 60, intensity: 'Rest' },
      { type: 'work', durationSeconds: 120, intensity: '500m, RPE 7-8' },
      { type: 'rest', durationSeconds: 60, intensity: 'Rest' },
      { type: 'work', durationSeconds: 60, intensity: '250m, RPE 7' },
      { type: 'cooldown', durationSeconds: 120, intensity: 'Easy rowing, RPE 3' },
    ],
  },
  {
    id: 'row_40_20',
    name: 'Rowing 40/20 Intervals',
    equipment: 'rowing',
    format: 'intervals',
    durationMinutes: 15,
    intensity: 'high',
    description: '40s hard rowing / 20s easy. 10 rounds. Great for building power',
    phases: [
      { type: 'warmup', durationSeconds: 180, intensity: 'Easy rowing, RPE 4' },
      { type: 'work', durationSeconds: 40, intensity: 'Hard effort, RPE 8-9', repeats: 10 },
      { type: 'rest', durationSeconds: 20, intensity: 'Light paddle, RPE 3', repeats: 10 },
      { type: 'cooldown', durationSeconds: 120, intensity: 'Easy rowing, RPE 3' },
    ],
  },
  // --- Running ---
  {
    id: 'run_easy_30',
    name: 'Easy Run 30 min',
    equipment: 'run',
    format: 'steady_state',
    durationMinutes: 30,
    intensity: 'low',
    description: 'Conversational pace run. Builds aerobic base without taxing recovery',
    phases: [
      { type: 'warmup', durationSeconds: 300, intensity: 'Walk to easy jog, RPE 3-4' },
      { type: 'work', durationSeconds: 1200, intensity: 'Easy pace, RPE 5-6, can hold conversation' },
      { type: 'cooldown', durationSeconds: 300, intensity: 'Easy jog to walk, RPE 3' },
    ],
  },
  {
    id: 'run_intervals_400m',
    name: '400m Run Intervals',
    equipment: 'run',
    format: 'intervals',
    durationMinutes: 25,
    intensity: 'high',
    description: '400m fast / 200m walk recovery. 6-8 rounds',
    phases: [
      { type: 'warmup', durationSeconds: 300, intensity: 'Easy jog, RPE 4' },
      { type: 'work', durationSeconds: 90, intensity: '400m at RPE 8-9', repeats: 6 },
      { type: 'rest', durationSeconds: 90, intensity: '200m walk, RPE 3', repeats: 6 },
      { type: 'cooldown', durationSeconds: 300, intensity: 'Easy jog to walk, RPE 3' },
    ],
  },
  // --- Jump Rope ---
  {
    id: 'jump_rope_intervals',
    name: 'Jump Rope Intervals',
    equipment: 'jump_rope',
    format: 'intervals',
    durationMinutes: 15,
    intensity: 'moderate',
    description: '1 min on / 30s rest. Mix singles and doubles',
    phases: [
      { type: 'warmup', durationSeconds: 120, intensity: 'Easy singles, RPE 4' },
      { type: 'work', durationSeconds: 60, intensity: 'Singles or doubles, RPE 7', repeats: 10 },
      { type: 'rest', durationSeconds: 30, intensity: 'Rest', repeats: 10 },
      { type: 'cooldown', durationSeconds: 60, intensity: 'Easy singles, RPE 3' },
    ],
  },
]

// ── PRESET STRETCHING ROUTINES ──

export interface StretchRoutine {
  id: string
  name: string
  targetContext: 'pre_squat' | 'pre_bench' | 'pre_deadlift' | 'pre_ohp' | 'post_lower' | 'post_upper' | 'full_body_recovery' | 'morning_mobility'
  exercises: string[] // references to StretchExercise.id
  durationMinutes: number
}

export const STRETCH_ROUTINES: StretchRoutine[] = [
  {
    id: 'pre_squat',
    name: 'Pre-Squat Mobility',
    targetContext: 'pre_squat',
    exercises: ['hip_circles', 'ankle_circles', 'deep_squat_hold', 'leg_swings_forward', 'leg_swings_lateral', 'walking_lunge_twist', 'cat_cow'],
    durationMinutes: 8,
  },
  {
    id: 'pre_bench',
    name: 'Pre-Bench Warm-up',
    targetContext: 'pre_bench',
    exercises: ['arm_circles', 'band_pull_apart', 'wall_slides', 'thoracic_rotation', 'cat_cow'],
    durationMinutes: 6,
  },
  {
    id: 'pre_deadlift',
    name: 'Pre-Deadlift Mobility',
    targetContext: 'pre_deadlift',
    exercises: ['hip_circles', 'leg_swings_forward', 'inchworm', 'cat_cow', 'deep_squat_hold', 'banded_hip_distraction'],
    durationMinutes: 8,
  },
  {
    id: 'pre_ohp',
    name: 'Pre-OHP Warm-up',
    targetContext: 'pre_ohp',
    exercises: ['arm_circles', 'band_pull_apart', 'wall_slides', 'thoracic_rotation', 'cat_cow', 'walking_lunge_twist'],
    durationMinutes: 7,
  },
  {
    id: 'post_lower',
    name: 'Post Lower-Body Stretching',
    targetContext: 'post_lower',
    exercises: ['standing_quad_stretch', 'seated_hamstring_stretch', 'pigeon_pose', 'butterfly_stretch', 'couch_stretch', 'calf_stretch_wall', 'foam_roll_quads', 'foam_roll_glutes'],
    durationMinutes: 12,
  },
  {
    id: 'post_upper',
    name: 'Post Upper-Body Stretching',
    targetContext: 'post_upper',
    exercises: ['doorway_chest_stretch', 'lat_stretch', 'supine_spinal_twist', 'foam_roll_thoracic'],
    durationMinutes: 8,
  },
  {
    id: 'full_body_recovery',
    name: 'Full Body Recovery Session',
    targetContext: 'full_body_recovery',
    exercises: [
      'cat_cow', 'world_greatest_stretch', 'deep_squat_hold', 'pigeon_pose',
      'seated_hamstring_stretch', 'butterfly_stretch', 'doorway_chest_stretch',
      'lat_stretch', 'supine_spinal_twist', 'couch_stretch',
      'foam_roll_thoracic', 'foam_roll_quads', 'foam_roll_glutes',
    ],
    durationMinutes: 20,
  },
  {
    id: 'morning_mobility',
    name: 'Morning Mobility Flow',
    targetContext: 'morning_mobility',
    exercises: ['cat_cow', 'world_greatest_stretch', 'hip_circles', 'thoracic_rotation', 'deep_squat_hold', 'inchworm', 'arm_circles', 'ankle_circles'],
    durationMinutes: 10,
  },
]

// ── HELPER: Build catalog summary for AI prompt ──

export function buildCatalogSummary(): string {
  const sections: string[] = []

  // CrossFit WODs
  sections.push('## CrossFit Benchmark WODs Available')
  sections.push('The following benchmark WODs can be prescribed. Each has scaling options for different levels.')
  for (const wod of CROSSFIT_WODS) {
    const exStr = wod.exercises.map(e => {
      const w = e.weight ? ` @ ${e.weight}` : ''
      return `${e.name} x${e.reps}${w}`
    }).join(', ')
    sections.push(`- **${wod.name}** (${wod.format}, ${wod.difficulty}): ${exStr}. Scaling: ${wod.scalingNotes}`)
  }

  // Stretching
  sections.push('\n## Stretching & Mobility Exercises')
  sections.push('### Dynamic (pre-workout):')
  for (const ex of STRETCH_EXERCISES.filter(e => e.type === 'dynamic')) {
    sections.push(`- **${ex.name}**: ${ex.description}`)
  }
  sections.push('### Static (post-workout):')
  for (const ex of STRETCH_EXERCISES.filter(e => e.type === 'static')) {
    sections.push(`- **${ex.name}**: ${ex.description}`)
  }
  sections.push('### Mobility drills:')
  for (const ex of STRETCH_EXERCISES.filter(e => e.type === 'mobility')) {
    sections.push(`- **${ex.name}**: ${ex.description}`)
  }

  // Preset routines
  sections.push('\n## Preset Stretching Routines')
  for (const r of STRETCH_ROUTINES) {
    sections.push(`- **${r.name}** (~${r.durationMinutes} min): ${r.exercises.join(', ')}`)
  }

  // Aerobic
  sections.push('\n## Aerobic / Cardio Workouts')
  for (const w of AEROBIC_WORKOUTS) {
    const phasesStr = w.phases.map(p => `${p.type}: ${p.durationSeconds}s ${p.intensity}${p.repeats ? ` x${p.repeats}` : ''}`).join(' → ')
    sections.push(`- **${w.name}** (${w.equipment}, ${w.format}, ${w.durationMinutes} min, ${w.intensity}): ${w.description}. Protocol: ${phasesStr}`)
  }

  return sections.join('\n')
}
