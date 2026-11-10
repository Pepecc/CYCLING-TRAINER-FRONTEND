import { useState } from 'react'
import { planApi, ApiError } from '../../api/plan'
import { useApp } from '../../context/AppContext'
import type { PlannedWorkout, PlannedStatus, WorkoutEnvironment, AdaptResult } from '../../types/plan'
import { FOCUS_LABEL, ENV_LABEL, STATUS_LABEL } from './labels'
import { WorkoutProfile, WorkoutBlocks } from './WorkoutStructure'
import { formatLong, formatMinutes, formatShort, todayKey } from '../../utils/dates'

interface Props {
  workout: PlannedWorkout
  onClose: () => void
  onChanged: (w: PlannedWorkout | null) => void   // null = borrado
}

export function WorkoutDetailModal({ workout, onClose, onChanged }: Props) {
  const { showNotification } = useApp()
  const [w, setW] = useState(workout)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Adaptar
  const [adapting, setAdapting] = useState(false)
  const [env, setEnv] = useState<WorkoutEnvironment>(w.adaptation?.environment ?? (w.environment === 'outdoor' ? 'indoor' : w.environment))
  const [minutes, setMinutes] = useState(w.adaptation?.availableMinutes?.toString() ?? '')
  const [preview, setPreview] = useState<AdaptResult | null>(null)

  function apply(next: PlannedWorkout) {
    setW(next)
    onChanged(next)
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError('')
    try { await fn() }
    catch (err) {
      if (err instanceof ApiError && typeof err.data.minimumMinutes === 'number') {
        setError(`${err.message} Mínimo: ${err.data.minimumMinutes} min.`)
      } else {
        setError(err instanceof Error ? err.message : 'Error inesperado')
      }
    } finally { setBusy(false) }
  }

  const setStatus = (status: PlannedStatus) => run(async () => {
    apply(await planApi.update(w.id, { status }))
  })

  const minutesValue = () => {
    const n = parseInt(minutes)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  const previewAdapt = () => run(async () => {
    setPreview(await planApi.adapt(w.id, { environment: env, availableMinutes: minutesValue(), save: false }))
  })

  const saveAdapt = () => run(async () => {
    const r = await planApi.adapt(w.id, { environment: env, availableMinutes: minutesValue(), save: true })
    apply(r.workout)
    setPreview(null)
    setAdapting(false)
    showNotification('Entreno adaptado ✓')
  })

  const restore = () => run(async () => {
    apply(await planApi.restoreOriginal(w.id))
    showNotification('Vuelve a la versión original')
  })

  const remove = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    run(async () => {
      await planApi.remove(w.id)
      onChanged(null)
      onClose()
    })
  }

  const c = w.completion
  const isPast = w.date < todayKey()
  const canAdapt = w.status === 'planned' && w.focus !== 'rest' && w.focus !== 'strength'

  return (
    <div className="modal-overlay visible" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal detail-modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">{w.title}</div>
            <div className="detail-sub">{formatLong(w.date)}</div>
          </div>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="detail-tags">
          <span className={`tag focus-${w.focus}`}>{FOCUS_LABEL[w.focus]}</span>
          <span className="tag">{ENV_LABEL[w.environment]}</span>
          <span className={`tag status-${w.status}`}>
            {STATUS_LABEL[w.status]}{w.statusSource === 'auto' ? ' (Wahoo)' : w.statusSource === 'manual' ? ' (a mano)' : ''}
          </span>
          {w.adaptation && <span className="tag tag-accent">adaptado</span>}
        </div>

        <div className="detail-metrics">
          <Metric label="Duración" value={formatMinutes(w.durationMinutes)} />
          <Metric label="TSS previsto" value={w.plannedTss != null ? String(Math.round(w.plannedTss)) : '—'} />
          {c && <Metric label="Realizado" value={formatMinutes(c.actualMinutes)} sub={c.durationPercent != null ? `${c.durationPercent} %` : undefined} />}
          {c && <Metric label="TSS real" value={c.actualTss != null ? String(Math.round(c.actualTss)) : '—'} sub={c.tssPercent != null ? `${c.tssPercent} %` : undefined} />}
        </div>
        {c && c.date !== w.date && <div className="muted">Hecho el {formatShort(c.date)}.</div>}

        <WorkoutProfile blocks={w.blocks} />

        {w.description && <p className="detail-text">{w.description}</p>}
        <WorkoutBlocks blocks={w.blocks} />
        {w.notes && <p className="detail-text muted">{w.notes}</p>}

        {w.adaptation && (
          <div className="detail-box">
            <div className="detail-box-title">
              Adaptado a {ENV_LABEL[w.adaptation.environment]}
              {w.adaptation.availableMinutes ? ` · ${w.adaptation.availableMinutes} min` : ''}
              {' '}(original: {formatMinutes(w.adaptation.original.durationMinutes)}, {ENV_LABEL[w.adaptation.original.environment]})
            </div>
            <ul className="detail-list">{w.adaptation.changes.map((ch, i) => <li key={i}>{ch}</li>)}</ul>
            {w.adaptation.warnings.map((wn, i) => <div key={i} className="warn">⚠ {wn}</div>)}
            <button className="btn-ghost" onClick={restore} disabled={busy}>volver a la original</button>
          </div>
        )}

        {canAdapt && !adapting && (
          <button className="btn-primary" onClick={() => setAdapting(true)}>Adaptar entrenamiento</button>
        )}

        {adapting && (
          <div className="detail-box">
            <div className="detail-box-title">Adaptar entrenamiento</div>
            <div className="modal-grid">
              <div className="field">
                <label>Dónde</label>
                <select value={env} onChange={e => { setEnv(e.target.value as WorkoutEnvironment); setPreview(null) }}>
                  <option value="indoor">Estática (FC)</option>
                  <option value="outdoor">Exterior</option>
                  <option value="any">Indistinto</option>
                </select>
              </div>
              <div className="field">
                <label>Minutos disponibles</label>
                <input type="number" min={15} max={720} placeholder="sin límite" value={minutes}
                  onChange={e => { setMinutes(e.target.value); setPreview(null) }} />
              </div>
            </div>

            {preview && (
              <div className="adapt-preview">
                <div className="adapt-compare">
                  <div>
                    <div className="muted">Original</div>
                    <div>{formatMinutes(preview.original.durationMinutes)} · TSS {preview.original.plannedTss ?? '—'} · {ENV_LABEL[preview.original.environment]}</div>
                    <WorkoutProfile blocks={preview.original.blocks} />
                  </div>
                  <div>
                    <div className="muted">Adaptado</div>
                    <div>{formatMinutes(preview.workout.durationMinutes)} · TSS {preview.workout.plannedTss ?? '—'} · {ENV_LABEL[preview.workout.environment]}</div>
                    <WorkoutProfile blocks={preview.workout.blocks} />
                  </div>
                </div>
                <ul className="detail-list">{preview.changes.map((ch, i) => <li key={i}>{ch}</li>)}</ul>
                {preview.warnings.map((wn, i) => <div key={i} className="warn">⚠ {wn}</div>)}
                <WorkoutBlocks blocks={preview.workout.blocks} />
              </div>
            )}

            <div className="detail-actions">
              <button className="btn-ghost" onClick={() => { setAdapting(false); setPreview(null) }} disabled={busy}>cancelar</button>
              {!preview
                ? <button className="btn-ghost accent" onClick={previewAdapt} disabled={busy}>{busy ? 'calculando…' : 'ver propuesta'}</button>
                : <button className="btn-ghost accent" onClick={saveAdapt} disabled={busy}>guardar adaptación</button>}
            </div>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <div className="detail-actions">
          {w.status !== 'done' && (isPast || w.date === todayKey()) && (
            <button className="btn-ghost" onClick={() => setStatus('done')} disabled={busy}>marcar hecho</button>
          )}
          {w.status !== 'skipped' && (isPast || w.date === todayKey()) && (
            <button className="btn-ghost" onClick={() => setStatus('skipped')} disabled={busy}>marcar saltado</button>
          )}
          {w.status !== 'planned' && (
            <button className="btn-ghost" onClick={() => setStatus('planned')} disabled={busy} title="El estado lo vuelve a decidir el enlace con Wahoo">
              devolver a pendiente
            </button>
          )}
          <span className="spacer" />
          <button className="btn-ghost danger" onClick={remove} disabled={busy}>
            {confirmDelete ? '¿seguro? borrar' : 'borrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}{sub && <span className="metric-sub"> {sub}</span>}</div>
    </div>
  )
}
