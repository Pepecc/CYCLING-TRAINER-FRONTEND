import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { planApi, eventsApi } from '../../api/plan'
import type { PlannedWorkout, PlanResponse, RaceEvent, SeasonPlan, SeasonWeek, UnplannedRide } from '../../types/plan'
import {
  todayKey, addDays, mondayOf, firstOfMonth, addMonths, dayOfMonth, daysBetween,
  formatMonth, formatShort, formatWeekday, countdown, formatMinutes, WEEKDAYS,
} from '../../utils/dates'
import { FOCUS_LABEL, ENV_LABEL, STATUS_LABEL, PHASE_LABEL, WEEK_TYPE_LABEL, focusLevel } from './labels'
import { WorkoutProfile } from './WorkoutStructure'
import { WorkoutDetailModal } from './WorkoutDetailModal'
import { RaceModal } from './RaceModal'
import { ImportModal } from './ImportModal'
import { checkInsApi } from '../../api/progress'
import type { CheckIn } from '../../types/progress'
import { CheckInModal, ReadinessDot, CHECKIN_SAVED_EVENT } from '../progress/CheckInModal'
import { WeeklySummaryModal } from '../progress/WeeklySummaryModal'
import { TestsModal } from '../progress/TestsModal'

type Mode = 'month' | 'week'

const STATUS_ICON: Record<PlannedWorkout['status'], string> = { planned: '', done: '✓', partial: '◐', skipped: '✕' }

const isNarrow = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches

function rangeFor(mode: Mode, anchor: string): { from: string; to: string; weeks: string[] } {
  if (mode === 'week') {
    const monday = mondayOf(anchor)
    return { from: monday, to: addDays(monday, 6), weeks: [monday] }
  }
  const first = firstOfMonth(anchor)
  const last = addDays(addMonths(first, 1), -1)
  const from = mondayOf(first)
  const weeks: string[] = []
  for (let m = from; m <= last; m = addDays(m, 7)) weeks.push(m)
  return { from, to: addDays(weeks[weeks.length - 1], 6), weeks }
}

