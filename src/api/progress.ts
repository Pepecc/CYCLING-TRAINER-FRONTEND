import { apiFetch } from './client'
import { ApiError } from './plan'
import type {
  CheckIn, CheckInFields, CheckInRange, FitnessTestsOverview, RecordTestResult, TestProtocol, WeeklySummary,
} from '../types/progress'
import type { PlannedWorkout, WorkoutEnvironment } from '../types/plan'

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, opts)
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || `Error ${res.status}`, res.status, data)
  return data as T
}

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

export const checkInsApi = {
  list: (from: string, to: string) => request<CheckInRange>(`/checkins?from=${from}&to=${to}`),

  // Only the fields sent change; null clears a value
  save: (date: string, fields: Partial<CheckInFields>) =>
    request<{ checkIn: CheckIn }>(`/checkins/${date}`, { method: 'PUT', body: JSON.stringify(fields) }).then(r => r.checkIn),

  remove: (date: string) => request<void>(`/checkins/${date}`, { method: 'DELETE' }),
}

export const testsApi = {
  overview: () => request<FitnessTestsOverview>('/tests'),

  schedule: (protocol: TestProtocol, date: string, environment?: WorkoutEnvironment) =>
    request<{ workout: PlannedWorkout; warnings: string[] }>('/tests/schedule', post({ protocol, date, environment })),

  // save false → preview only
  record: (opts: { protocol?: TestProtocol; value?: number | null; date?: string; plannedWorkoutId?: string; notes?: string; save: boolean }) =>
    request<RecordTestResult>('/tests/record', post(opts)),
}

export const summaryApi = {
  week: (day?: string) => request<WeeklySummary>(`/plan/weekly-summary${day ? `?week=${day}` : ''}`),
}

// Downloads the structured workout file; returns the backend warnings to show them
export async function downloadWorkout(id: string, format: 'fit' | 'zwo'): Promise<string[]> {
  const res = await apiFetch(`/plan/${id}/export?format=${format}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(data.error || `Error ${res.status}`, res.status, data)
  }
  const blob = await res.blob()
  const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? `entreno.${format}`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  try {
    return JSON.parse(decodeURIComponent(res.headers.get('X-Export-Warnings') ?? '%5B%5D'))
  } catch {
    return []
  }
}
