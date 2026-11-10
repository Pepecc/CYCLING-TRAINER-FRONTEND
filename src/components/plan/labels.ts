import type {
  WorkoutFocus, WorkoutEnvironment, PlannedStatus, StepKind, WorkoutStep, WorkoutBlock,
  SeasonPhaseKind, WeekType, RacePriority,
} from '../../types/plan'

export const FOCUS_LABEL: Record<WorkoutFocus, string> = {
  recovery: 'Recuperación', endurance: 'Resistencia', tempo: 'Tempo', sweet_spot: 'Sweet spot',
  threshold: 'Umbral', vo2max: 'VO2max', anaerobic: 'Anaeróbico', sprint: 'Sprint',
  technique: 'Técnica', strength: 'Fuerza', test: 'Test', race: 'Carrera', rest: 'Descanso', other: 'Otro',
}

export const ENV_LABEL: Record<WorkoutEnvironment, string> = {
  indoor: 'estática', outdoor: 'exterior', any: 'indistinto',
}

export const STATUS_LABEL: Record<PlannedStatus, string> = {
  planned: 'pendiente', done: 'hecho', partial: 'parcial', skipped: 'saltado',
}

export const STEP_LABEL: Record<StepKind, string> = {
  warmup: 'Calentamiento', work: 'Trabajo', recovery: 'Recuperación', steady: 'Continuo', cooldown: 'Vuelta a la calma',
}

export const PHASE_LABEL: Record<SeasonPhaseKind, string> = {
  base: 'base', build: 'construcción', peak: 'pico', taper: 'taper', race: 'carrera', recovery: 'recuperación', general: 'general',
}

export const WEEK_TYPE_LABEL: Record<WeekType, string> = {
  load: 'carga', deload: 'descarga', peak: 'pico', taper: 'taper', race: 'carrera', recovery: 'recuperación', general: 'general',
}

export const RACE_TYPE_LABEL: Record<string, string> = {
  road_race: 'Carretera', gran_fondo: 'Gran fondo', criterium: 'Critérium', time_trial: 'Contrarreloj',
  hill_climb: 'Cronoescalada', stage_race: 'Por etapas', gravel: 'Gravel', mtb: 'MTB', cyclocross: 'Ciclocross', other: 'Otra',
}

export const PRIORITY_LABEL: Record<RacePriority, string> = {
  A: 'objetivo principal', B: 'importante', C: 'como entreno',
}

// Intensidad aproximada de la sesión (para el color de la tarjeta): 0 suave … 3 muy dura
export function focusLevel(focus: WorkoutFocus): number {
  switch (focus) {
    case 'recovery': case 'rest': case 'technique': return 0
    case 'endurance': case 'strength': case 'other': return 1
    case 'tempo': case 'sweet_spot': return 2
    default: return 3
  }
}

function range(min: number | null, max: number | null, unit = ''): string {
  if (min != null && max != null && min !== max) return `${min}–${max}${unit}`
  const v = min ?? max
  return v != null ? `${v}${unit}` : ''
}

export function targetText(step: WorkoutStep): string {
  const { type, min, max } = step.target
  switch (type) {
    case 'hr_zone':     return `Z${range(min, max)} FC`
    case 'power_zone':  return `Z${range(min, max)} potencia`
    case 'ftp_percent': return `${range(min, max)} % FTP`
    case 'power_w':     return range(min, max, ' W')
    case 'hr_bpm':      return range(min, max, ' ppm')
    case 'rpe':         return `RPE ${range(min, max)}`
    default:            return 'libre'
  }
}

export function durationText(seconds: number): string {
  if (seconds < 60) return `${seconds}"`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h} h${m % 60 ? ` ${m % 60}'` : ''}`
  }
  return s ? `${m}'${s}"` : `${m}'`
}

export function cadenceText(step: WorkoutStep): string {
  const c = range(step.cadenceMin, step.cadenceMax)
  return c ? ` · ${c} rpm` : ''
}

// 0–1 para dibujar el perfil del entreno
export function stepIntensity(step: WorkoutStep): number {
  const { type, min, max } = step.target
  const v = max != null && min != null ? (min + max) / 2 : (min ?? max)
  if (v == null || type === 'open') return step.kind === 'work' ? 0.6 : 0.3
  switch (type) {
    case 'hr_zone':     return v / 5
    case 'power_zone':  return v / 7
    case 'ftp_percent': return Math.min(v / 150, 1)
    case 'rpe':         return v / 10
    default:            return 0.5   // vatios o ppm sin referencia
  }
}

// Pasos en orden, con las repeticiones desplegadas
export function flattenSteps(blocks: WorkoutBlock[]): WorkoutStep[] {
  const out: WorkoutStep[] = []
  for (const b of blocks) for (let i = 0; i < b.repeat; i++) out.push(...b.steps)
  return out
}
