import { useEffect, useState } from 'react'
import { summaryApi } from '../../api/progress'
import { useApp } from '../../context/AppContext'
import type { WeeklySummary } from '../../types/progress'
import { addDays, formatMinutes, formatShort, formatWeekday, mondayOf, todayKey } from '../../utils/dates'
import { FOCUS_LABEL, PHASE_LABEL, STATUS_LABEL, WEEK_TYPE_LABEL } from '../plan/labels'
import { RECOMMENDATION_LABEL } from './labels'

interface Props {
  monday: string
  onClose: () => void
}

// Resumen de la semana: planificado frente a hecho, check-ins, forma y recomendación
export function WeeklySummaryModal({ monday: initial, onClose }: Props) {
  const { newConversation, sendMessage } = useApp()
  const thisMonday = mondayOf(todayKey())
  const [monday, setMonday] = useState(initial > thisMonday ? thisMonday : initial)
  const [s, setS] = useState<WeeklySummary | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    summaryApi.week(monday)
      .then(r => { if (!cancelled) setS(r) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar el resumen') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [monday])

  function askCoach() {
    if (!s) return
    newConversation()
    onClose()
    sendMessage(`Hazme el resumen de la semana del ${formatShort(s.monday)} al ${formatShort(s.sunday)} (${s.monday}) y dime cómo planteo la siguiente.`)
  }

  const pct = (n: number | null) => (n === null ? '—' : `${n} %`)
  const signed = (n: number) => (n > 0 ? `+${Math.round(n)}` : String(Math.round(n)))

  return (
    <div className="modal-overlay visible" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal detail-modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Resumen semanal</div>
            <div className="detail-sub">
              {formatShort(monday)} – {formatShort(addDays(monday, 6))}
              {s && !s.complete && ' · en curso'}
            </div>
          </div>
          <div className="cal-nav">
            <button className="btn-ghost" onClick={() => setMonday(m => addDays(m, -7))} aria-label="Semana anterior">‹</button>
            <button className="btn-ghost" onClick={() => setMonday(m => addDays(m, 7))} disabled={monday >= thisMonday} aria-label="Semana siguiente">›</button>
            <button className="btn-close" onClick={onClose} aria-label="Cerrar">×</button>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {loading && <div className="muted">cargando…</div>}

        {s && !loading && (
          <>
            <div className={`detail-box reco reco-${s.recommendation.level}`}>
              <div className="detail-box-title">
                <span className="tag">{RECOMMENDATION_LABEL[s.recommendation.level]}</span> {s.recommendation.headline}
              </div>
              <ul className="detail-list">{s.recommendation.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>

            <table className="summary-table">
              <thead><tr><th></th><th>plan</th><th>hecho</th><th>%</th></tr></thead>
              <tbody>
                <tr><td>sesiones</td><td>{s.planned.sessions}</td><td>{s.done.sessions}</td><td>{pct(s.compliance.sessionsPercent)}</td></tr>
                <tr><td>tiempo</td><td>{formatMinutes(s.planned.minutes)}</td><td>{formatMinutes(s.done.minutes)}</td><td></td></tr>
                <tr><td>TSS</td><td>{s.planned.tss}</td><td>{s.done.tss}{s.done.estimatedTss > 0 && <span className="muted">*</span>}</td><td>{pct(s.compliance.tssPercent)}</td></tr>
              </tbody>
            </table>
            <div className="muted small">
              {s.statuses.done} hechos · {s.statuses.partial} parciales · {s.statuses.skipped} saltados
              {s.statuses.planned > 0 && ` · ${s.statuses.planned} pendientes`}
              {s.done.estimatedTss > 0 && ` · *incluye ${s.done.estimatedTss} TSS previstos de sesiones marcadas a mano`}
              {!s.complete && s.remaining.sessions > 0 && ` · queda: ${s.remaining.sessions} sesión(es), ${s.remaining.tss} TSS`}
            </div>

            {s.keySessions.length > 0 && (
              <div className="detail-box">
                <div className="detail-box-title">Sesiones clave</div>
                <ul className="key-list">
                  {s.keySessions.map(k => (
                    <li key={k.id}>
                      <span className="muted">{formatWeekday(k.date)}</span> {k.title}
                      <span className="muted"> · {FOCUS_LABEL[k.focus]}</span>
                      <span className={`tag status-${k.status}`}>{STATUS_LABEL[k.status]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {s.done.unplanned.length > 0 && (
              <div className="muted small">
                Fuera del plan: {s.done.unplanned.map(a => `${a.name} (${formatWeekday(a.date)}, ${a.minutes} min${a.tss != null ? `, ${Math.round(a.tss)} TSS` : ''})`).join(' · ')}
              </div>
            )}

            <div className="detail-metrics">
              <Metric label="CTL" value={String(Math.round(s.fitness.end.ctl))} sub={`${signed(s.fitness.ctlChange)} en la semana`} />
              <Metric label="ATL" value={String(Math.round(s.fitness.end.atl))} />
              <Metric label="TSB" value={signed(s.fitness.end.tsb)} />
              {s.wellness.days > 0 && <Metric label="Cansancio" value={s.wellness.fatigue != null ? `${s.wellness.fatigue}/5` : '—'} sub={`${s.wellness.days} check-ins`} />}
              {s.wellness.sleepHours != null && <Metric label="Sueño" value={`${s.wellness.sleepHours} h`} />}
            </div>

            <div className="muted small">
              {s.season && <>Esta semana: {WEEK_TYPE_LABEL[s.season.type]} ({s.season.loadPercent} %, {PHASE_LABEL[s.season.phase]}). </>}
              {s.nextSeason && <>Siguiente: {WEEK_TYPE_LABEL[s.nextSeason.type]} ({s.nextSeason.loadPercent} %). </>}
              Semana siguiente planificada: {s.nextWeek.sessions} sesiones, {s.nextWeek.tss} TSS
              {s.nextWeek.targetTss && ` (orientativo ${s.nextWeek.targetTss[0]}–${s.nextWeek.targetTss[1]})`}.
            </div>

            <div className="detail-actions">
              <span className="spacer" />
              <button className="btn-ghost accent" onClick={askCoach}>comentarlo con el coach</button>
            </div>
          </>
        )}
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
