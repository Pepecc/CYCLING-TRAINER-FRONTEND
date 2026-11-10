import { apiFetch } from './client'
import type {
  PlanResponse, PlannedWorkout, AdaptResult, RaceEvent, SeasonPlan, FormProjection,
  ImportPreview, ImportPreviewItem, ImportResult, WorkoutEnvironment, PlannedStatus,
} from '../types/plan'

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly data: Record<string, unknown>) {
    super(message)
  }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, opts)
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || `Error ${res.status}`, res.status, data)
  return data as T
}

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

export const planApi = {
  get: (from: string, to: string) =>
    request<PlanResponse>(`/plan?from=${from}&to=${to}`),

  update: (id: string, patch: { status?: PlannedStatus; date?: string; notes?: string | null }) =>
    request<{ workout: PlannedWorkout }>(`/plan/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
      .then(r => r.workout),

  remove: (id: string) => request<void>(`/plan/${id}`, { method: 'DELETE' }),

  // save false → preview only. 422 (ApiError.data.minimumMinutes) if it does not fit
  adapt: (id: string, opts: { environment: WorkoutEnvironment; availableMinutes: number | null; save: boolean }) =>
    request<AdaptResult>(`/plan/${id}/adapt`, post(opts)),

  restoreOriginal: (id: string) =>
    request<{ workout: PlannedWorkout }>(`/plan/${id}/adaptation`, { method: 'DELETE' }).then(r => r.workout),

  formProjection: (to?: string) =>
    request<FormProjection>(`/plan/form-projection${to ? `?to=${to}` : ''}`),

  previewFile: (json: unknown) => request<ImportPreview>('/plan/import/preview', post(json)),

  previewImage: (image: { mediaType: string; data: string }, hint: string) =>
    request<ImportPreview>('/plan/import/image', post({ image, hint: hint || undefined })),

  confirmImport: (items: ImportPreviewItem[], onDuplicate: 'skip' | 'replace') =>
    request<ImportResult>('/plan/import', post({ workouts: items.map(i => i.draft), onDuplicate })),
}

export const eventsApi = {
  list: (past = true) => request<{ events: RaceEvent[] }>(`/events?past=${past}`).then(r => r.events),
  seasonPlan: () => request<SeasonPlan>('/events/season-plan'),
}
