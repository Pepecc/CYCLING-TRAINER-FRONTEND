import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { apiFetch } from '../../api/client'
import type { WahooWorkout } from '../../types'

const PER_PAGE = 15

export function WorkoutsModal() {
  const { state, closeWorkoutsModal, analyzeWorkout } = useApp()
  const [workouts, setWorkouts] = useState<WahooWorkout[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    apiFetch(`/wahoo/workouts?page=${page}&per_page=${PER_PAGE}`)
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        if (cancelled) return
        setWorkouts(prev => page === 1 ? data.workouts : [...prev, ...data.workouts])
        setHasMore(data.workouts.length === PER_PAGE)
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar entrenos') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [page])

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) closeWorkoutsModal()
  }

  return (
    <div className="modal-overlay visible" onClick={handleOverlayClick}>
      <div className="modal workouts-modal">
        <div className="modal-header">
          <span className="modal-title">Entrenos de Wahoo</span>
          <button className="btn-close" onClick={closeWorkoutsModal}>×</button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {!error && workouts.length === 0 && !loading && (
          <div className="workouts-empty">No hay entrenos en tu cuenta de Wahoo.</div>
        )}

        <div className="workouts-list">
          {workouts.map(w => (
            <div key={w.id} className="workout-item">
              <div className="workout-main">
                <div className="workout-name">{w.name}</div>
                <div className="workout-meta">
                  {formatDate(w.startedAt)} · {w.durationMinutes} min · {w.location === 'indoor' ? 'rodillo' : w.location === 'outdoor' ? 'exterior' : '—'}
                </div>
                <div className="workout-metrics">
                  {metrics(w).map(m => <span key={m}>{m}</span>)}
                </div>
              </div>
              <button
                className="btn-ghost"
                onClick={() => analyzeWorkout(w.id)}
                disabled={state.loading}
              >
                analizar
              </button>
            </div>
          ))}
        </div>

        {loading && <div className="workouts-empty">Cargando...</div>}

        {hasMore && !loading && !error && workouts.length > 0 && (
          <button className="btn-ghost" onClick={() => setPage(p => p + 1)}>cargar más</button>
        )}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function metrics(w: WahooWorkout): string[] {
  const s = w.summary
  if (!s) return []
  const out: string[] = []
  if (s.distanceInMeters) out.push(`${(s.distanceInMeters / 1000).toFixed(1)} km`)
  if (s.normalizedPower)  out.push(`NP ${s.normalizedPower}w`)
  else if (s.powerAvg)    out.push(`${s.powerAvg}w`)
  if (s.tss)              out.push(`TSS ${s.tss}`)
  if (s.heartRateAvg)     out.push(`${s.heartRateAvg} ppm`)
  return out
}
