import { useCallback, useEffect, useState } from 'react'
import { planApi } from '../../api/plan'
import type { FormProjection } from '../../types/plan'
import { FormChart } from './FormChart'
import { formatShort, formatLong, countdown, daysBetween, addDays, todayKey } from '../../utils/dates'

const HORIZON_LABEL: Record<FormProjection['horizonReason'], string> = {
  request: 'fecha elegida',
  race: 'una semana después de la carrera A',
  plan: 'final del plan',
  default: 'próximas 4 semanas',
}

const ORIGIN_SHORT = { actual: 'real', planned: 'plan', season: 'estimado' } as const

function tsbText(tsb: number): string {
  if (tsb > 25) return 'muy fresco'
  if (tsb > 10) return 'fresco'
  if (tsb > -10) return 'equilibrado'
  if (tsb > -20) return 'en carga'
  if (tsb > -30) return 'carga alta'
  return 'fatiga excesiva'
}

const signed = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v)}`

export function FormView() {
  const [data, setData] = useState<FormProjection | null>(null)
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (horizon?: string) => {
    setLoading(true)
    setError('')
    try {
      setData(await planApi.formProjection(horizon || undefined))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo calcular la forma')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const points = data ? [...data.history, ...data.projection] : []
  const c = data?.current
  const target = data?.targetRace ? data.assessment.races.find(r => r.raceId === data.targetRace!.id) : null

  return (
    <div className="view form-view">
      <div className="cal-toolbar">
        <div className="cal-nav">
          <span className="cal-title">Forma proyectada</span>
          {loading && <span className="muted">calculando…</span>}
        </div>
        <div className="cal-nav">
          <label className="muted" htmlFor="horizon">hasta</label>
          <input id="horizon" type="date" className="date-input" value={to || data?.horizon || ''}
            min={addDays(todayKey(), 7)} max={addDays(todayKey(), 365)}
            onChange={e => { setTo(e.target.value); if (e.target.value) load(e.target.value) }} />
          {to && <button className="btn-ghost" onClick={() => { setTo(''); load() }}>automático</button>}
        </div>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {data && c && (
        <>
          <div className="tiles">
            <div className="tile"><div className="metric-label">CTL hoy · forma</div><div className="tile-value">{Math.round(c.ctl)}</div></div>
            <div className="tile"><div className="metric-label">ATL hoy · fatiga</div><div className="tile-value">{Math.round(c.atl)}</div></div>
            <div className="tile"><div className="metric-label">TSB hoy · frescura</div><div className="tile-value">{signed(c.tsb)}</div><div className="muted">{tsbText(c.tsb)}</div></div>
            {data.targetRace && (
              <div className="tile tile-wide">
                <div className="metric-label">Carrera objetivo</div>
                <div className="tile-race">⚑ {data.targetRace.name}</div>
                <div className="muted">{formatShort(data.targetRace.date)} · faltan {countdown(daysBetween(data.today, data.targetRace.date))}</div>
                {target && <div>llegas con CTL <strong>{Math.round(target.ctl)}</strong> y TSB <strong>{signed(target.tsb)}</strong></div>}
              </div>
            )}
          </div>

          <div className="muted">Horizonte: {formatShort(data.horizon)} ({HORIZON_LABEL[data.horizonReason]}).{!data.wahooLinked && ' Sin Wahoo conectado: la carga real puede estar incompleta.'}</div>

          <FormChart points={points} today={data.today} races={data.assessment.races} />

          {data.assessment.races.length > 0 && (
            <div className="detail-box">
              <div className="detail-box-title">Llegada a las carreras</div>
              {data.assessment.races.map(r => (
                <div key={r.raceId} className="race-check">
                  <div>
                    <span className={`race-badge prio-${r.priority}`}>{r.priority}</span> <strong>{r.name}</strong>
                    <span className="muted"> · {formatShort(r.date)}</span>
                  </div>
                  <div>
                    CTL {Math.round(r.ctl)} · TSB {signed(r.tsb)}
                    {r.targetTsb && <span className="muted"> (recomendado {signed(r.targetTsb[0])} a {signed(r.targetTsb[1])})</span>}
                  </div>
                  <div className="muted">{r.assessment}</div>
                </div>
              ))}
            </div>
          )}

          <div className="detail-metrics">
            {data.assessment.peakCtl && (
              <div className="metric"><div className="metric-label">Pico de CTL</div><div className="metric-value">{Math.round(data.assessment.peakCtl.ctl)} <span className="metric-sub">{formatShort(data.assessment.peakCtl.date)}</span></div></div>
            )}
            {data.assessment.minTsb && (
              <div className="metric"><div className="metric-label">TSB mínimo</div><div className="metric-value">{signed(data.assessment.minTsb.tsb)} <span className="metric-sub">{formatShort(data.assessment.minTsb.date)}</span></div></div>
            )}
            {data.baseWeeklyTss != null && (
              <div className="metric"><div className="metric-label">Semana normal</div><div className="metric-value">{data.baseWeeklyTss} <span className="metric-sub">TSS</span></div></div>
            )}
          </div>

          {data.assessment.warnings.map((w, i) => <div key={i} className="warn">⚠ {w}</div>)}
          {data.notes.map((n, i) => <div key={i} className="muted small">{n}</div>)}

          <details className="weeks-table">
            <summary>Ver por semanas</summary>
            <table>
              <thead>
                <tr><th>Semana</th><th>TSS</th><th>CTL</th><th>ATL</th><th>TSB</th><th>Carga</th></tr>
              </thead>
              <tbody>
                {data.weeks.map(w => (
                  <tr key={w.monday} title={formatLong(w.monday)}>
                    <td>{formatShort(w.monday)}</td>
                    <td>{Math.round(w.tss)}</td>
                    <td>{Math.round(w.ctl)}</td>
                    <td>{Math.round(w.atl)}</td>
                    <td>{signed(w.tsb)}</td>
                    <td className="muted">{ORIGIN_SHORT[w.origin]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  )
}
