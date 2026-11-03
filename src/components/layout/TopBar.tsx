import { useApp } from '../../context/AppContext'

export function TopBar() {
  const { state, logout, openProfileModal, openWorkoutsModal, openWahooModal } = useApp()

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="topbar-logo">COACH/</span>
        <span className="topbar-sep">/</span>
        <span className="topbar-conv">
          {state.conversationTitle ?? 'nueva sesión'}
        </span>
      </div>
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
