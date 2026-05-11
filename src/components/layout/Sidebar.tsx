import { useApp } from '../../context/AppContext'

export function Sidebar() {
  const { state, loadConversation, newConversation, openProfileModal } = useApp()

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Sesiones</span>
        <button className="btn-new" onClick={newConversation} title="Nueva sesión">+</button>
      </div>

      <div className="conv-list">
        {state.conversations.length === 0 ? (
          <div style={{ padding: '.75rem', fontSize: '11px', color: 'var(--text3)' }}>
            Sin sesiones aún
          </div>
        ) : (
          state.conversations.map(c => (
            <div
              key={c.id}
              className={`conv-item ${c.id === state.conversationId ? 'active' : ''}`}
              onClick={() => loadConversation(c.id)}
            >
              {c.title ?? 'Sesión'}
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <button className="btn-profile" onClick={openProfileModal}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 1a5 5 0 0 0-5 5 .5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5 5 5 0 0 0-5-5z"/>
          </svg>
          <span>{state.email ?? 'cuenta'}</span>
        </button>
      </div>
    </div>
  )
}
