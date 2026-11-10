// Tipos de las respuestas de /api/plan y /api/events (mismo modelo que el backend)

export type StepKind = 'warmup' | 'work' | 'recovery' | 'steady' | 'cooldown'
export type TargetType = 'hr_zone' | 'power_zone' | 'ftp_percent' | 'power_w' | 'hr_bpm' | 'rpe' | 'open'
export type WorkoutFocus =
  | 'recovery' | 'endurance' | 'tempo' | 'sweet_spot' | 'threshold' | 'vo2max' | 'anaerobic'
  | 'sprint' | 'technique' | 'strength' | 'test' | 'race' | 'rest' | 'other'
export type WorkoutEnvironment = 'indoor' | 'outdoor' | 'any'
export type PlannedStatus = 'planned' | 'done' | 'partial' | 'skipped'

export interface WorkoutStep {
  kind: StepKind
  durationSeconds: number
  target: { type: TargetType; min: number | null; max: number | null }
  cadenceMin: number | null
  cadenceMax: number | null
  notes: string | null
}

export interface WorkoutBlock {
  name: string | null
  repeat: number
  steps: WorkoutStep[]
}

export interface WorkoutVersion {
  environment: WorkoutEnvironment
  blocks: WorkoutBlock[]
  durationMinutes: number | null
  plannedTss: number | null
}

export interface WorkoutAdaptation {
  original: WorkoutVersion
  environment: WorkoutEnvironment
  availableMinutes: number | null
  changes: string[]
  warnings: string[]
  adaptedAt: string
}

export interface WorkoutCompletion {
  wahooWorkoutIds: number[]
  date: string
  actualMinutes: number
  actualTss: number | null
  tssSource: string | null
  durationPercent: number | null
  tssPercent: number | null
  linkedAt: string
}

export interface PlannedWorkout {
  id: string
  date: string
  title: string
  focus: WorkoutFocus
  environment: WorkoutEnvironment
  description: string | null
  blocks: WorkoutBlock[]
  durationMinutes: number | null
  plannedTss: number | null
  status: PlannedStatus
  notes: string | null
  source: 'coach' | 'user' | 'import'
  externalId: string | null
  adaptation: WorkoutAdaptation | null
  statusSource: 'auto' | 'manual' | null
  completion: WorkoutCompletion | null
  createdAt: string
  updatedAt: string
}

export interface UnplannedRide {
  id: number
  name: string
  date: string
  startedAt: string
  durationMinutes: number
  location: 'indoor' | 'outdoor' | 'unknown'
}

export interface PlanResponse {
  from: string
  to: string
  workouts: PlannedWorkout[]
  linked: boolean
  unplanned: UnplannedRide[]
}

export interface AdaptResult {
  workout: PlannedWorkout
  original: WorkoutVersion
  changes: string[]
  warnings: string[]
  saved: boolean
}

// ─── Carreras y temporada ────────────────────────────────────────────────────

export type RacePriority = 'A' | 'B' | 'C'

export interface RaceEvent {
  id: string
  name: string
  date: string
  days: number
  priority: RacePriority
  type: string
  distanceKm: number | null
  elevationM: number | null
  location: string | null
  goal: string | null
  notes: string | null
  result: string | null
}

export type SeasonPhaseKind = 'base' | 'build' | 'peak' | 'taper' | 'race' | 'recovery' | 'general'
export type WeekType = 'load' | 'deload' | 'peak' | 'taper' | 'race' | 'recovery' | 'general'

export interface DateRange { from: string; to: string }

export interface RaceWindow {
  raceId: string
  name: string
  priority: RacePriority
  date: string
  endDate: string
  daysToRace: number
  taper: DateRange | null
  recovery: DateRange | null
  warnings: string[]
}

export interface SeasonWeek {
  monday: string
  phase: SeasonPhaseKind
  type: WeekType
  loadPercent: number
  races: Array<{ id: string; name: string; priority: RacePriority; date: string }>
}

export interface SeasonPlan {
  today: string
  horizonEnd: string
  targetRace: RaceEvent | null
  currentPhase: (DateRange & { kind: SeasonPhaseKind; raceId: string | null }) | null
  phases: Array<DateRange & { kind: SeasonPhaseKind; raceId: string | null }>
  races: RaceWindow[]
  weeks: SeasonWeek[]
  warnings: string[]
}

// ─── Forma proyectada ────────────────────────────────────────────────────────

export type LoadOrigin = 'actual' | 'planned' | 'season'

export interface FitnessPoint {
  date: string
  tss: number
  ctl: number
  atl: number
  tsb: number
  origin: LoadOrigin
}

export interface RaceCheckpoint {
  raceId: string
  name: string
  priority: RacePriority
  date: string
  ctl: number
  atl: number
  tsb: number
  targetTsb: [number, number] | null
  assessment: string
}

export interface FormProjection {
  today: string
  horizon: string
  horizonReason: 'request' | 'race' | 'plan' | 'default'
  targetRace: { id: string; name: string; date: string } | null
  current: FitnessPoint
  history: FitnessPoint[]
  projection: FitnessPoint[]
  weeks: Array<{ monday: string; tss: number; ctl: number; atl: number; tsb: number; origin: LoadOrigin }>
  assessment: {
    races: RaceCheckpoint[]
    peakCtl: { date: string; ctl: number } | null
    minTsb: { date: string; tsb: number } | null
    warnings: string[]
  }
  planEnd: string | null
  baseWeeklyTss: number | null
  wahooLinked: boolean
  notes: string[]
}

// ─── Importar ────────────────────────────────────────────────────────────────

export interface ImportDraft {
  externalId: string | null
  input: Record<string, unknown>
}

export interface ImportPreviewItem {
  index: number
  draft: ImportDraft
  valid: boolean
  error: string | null
  warnings: string[]
  duplicateOf: string | null
  workout: {
    date: string
    title: string
    focus: WorkoutFocus
    environment: WorkoutEnvironment
    description: string | null
    durationMinutes: number | null
    plannedTss: number | null
    structure: string | null
  } | null
}

export interface ImportPreview {
  format: string
  total: number
  valid: number
  invalid: number
  duplicates: number
  from: string | null
  to: string | null
  totalHours: number
  totalTss: number
  warnings: string[]
  items: ImportPreviewItem[]
}

export interface ImportResult {
  created: number
  updated: number
  skipped: number
  from: string
  to: string
}
