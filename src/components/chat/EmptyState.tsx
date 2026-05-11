import { useApp } from '../../context/AppContext'

const QUICK_PROMPTS = [
  { label: 'carga semanal', text: '¿Cómo está mi carga de entrenamiento esta semana?' },
  { label: 'intervalos hoy', text: 'Dame un entrenamiento de intervalos para hoy' },
  { label: 'mis zonas', text: '¿Cuáles son mis zonas de potencia?' },
  { label: 'recuperación', text: 'Necesito un plan de recuperación activa' },
  { label: 'mejorar FTP', text: '¿Cómo puedo mejorar mi FTP?' },
]

export function EmptyState() {
  const { sendMessage } = useApp()

  return (
    <div className="empty-state">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 24 A8 8 0 0 1 32 24" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="24" cy="10" r="3" fill="currentColor"/>
      </svg>
      <p>Empieza una sesión con tu entrenador</p>
      <div className="quick-prompts">
        {QUICK_PROMPTS.map(q => (
          <button key={q.label} className="quick-prompt" onClick={() => sendMessage(q.text)}>
            {q.label}
          </button>
        ))}
      </div>
    </div>
  )
}
