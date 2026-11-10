import { useCallback, useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { AppView } from '../../context/AppContext'
import { checkInsApi } from '../../api/progress'
import type { ReadinessLevel } from '../../types/progress'
import { todayKey } from '../../utils/dates'
import { CheckInModal, CHECKIN_SAVED_EVENT } from '../progress/CheckInModal'
import { READINESS_LABEL } from '../progress/labels'

const VIEWS: Array<{ id: AppView; label: string }> = [
  { id: 'chat', label: 'chat' },
  { id: 'calendar', label: 'calendario' },
  { id: 'form', label: 'forma' },
]

const VIEW_TITLE: Record<AppView, string> = { chat: '', calendar: 'calendario', form: 'forma proyectada' }

export function TopBar() {
  const { state, logout, openProfileModal, openWorkoutsModal, openWahooModal, setView } = useApp()
  const [showCheckIn, setShowCheckIn] = useState(false)
  // undefined = unknown (not loaded or failed), null = not done today
  const [today, setToday] = useState<ReadinessLevel | null | undefined>(undefined)

  const loadToday = useCallback(async () => {
    try {
      const key = todayKey()
      const r = await checkInsApi.list(key, key)
      setToday(r.checkIns[0]?.readiness.level ?? null)
    } catch {
      setToday(undefined)
    }
  }, [])
  useEffect(() => {
    if (!state.uid) return
    loadToday()
    window.addEventListener(CHECKIN_SAVED_EVENT, loadToday)
    return () => window.removeEventListener(CHECKIN_SAVED_EVENT, loadToday)
  }, [state.uid, loadToday])

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="topbar-logo">COACH/</span>
        <span className="topbar-sep">/</span>
        <span className="topbar-conv">
          {state.view === 'chat' ? (state.conversationTitle ?? 'nueva sesión') : VIEW_TITLE[state.view]}
        </span>
      </div>
      <nav className="view-tabs" aria-label="Vistas">
        {VIEWS.map(v => (
          <button
            key={v.id}
            className={state.view === v.id ? 'active' : ''}
            aria-current={state.view === v.id ? 'page' : undefined}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>
      <div className="topbar-right">
        <button
          className={`btn-ghost ${today === null ? 'accent' : ''}`}
          onClick={() => setShowCheckIn(true)}
          title={today ? `Check-in de hoy hecho · disponibilidad ${READINESS_LABEL[today]}` : 'Cómo te encuentras hoy: cansancio, sueño y sensaciones'}
        >
          {today && <span className={`readiness-dot static readiness-${today}`} aria-hidden>●</span>}
          check-in
        </button>
        {state.wahooConnected === true && (
          <button className="btn-ghost" onClick={openWorkoutsModal}>entrenos</button>
        )}
        {state.wahooConnected === false && (
          <button className="btn-ghost" onClick={openWahooModal}>conectar wahoo</button>
        )}
        <button className="btn-ghost" onClick={openProfileModal}>perfil</button>
        <button className="btn-ghost" onClick={logout}>salir</button>
      </div>
      {showCheckIn && <CheckInModal onClose={() => setShowCheckIn(false)} />}
    </div>
  )
}
