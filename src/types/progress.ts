// Tipos de /api/checkins, /api/tests y /api/plan/weekly-summary (mismo modelo que el backend)
import type { PlannedWorkout, PlannedStatus, WorkoutFocus, WorkoutEnvironment, WeekType, SeasonPhaseKind } from './plan'

export type ReadinessLevel = 'good' | 'normal' | 'caution' | 'rest'

export interface Readiness {
  level: ReadinessLevel
  reasons: string[]
  morningHrDelta: number | null
}

export interface CheckInFields {
  fatigue: number | null
  sleepHours: number | null
  sleepQuality: number | null
  feeling: number | null
  soreness: number | null
  morningHr: number | null
  notes: string | null
}

export interface CheckIn extends CheckInFields {
  date: string
  updatedAt: string
  readiness: Readiness
}

export interface CheckInAverages {
  days: number
  fatigue: number | null
  sleepHours: number | null
  sleepQuality: number | null
  feeling: number | null
  soreness: number | null
  morningHr: number | null
}

export interface CheckInRange {
  from: string
  to: string
  checkIns: CheckIn[]
  averages: CheckInAverages
}

// ─── Tests ───────────────────────────────────────────────────────────────────

export type TestProtocol = 'ftp_20min' | 'ftp_8min' | 'ramp' | 'max_hr' | 'resting_hr'
export type TestedField = 'ftp' | 'maxHr' | 'restingHr'

export interface ProtocolInfo {
  id: TestProtocol
  title: string
  field: TestedField
  factor: number
  input: string
  unit: 'W' | 'ppm'
  range: [number, number]
  environment: WorkoutEnvironment
  schedulable: boolean
  instructions: string
}

export interface FitnessTestResult {
  id: string
  date: string
  protocol: TestProtocol
  field: TestedField
  measured: number
  value: number
  previous: number | null
  plannedWorkoutId: string | null
  notes: string | null
  createdAt: string
}

export interface TestDue {
  due: boolean
  reason: string
  suggestedDate: string | null
}

export interface FitnessTestsOverview {
  tests: FitnessTestResult[]
  lastFtpTest: FitnessTestResult | null
  lastMaxHrTest: FitnessTestResult | null
  scheduled: PlannedWorkout[]
  ftp: TestDue
  heartRate: TestDue
  protocols: ProtocolInfo[]
}

export interface ZoneRow { zone: string; name: string; min: number; max: number | null }

export interface RecordTestResult {
  saved: boolean
  date: string
  outcome: {
    protocol: TestProtocol
    field: TestedField
    measured: number
    value: number
    previous: number | null
    changePercent: number | null
    warnings: string[]
  }
  zonesBefore: ZoneRow[] | null
  zonesAfter: ZoneRow[] | null
  plannedWorkout: PlannedWorkout | null
  note: string | null
}

// ─── Resumen semanal ─────────────────────────────────────────────────────────

export type RecommendationLevel = 'progress' | 'maintain' | 'reduce' | 'recover'

export interface FitnessSnapshot { ctl: number; atl: number; tsb: number }

export interface WeeklySummary {
  monday: string
  sunday: string
  complete: boolean
  linked: boolean
  planned: { sessions: number; minutes: number; tss: number }
  done: {
    sessions: number
    minutes: number
    tss: number
    estimatedTss: number
    unplanned: Array<{ id: number; date: string; name: string; minutes: number; tss: number | null }>
  }
  statuses: Record<PlannedStatus, number>
  compliance: { sessionsPercent: number | null; tssPercent: number | null }
  keySessions: Array<{ id: string; date: string; title: string; focus: WorkoutFocus; status: PlannedStatus }>
  remaining: { sessions: number; tss: number }
  wellness: {
    days: number
    fatigue: number | null
    sleepHours: number | null
    feeling: number | null
    soreness: number | null
    levels: ReadinessLevel[]
  }
  fitness: { start: FitnessSnapshot; end: FitnessSnapshot; ctlChange: number }
  season: { type: WeekType; phase: SeasonPhaseKind; loadPercent: number } | null
  nextSeason: { type: WeekType; phase: SeasonPhaseKind; loadPercent: number } | null
  nextWeek: { sessions: number; tss: number; minutes: number; targetTss: [number, number] | null }
  recommendation: { level: RecommendationLevel; headline: string; points: string[] }
}
