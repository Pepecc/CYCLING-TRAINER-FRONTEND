import { useCallback, useEffect, useState } from 'react'
import { testsApi } from '../../api/progress'
import { useApp } from '../../context/AppContext'
import type { FitnessTestsOverview, TestDue, TestProtocol } from '../../types/progress'
import type { WorkoutEnvironment } from '../../types/plan'
import { addDays, formatLong, formatShort, todayKey } from '../../utils/dates'
import { FIELD_LABEL, FIELD_UNIT, PROTOCOL, PROTOCOL_IDS } from './labels'
import { RecordTestForm } from './RecordTestForm'

interface Props {
  onClose: () => void
  onScheduled?: (date: string) => void
}

type Tab = 'overview' | 'schedule' | 'record'

// Tests de FTP y de FC: si toca, programados, historial, programar uno y registrar un resultado
export function TestsModal({ onClose, onScheduled }: Props) {
  const { showNotification } = useApp()
  const [tab, setTab] = useState<Tab>('overview')
  const [data, setData] = useState<FitnessTestsOverview | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try { setData(await testsApi.overview()) }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar los tests') }
  }, [])
  useEffect(() => { load() }, [load])

  // Programar
  const suggested = data?.ftp.suggestedDate ?? data?.heartRate.suggestedDate ?? null
  const [protocol, setProtocol] = useState<TestProtocol>('max_hr')
  const [date, setDate] = useState('')
  const [env, setEnv] = useState<WorkoutEnvironment | ''>('')
  const [busy, setBusy] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const info = data?.protocols.find(p => p.id === protocol)

  async function schedule() {
    setBusy(true)
    setError('')
    try {
      const target = date || suggested || addDays(todayKey(), 1)
      const r = await testsApi.schedule(protocol, target, env || undefined)
      setWarnings(r.warnings)
      showNotification(`${r.workout.title} programado el ${formatShort(r.workout.date)} ✓`)
      onScheduled?.(r.workout.date)
      await load()
      if (!r.warnings.length) setTab('overview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo programar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay visible" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal detail-modal">
        <div className="modal-header">
          <div className="modal-title">Tests de FTP y FC</div>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="seg">
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>resumen</button>
          <button className={tab === 'schedule' ? 'active' : ''} onClick={() => { setTab('schedule'); setWarnings([]) }}>programar</button>
          <button className={tab === 'record' ? 'active' : ''} onClick={() => setTab('record')}>registrar resultado</button>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {!data && !error && <div className="muted">cargando…</div>}

        {data && tab === 'overview' && (
          <>
            <DueBox title="FTP" due={data.ftp} />
            <DueBox title="FC" due={data.heartRate} />
            {data.scheduled.length > 0 && (
              <div className="detail-box">
                <div className="detail-box-title">Programados</div>
                <ul className="detail-list">
                  {data.scheduled.map(w => <li key={w.id}>{formatLong(w.date)}: {w.title}</li>)}
                </ul>
              </div>
            )}
            <div className="detail-box">
              <div className="detail-box-title">Historial</div>
              {data.tests.length === 0
                ? <div className="muted">Todavía no hay tests registrados.</div>
                : (
                  <table className="zones-compare">
                    <thead><tr><th>día</th><th>test</th><th>medido</th><th>resultado</th></tr></thead>
                    <tbody>
                      {data.tests.map(t => (
                        <tr key={t.id}>
                          <td>{formatShort(t.date)}</td>
                          <td>{PROTOCOL[t.protocol].title}</td>
                          <td className="muted">{t.measured} {PROTOCOL[t.protocol].unit}</td>
                          <td>
                            {FIELD_LABEL[t.field]} {t.value} {FIELD_UNIT[t.field]}
                            {t.previous !== null && <span className="muted"> (antes {t.previous})</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          </>
        )}

        {data && tab === 'schedule' && (
          <>
            <div className="modal-grid">
              <div className="field span2">
                <label htmlFor="sched-protocol">Test</label>
                <select id="sched-protocol" value={protocol} onChange={e => { setProtocol(e.target.value as TestProtocol); setWarnings([]) }}>
                  {PROTOCOL_IDS.filter(id => PROTOCOL[id].schedulable).map(id => <option key={id} value={id}>{PROTOCOL[id].title}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="sched-date">Día</label>
                <input id="sched-date" type="date" className="date-input" min={todayKey()} value={date || suggested || ''}
                  onChange={e => setDate(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="sched-env">Dónde</label>
                <select id="sched-env" value={env} onChange={e => setEnv(e.target.value as WorkoutEnvironment | '')}>
                  <option value="">por defecto ({info ? ({ indoor: 'estática', outdoor: 'exterior', any: 'indistinto' })[info.environment] : '—'})</option>
                  <option value="indoor">estática / rodillo</option>
                  <option value="outdoor">exterior</option>
                </select>
              </div>
            </div>
            {info && <p className="detail-text">{info.instructions}</p>}
            {suggested && !date && <div className="muted">Día sugerido: final de la próxima semana de descarga, para llegar descansado.</div>}
            {warnings.map((w, i) => <div key={i} className="warn">⚠ {w}</div>)}
            <div className="detail-actions">
              <span className="spacer" />
              <button className="btn-ghost accent" onClick={schedule} disabled={busy || !(date || suggested)}>{busy ? 'programando…' : 'poner en el plan'}</button>
            </div>
          </>
        )}

        {tab === 'record' && <RecordTestForm onSaved={() => { load(); setTab('overview') }} />}
      </div>
    </div>
  )
}

function DueBox({ title, due }: { title: string; due: TestDue }) {
  return (
    <div className={`detail-box ${due.due ? 'due' : ''}`}>
      <div className="detail-box-title">{title}: {due.due ? 'toca test' : 'al día'}</div>
      <div className="muted">{due.reason}</div>
      {due.suggestedDate && <div>Sugerido: {formatLong(due.suggestedDate)}</div>}
    </div>
  )
}