export function CalendarView() {
  const { state, analyzeWorkout } = useApp()
  const today = todayKey()
  const [mode, setMode] = useState<Mode>(() => (isNarrow() ? 'week' : 'month'))
  const [anchor, setAnchor] = useState(today)
  const [plan, setPlan] = useState<PlanResponse | null>(null)
  const [events, setEvents] = useState<RaceEvent[]>([])
  const [season, setSeason] = useState<SeasonPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<PlannedWorkout | null>(null)
  const [selectedRace, setSelectedRace] = useState<RaceEvent | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [checkIns, setCheckIns] = useState<Map<string, CheckIn>>(new Map())
  const [checkInDate, setCheckInDate] = useState<string | null>(null)
  const [summaryMonday, setSummaryMonday] = useState<string | null>(null)
  const [showTests, setShowTests] = useState(false)

  const { from, to, weeks } = rangeFor(mode, anchor)

  // Check-ins of the visible range (only past days and today can have one)
  const loadCheckIns = useCallback(async () => {
    if (from > today) { setCheckIns(new Map()); return }
    try {
      const r = await checkInsApi.list(from, to < today ? to : today)
      setCheckIns(new Map(r.checkIns.map(c => [c.date, c])))
    } catch {
      // The calendar works without them
    }
  }, [from, to, today])
  useEffect(() => { loadCheckIns() }, [loadCheckIns])
  useEffect(() => {
    window.addEventListener(CHECKIN_SAVED_EVENT, loadCheckIns)
    return () => window.removeEventListener(CHECKIN_SAVED_EVENT, loadCheckIns)
  }, [loadCheckIns])

  // Only the latest request updates the view (fast navigation can overlap requests)
  const requestId = useRef(0)
  const loadPlan = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const next = await planApi.get(from, to)
      if (id === requestId.current) setPlan(next)
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : 'No se pudo cargar el plan')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [from, to])

  const loadSeason = useCallback(async () => {
    const [ev, sp] = await Promise.allSettled([eventsApi.list(true), eventsApi.seasonPlan()])
    if (ev.status === 'fulfilled') setEvents(ev.value)
    if (sp.status === 'fulfilled') setSeason(sp.value)
  }, [])

  useEffect(() => { loadPlan() }, [loadPlan])
  useEffect(() => { loadSeason() }, [loadSeason])

  const byDate = useMemo(() => {
    const workouts = new Map<string, PlannedWorkout[]>()
    const rides = new Map<string, UnplannedRide[]>()
    for (const w of plan?.workouts ?? []) workouts.set(w.date, [...(workouts.get(w.date) ?? []), w])
    for (const r of plan?.unplanned ?? []) rides.set(r.date, [...(rides.get(r.date) ?? []), r])
    return { workouts, rides }
  }, [plan])

  // Una carrera de varios días aparece en cada uno
  const racesOn = useCallback((date: string) =>
    events.filter(e => date >= e.date && date <= addDays(e.date, e.days - 1)), [events])

  const seasonWeek = useMemo(() => new Map((season?.weeks ?? []).map(w => [w.monday, w])), [season])

  const upcoming = useMemo(() =>
    events.filter(e => addDays(e.date, e.days - 1) >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3),
  [events, today])

  function move(delta: number) {
    setAnchor(a => mode === 'week' ? addDays(a, 7 * delta) : addMonths(a, delta))
  }

  function onWorkoutChanged(next: PlannedWorkout | null, id: string) {
    setPlan(p => p && {
      ...p,
      workouts: next ? p.workouts.map(w => w.id === id ? next : w) : p.workouts.filter(w => w.id !== id),
    })
  }

  const title = mode === 'month'
    ? formatMonth(anchor)
    : `${formatShort(from)} – ${formatShort(to)}`

  return (
    <div className="view calendar-view">
      {upcoming.length > 0 && (
        <div className="race-strip">
          {upcoming.map(r => {
            const d = daysBetween(today, r.date)
            return (
              <button key={r.id} className="race-countdown" onClick={() => setSelectedRace(r)}>
                <span className={`race-badge prio-${r.priority}`}>{r.priority}</span>
                <span className="race-countdown-name">{r.name}</span>
                <span className="race-countdown-days">{d <= 0 ? 'en curso' : countdown(d)}</span>
                <span className="muted">{formatShort(r.date)}</span>
              </button>
            )
          })}
          {season?.currentPhase && (
            <span className="phase-now">fase: <strong>{PHASE_LABEL[season.currentPhase.kind]}</strong></span>
          )}
        </div>
      )}

      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="btn-ghost" onClick={() => move(-1)} aria-label="Anterior">‹</button>
          <button className="btn-ghost" onClick={() => setAnchor(today)}>hoy</button>
          <button className="btn-ghost" onClick={() => move(1)} aria-label="Siguiente">›</button>
          <span className="cal-title">{title}</span>
          {loading && <span className="muted">cargando…</span>}
        </div>
        <div className="cal-nav">
          <div className="seg">
            <button className={mode === 'month' ? 'active' : ''} onClick={() => setMode('month')}>mes</button>
            <button className={mode === 'week' ? 'active' : ''} onClick={() => setMode('week')}>semana</button>
          </div>
          <button className="btn-ghost" onClick={() => setSummaryMonday(mondayOf(today))}>resumen</button>
          <button className="btn-ghost" onClick={() => setShowTests(true)}>tests</button>
          <button className="btn-ghost" onClick={() => setShowImport(true)}>importar</button>
        </div>
      </div>

      {error && <div className="auth-error">{error}</div>}
      {plan && !plan.linked && state.wahooConnected === false && (
        <div className="muted cal-hint">Sin Wahoo conectado, los entrenos pasados no se marcan solos: puedes marcarlos a mano.</div>
      )}

      {mode === 'month' ? (
        <div className="cal-month">
          <div className="cal-row cal-head">
            {WEEKDAYS.map(d => <div key={d} className="cal-head-cell">{d}</div>)}
            <div className="cal-head-cell cal-week-col">semana</div>
          </div>
          {weeks.map(monday => (
            <div key={monday} className="cal-row">
              {Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map(date => (
                <div
                  key={date}
                  className={`cal-cell ${date.slice(0, 7) !== anchor.slice(0, 7) ? 'other-month' : ''} ${date === today ? 'today' : ''}`}
                >
                  <div className="cal-day">
                    {dayOfMonth(date)}
                    {checkIns.get(date) && <ReadinessDot checkIn={checkIns.get(date)!} onClick={() => setCheckInDate(date)} />}
                  </div>
                  {racesOn(date).map(r => (
                    <button key={r.id} className={`chip chip-race prio-${r.priority}`} onClick={() => setSelectedRace(r)} title={r.name}>
                      ⚑ {r.name}
                    </button>
                  ))}
                  {(byDate.workouts.get(date) ?? []).map(w => (
                    <button
                      key={w.id}
                      className={`chip lvl-${focusLevel(w.focus)} status-${w.status}`}
                      onClick={() => setSelected(w)}
                      title={`${w.title} · ${FOCUS_LABEL[w.focus]} · ${formatMinutes(w.durationMinutes)} · ${STATUS_LABEL[w.status]}`}
                    >
                      {STATUS_ICON[w.status] && <span className="chip-status">{STATUS_ICON[w.status]}</span>}
                      {w.title}
                    </button>
                  ))}
                  {(byDate.rides.get(date) ?? []).map(r => (
                    <button key={r.id} className="chip chip-unplanned" onClick={() => analyzeWorkout(r.id)}
                      title={`${r.name} · ${r.durationMinutes} min · fuera del plan. Pulsa para analizarlo con el coach`}>
                      + {r.name}
                    </button>
                  ))}
                </div>
              ))}
              <WeekSummary monday={monday} plan={plan} season={seasonWeek.get(monday)}
                onOpen={monday <= today ? () => setSummaryMonday(monday) : undefined} />
            </div>
          ))}
        </div>
      ) : (
        <div className="cal-week">
          <WeekSummary monday={from} plan={plan} season={seasonWeek.get(from)} wide
            onOpen={from <= today ? () => setSummaryMonday(from) : undefined} />
          <div className="cal-week-days">
            {Array.from({ length: 7 }, (_, i) => addDays(from, i)).map(date => {
              const workouts = byDate.workouts.get(date) ?? []
              const rides = byDate.rides.get(date) ?? []
              const races = racesOn(date)
              return (
                <div key={date} className={`cal-week-day ${date === today ? 'today' : ''}`}>
                  <div className="cal-week-day-head">
                    <span>{formatWeekday(date)}</span> <span className="muted">{formatShort(date)}</span>
                    {checkIns.get(date)
                      ? <ReadinessDot checkIn={checkIns.get(date)!} onClick={() => setCheckInDate(date)} />
                      : date <= today && daysBetween(date, today) <= 60 && (
                        <button className="btn-link" onClick={() => setCheckInDate(date)} title="Registrar cómo te encontrabas ese día">+ check-in</button>
                      )}
                  </div>
                  {races.map(r => (
                    <button key={r.id} className={`chip chip-race prio-${r.priority}`} onClick={() => setSelectedRace(r)}>⚑ {r.name}</button>
                  ))}
                  {workouts.map(w => (
                    <button key={w.id} className={`wk-card lvl-${focusLevel(w.focus)} status-${w.status}`} onClick={() => setSelected(w)}>
                      <div className="wk-card-title">{w.title}</div>
                      <div className="wk-card-meta">
                        {FOCUS_LABEL[w.focus]} · {formatMinutes(w.durationMinutes)}
                        {w.plannedTss != null && ` · ${Math.round(w.plannedTss)} TSS`}
                      </div>
                      <div className="wk-card-meta">
                        {ENV_LABEL[w.environment]}{w.adaptation ? ' · adaptado' : ''}
                      </div>
                      <WorkoutProfile blocks={w.blocks} />
                      <div className={`wk-card-status status-${w.status}`}>
                        {STATUS_ICON[w.status]} {STATUS_LABEL[w.status]}
                        {w.completion && ` · ${formatMinutes(w.completion.actualMinutes)}`}
                        {w.completion?.actualTss != null && ` · ${Math.round(w.completion.actualTss)} TSS`}
                      </div>
                    </button>
                  ))}
                  {rides.map(r => (
                    <button key={r.id} className="wk-card chip-unplanned" onClick={() => analyzeWorkout(r.id)} title="Analizar con el coach">
                      <div className="wk-card-title">+ {r.name}</div>
                      <div className="wk-card-meta">fuera del plan · {r.durationMinutes} min</div>
                    </button>
                  ))}
                  {!workouts.length && !rides.length && !races.length && <div className="muted cal-empty">—</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selected && (
        <WorkoutDetailModal
          workout={selected}
          onClose={() => setSelected(null)}
          onChanged={next => onWorkoutChanged(next, selected.id)}
        />
      )}
      {selectedRace && (
        <RaceModal
          race={selectedRace}
          window={season?.races.find(r => r.raceId === selectedRace.id) ?? null}
          onClose={() => setSelectedRace(null)}
        />
      )}
      {checkInDate && (
        <CheckInModal date={checkInDate} onClose={() => setCheckInDate(null)} />
      )}
      {summaryMonday && <WeeklySummaryModal monday={summaryMonday} onClose={() => setSummaryMonday(null)} />}
      {showTests && (
        <TestsModal
          onClose={() => setShowTests(false)}
          onScheduled={date => {
            const next = rangeFor(mode, date)
            if (next.from === from && next.to === to) loadPlan()
            else setAnchor(date)
          }}
        />
      )}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={firstDate => {
            // Jump to the first imported day; if the range does not change, reload it
            const target = firstDate ?? anchor
            const next = rangeFor(mode, target)
            setAnchor(target)
            if (next.from === from && next.to === to) loadPlan()
            loadSeason()
          }}
        />
      )}
    </div>
  )
}

// Carga de la semana: planificado frente a hecho, y el tipo de semana del plan de temporada
function WeekSummary({ monday, plan, season, wide, onOpen }: {
  monday: string; plan: PlanResponse | null; season?: SeasonWeek; wide?: boolean; onOpen?: () => void
}) {
  const sunday = addDays(monday, 6)
  const ws = (plan?.workouts ?? []).filter(w => w.date >= monday && w.date <= sunday)
  const plannedTss = ws.reduce((s, w) => s + (w.plannedTss ?? 0), 0)
  const plannedMin = ws.reduce((s, w) => s + (w.durationMinutes ?? 0), 0)
  const doneTss = ws.reduce((s, w) => s + (w.completion?.actualTss ?? 0), 0)
  const doneMin = ws.reduce((s, w) => s + (w.completion?.actualMinutes ?? 0), 0)
  const extra = (plan?.unplanned ?? []).filter(r => r.date >= monday && r.date <= sunday)
  const extraMin = extra.reduce((s, r) => s + r.durationMinutes, 0)
  const hasDone = doneMin > 0 || extraMin > 0

  return (
    <div className={wide ? 'week-summary wide' : 'cal-cell cal-week-col week-summary'}>
      {season && (
        <div className={`week-type wt-${season.type}`}>
          {WEEK_TYPE_LABEL[season.type]}{season.loadPercent ? ` ${season.loadPercent} %` : ''}
          <span className="muted"> · {PHASE_LABEL[season.phase]}</span>
        </div>
      )}
      {ws.length > 0 && <div><span className="muted">plan</span> {Math.round(plannedTss)} TSS · {formatMinutes(plannedMin)}</div>}
      {hasDone && (
        <div>
          <span className="muted">hecho</span> {Math.round(doneTss)} TSS · {formatMinutes(doneMin + extraMin)}
          {extra.length > 0 && <span className="muted"> ({extra.length} fuera del plan)</span>}
        </div>
      )}
      {onOpen && (ws.length > 0 || hasDone) && (
        <button className="btn-link" onClick={onOpen} title="Planificado frente a hecho y recomendación">resumen ›</button>
      )}
    </div>
  )
}
