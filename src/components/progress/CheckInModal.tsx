import { useEffect, useState } from 'react'
import { checkInsApi } from '../../api/progress'
import type { CheckIn, CheckInFields } from '../../types/progress'
import { addDays, formatLong, todayKey } from '../../utils/dates'
import { READINESS_HINT, READINESS_LABEL, SCALES } from './labels'

interface Props {
  date?: string
  onClose: () => void
  onSaved?: (checkIn: CheckIn | null) => void   // null = borrado
}

type Scales = Pick<CheckInFields, 'fatigue' | 'sleepQuality' | 'feeling' | 'soreness'>

// Fired on window when a check-in is saved or deleted (the calendar and the top bar refresh)
export const CHECKIN_SAVED_EVENT = 'checkin-saved'
const notifySaved = () => window.dispatchEvent(new Event(CHECKIN_SAVED_EVENT))

// Check-in diario: cansancio, sueño, sensaciones, dolor y FC al despertar
export function CheckInModal({ date: initialDate, onClose, onSaved }: Props) {
  const today = todayKey()
  const [date, setDate] = useState(initialDate && initialDate <= today ? initialDate : today)
  const [existing, setExisting] = useState<CheckIn | null>(null)
  const [scales, setScales] = useState<Scales>({ fatigue: null, sleepQuality: null, feeling: null, soreness: null })
  const [sleepHours, setSleepHours] = useState('')
  const [morningHr, setMorningHr] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<CheckIn | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setSaved(null)
    setError('')
    checkInsApi.list(date, date)
      .then(r => {
        if (cancelled) return
        const c = r.checkIns[0] ?? null
        setExisting(c)
        setScales({ fatigue: c?.fatigue ?? null, sleepQuality: c?.sleepQuality ?? null, feeling: c?.feeling ?? null, soreness: c?.soreness ?? null })
        setSleepHours(c?.sleepHours?.toString() ?? '')
        setMorningHr(c?.morningHr?.toString() ?? '')
        setNotes(c?.notes ?? '')
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar el check-in') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [date])

  const num = (s: string) => {
    const n = parseFloat(s.replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }

  async function save() {
    setBusy(true)
    setError('')
    try {
      const c = await checkInsApi.save(date, {
        ...scales,
        sleepHours: num(sleepHours),
        morningHr: num(morningHr),
        notes: notes.trim() || null,
      })
      setExisting(c)
      setSaved(c)
      onSaved?.(c)
      notifySaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await checkInsApi.remove(date)
      onSaved?.(null)
      notifySaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar')
      setBusy(false)
    }
  }

  const empty = Object.values(scales).every(v => v === null) && !sleepHours && !morningHr && !notes.trim()

  return (
    <div className="modal-overlay visible" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal checkin-modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Check-in</div>
            <div className="detail-sub">{formatLong(date)}{date === today ? ' (hoy)' : ''}</div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="field">
          <label htmlFor="checkin-date">Día</label>
          <input id="checkin-date" type="date" className="date-input" value={date} max={today} min={addDays(today, -60)}
            onChange={e => e.target.value && setDate(e.target.value)} />
        </div>

        {loading ? <div className="muted">cargando…</div> : (
          <>
            {SCALES.map(s => (
              <div key={s.key} className="scale-row">
                <div className="scale-label">{s.label}</div>
                <div className="scale" role="radiogroup" aria-label={s.label}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const on = scales[s.key] === n
                    const bad = s.inverse ? n >= 4 : n <= 2
                    return (
                      <button key={n} type="button" role="radio" aria-checked={on}
                        className={`scale-btn ${on ? 'active' : ''} ${on && bad ? 'bad' : ''}`}
                        onClick={() => setScales(prev => ({ ...prev, [s.key]: prev[s.key] === n ? null : n }))}>
                        {n}
                      </button>
                    )
                  })}
                </div>
                <div className="scale-ends muted"><span>{s.low}</span><span>{s.high}</span></div>
              </div>
            ))}

            <div className="modal-grid">
              <div className="field">
                <label htmlFor="checkin-sleep">Horas de sueño</label>
                <input id="checkin-sleep" type="number" inputMode="decimal" min={0} max={16} step={0.25} placeholder="p. ej. 7,5"
                  value={sleepHours} onChange={e => setSleepHours(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="checkin-hr">FC al despertar (ppm)</label>
                <input id="checkin-hr" type="number" inputMode="numeric" min={25} max={140} placeholder="tumbado, al despertar"
                  value={morningHr} onChange={e => setMorningHr(e.target.value)} />
              </div>
              <div className="field span2">
                <label htmlFor="checkin-notes">Notas</label>
                <input id="checkin-notes" type="text" maxLength={500} placeholder="enfermedad, estrés, viaje…"
                  value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {saved && (
          <div className={`detail-box readiness readiness-${saved.readiness.level}`}>
            <div className="detail-box-title">Disponibilidad: {READINESS_LABEL[saved.readiness.level]}</div>
            <div>{READINESS_HINT[saved.readiness.level]}</div>
            {saved.readiness.reasons.length > 0 && (
              <ul className="detail-list">{saved.readiness.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
            )}
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <div className="detail-actions">
          {existing && !saved && (
            <button className="btn-ghost danger" onClick={remove} disabled={busy}>borrar</button>
          )}
          <span className="spacer" />
          {saved
            ? <button className="btn-ghost accent" onClick={onClose}>cerrar</button>
            : <button className="btn-ghost accent" onClick={save} disabled={busy || loading || empty}>{busy ? 'guardando…' : 'guardar'}</button>}
        </div>
      </div>
    </div>
  )
}

export function ReadinessDot({ checkIn, onClick }: { checkIn: CheckIn; onClick?: () => void }) {
  const r = checkIn.readiness
  const parts = [
    checkIn.fatigue != null ? `cansancio ${checkIn.fatigue}/5` : null,
    checkIn.sleepHours != null ? `${checkIn.sleepHours} h de sueño` : null,
    checkIn.feeling != null ? `sensaciones ${checkIn.feeling}/5` : null,
  ].filter(Boolean)
  return (
    <button type="button" className={`readiness-dot readiness-${r.level}`} onClick={onClick}
      title={`Check-in · ${READINESS_LABEL[r.level]}${parts.length ? ` · ${parts.join(' · ')}` : ''}`}
      aria-label={`Check-in: disponibilidad ${READINESS_LABEL[r.level]}`}>
      ●
    </button>
  )
}
