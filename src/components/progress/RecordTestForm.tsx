import { useState } from 'react'
import { testsApi } from '../../api/progress'
import { useApp } from '../../context/AppContext'
import type { PlannedWorkout } from '../../types/plan'
import type { RecordTestResult, TestProtocol, ZoneRow } from '../../types/progress'
import { addDays, todayKey } from '../../utils/dates'
import { FIELD_LABEL, FIELD_UNIT, PROTOCOL, PROTOCOL_IDS } from './labels'

interface Props {
  plannedWorkout?: PlannedWorkout     // test del plan: fija el protocolo y la fecha
  onSaved?: (r: RecordTestResult) => void
}

// Registrar el resultado de un test: vista previa (valor nuevo frente al anterior y zonas) y guardar en el perfil
export function RecordTestForm({ plannedWorkout, onSaved }: Props) {
  const { loadProfile, showNotification } = useApp()
  const today = todayKey()
  const fixed = plannedWorkout?.testProtocol ?? null
  const [protocol, setProtocol] = useState<TestProtocol>(fixed ?? 'ftp_20min')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(plannedWorkout && plannedWorkout.date <= today ? plannedWorkout.date : today)
  const [notes, setNotes] = useState('')
  const [preview, setPreview] = useState<RecordTestResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const p = PROTOCOL[protocol]
  const measured = () => {
    const n = parseFloat(value.replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }

  async function run(save: boolean) {
    setBusy(true)
    setError('')
    try {
      const r = await testsApi.record({
        protocol, value: measured(), date, plannedWorkoutId: plannedWorkout?.id, notes: notes.trim() || undefined, save,
      })
      if (save) {
        await loadProfile()
        showNotification(`${FIELD_LABEL[r.outcome.field]} actualizado: ${r.outcome.value} ${FIELD_UNIT[r.outcome.field]} ✓`)
        setPreview(null)
        setValue('')
        onSaved?.(r)
      } else {
        setPreview(r)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo calcular')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => setPreview(null)
  const o = preview?.outcome

  return (
    <div className="test-form">
      <div className="modal-grid">
        <div className="field">
          <label htmlFor="test-protocol">Test</label>
          <select id="test-protocol" value={protocol} disabled={!!fixed} onChange={e => { setProtocol(e.target.value as TestProtocol); reset() }}>
            {PROTOCOL_IDS.map(id => <option key={id} value={id}>{PROTOCOL[id].title}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="test-date">Día del test</label>
          <input id="test-date" type="date" className="date-input" value={date} max={today} min={addDays(today, -366)}
            onChange={e => { if (e.target.value) { setDate(e.target.value); reset() } }} />
        </div>
        <div className="field span2">
          <label htmlFor="test-value">{p.input} ({p.unit})</label>
          <input id="test-value" type="number" inputMode="numeric" value={value}
            placeholder={protocol === 'resting_hr' ? 'vacío = media de los check-ins' : p.unit === 'W' ? 'vatios' : 'ppm'}
            onChange={e => { setValue(e.target.value); reset() }} />
        </div>
        <div className="field span2">
          <label htmlFor="test-notes">Notas</label>
          <input id="test-notes" type="text" maxLength={500} placeholder="calor, cansancio, recorrido…" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      {o && preview && (
        <div className="detail-box">
          <div className="detail-box-title">
            {FIELD_LABEL[o.field]}: {o.previous ?? '—'} → <span className="accent-text">{o.value} {FIELD_UNIT[o.field]}</span>
            {o.changePercent !== null && <span className="muted"> ({o.changePercent > 0 ? '+' : ''}{o.changePercent} %)</span>}
          </div>
          <div className="muted">Medido: {o.measured} {p.unit}{preview.note ? ` · ${preview.note}` : ''}</div>
          {o.warnings.map((w, i) => <div key={i} className="warn">⚠ {w}</div>)}
          {preview.zonesAfter && <ZonesCompare before={preview.zonesBefore} after={preview.zonesAfter} unit={FIELD_UNIT[o.field]} />}
          {preview.plannedWorkout && <div className="muted">Se marcará como hecho «{preview.plannedWorkout.title}» del plan.</div>}
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}

      <div className="detail-actions">
        <span className="spacer" />
        {!preview
          ? <button className="btn-ghost accent" onClick={() => run(false)} disabled={busy || (protocol !== 'resting_hr' && measured() === null)}>{busy ? 'calculando…' : 'calcular'}</button>
          : <button className="btn-ghost accent" onClick={() => run(true)} disabled={busy}>{busy ? 'guardando…' : 'guardar en el perfil'}</button>}
      </div>
    </div>
  )
}

function ZonesCompare({ before, after, unit }: { before: ZoneRow[] | null; after: ZoneRow[]; unit: string }) {
  const range = (z: ZoneRow | undefined) => (z ? `${z.min}${z.max !== null ? `–${z.max}` : '+'}` : '—')
  return (
    <table className="zones-compare">
      <thead><tr><th>zona</th><th>antes</th><th>después ({unit})</th></tr></thead>
      <tbody>
        {after.map((z, i) => (
          <tr key={z.zone}>
            <td>{z.zone} <span className="muted">{z.name}</span></td>
            <td className="muted">{range(before?.[i])}</td>
            <td>{range(z)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
