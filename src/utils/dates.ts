// Fechas como claves 'YYYY-MM-DD' (las del backend). La aritmética va en UTC a mediodía
// para que los cambios de hora no muevan el día.

export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const pad = (n: number) => String(n).padStart(2, '0')

const toDate = (key: string) => new Date(`${key}T12:00:00Z`)

export function addDays(key: string, days: number): string {
  const d = toDate(key)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000)
}

// Lunes de la semana de la fecha
export function mondayOf(key: string): string {
  const dow = (toDate(key).getUTCDay() + 6) % 7   // 0 = lunes
  return addDays(key, -dow)
}

export function firstOfMonth(key: string): string {
  return key.slice(0, 8) + '01'
}

export function addMonths(key: string, months: number): string {
  const d = toDate(firstOfMonth(key))
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function dayOfMonth(key: string): number {
  return Number(key.slice(8, 10))
}

function fmt(key: string, opts: Intl.DateTimeFormatOptions): string {
  return toDate(key).toLocaleDateString('es-ES', { timeZone: 'UTC', ...opts })
}

export const formatMonth = (key: string) => fmt(key, { month: 'long', year: 'numeric' })
export const formatShort = (key: string) => fmt(key, { day: 'numeric', month: 'short' })
export const formatWeekday = (key: string) => fmt(key, { weekday: 'short' })
export const formatLong = (key: string) => fmt(key, { weekday: 'long', day: 'numeric', month: 'long' })

export const WEEKDAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

export function countdown(days: number): string {
  if (days === 0) return 'hoy'
  if (days === 1) return 'mañana'
  if (days < 0) return `hace ${-days} d`
  if (days < 21) return `${days} días`
  const weeks = Math.floor(days / 7)
  const rest = days % 7
  return rest ? `${weeks} sem y ${rest} d` : `${weeks} semanas`
}

export function formatMinutes(min: number | null): string {
  if (min == null) return '—'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (!h) return `${m} min`
  return m ? `${h} h ${m}` : `${h} h`
}
