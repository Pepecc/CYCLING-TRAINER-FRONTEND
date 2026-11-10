import { useApp } from '../../context/AppContext'
import type { AppView } from '../../context/AppContext'

const VIEWS: Array<{ id: AppView; label: string }> = [
  { id: 'chat', label: 'chat' },
  { id: 'calendar', label: 'calendario' },
  { id: 'form', label: 'forma' },
]

const VIEW_TITLE: Record<AppView, string> = { chat: '', calendar: 'calendario', form: 'forma proyectada' }

export function TopBar() {
  const { state, logout, openProfileModal, openWorkoutsModal, openWahooModal, setView } = useApp()

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
        {state.wahooConnected === true && (
          <button className="btn-ghost" onClick={openWorkoutsModal}>entrenos</button>
        )}
        {state.wahooConnected === false && (
          <button className="btn-ghost" onClick={openWahooModal}>conectar wahoo</button>
        )}
        <button className="btn-ghost" onClick={openProfileModal}>perfil</button>
        <button className="btn-ghost" onClick={logout}>salir</button>
      </div>
    </div>
  )
}
