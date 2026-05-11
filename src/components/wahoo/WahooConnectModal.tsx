import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export function WahooConnectModal() {
  const { connectWahoo, dismissWahooModal } = useApp()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    if (!accepted || loading) return
    setLoading(true)
    await connectWahoo()
    // connectWahoo redirects the browser; component unmounts
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) dismissWahooModal()
  }

  return (
    <div className="modal-overlay visible" onClick={handleOverlayClick}>
      <div className="modal wahoo-modal">
        <div className="modal-header">
          <span className="modal-title">Conectar con Wahoo</span>
          <button className="btn-close" onClick={dismissWahooModal}>×</button>
        </div>

        <div className="wahoo-brand">
          <svg className="wahoo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
          </svg>
          <div>
            <div className="wahoo-brand-name">WAHOO FITNESS</div>
            <div className="wahoo-brand-sub">Integración de datos de entrenamiento</div>
          </div>
        </div>

        <p className="wahoo-desc">
          Conecta tu cuenta de Wahoo para que tu entrenador IA pueda analizar tus entrenamientos reales
          y darte consejos personalizados basados en tus datos de potencia, frecuencia cardíaca y TSS.
        </p>

        <div className="wahoo-perms">
          <div className="wahoo-perms-title">Datos que se accederán</div>
          <ul className="wahoo-perms-list">
            <li>Entrenamientos y métricas de potencia (NP, IF, TSS)</li>
            <li>Frecuencia cardíaca media y máxima</li>
            <li>Zonas de potencia personalizadas de Wahoo</li>
            <li>Distancia, duración y calorías</li>
          </ul>
        </div>

        <div className="wahoo-disclaimer">
          <div className="wahoo-disclaimer-title">Aviso de privacidad y consentimiento</div>
          <p>
            Al conectar tu cuenta de Wahoo autorizas a esta aplicación a acceder a los datos de entrenamiento
            almacenados en tu perfil de Wahoo. Dichos datos se utilizan exclusivamente para generar análisis
            y recomendaciones de entrenamiento personalizadas dentro de esta aplicación. No almacenamos tus
            credenciales de Wahoo ni compartimos tus datos con terceros. El acceso se realiza mediante OAuth 2.0,
            el estándar seguro de autorización, y puedes revocar el acceso en cualquier momento desde tu perfil
            de Wahoo o desde la sección de perfil de esta aplicación.
          </p>
        </div>

        <label className="wahoo-consent-label">
          <input
            type="checkbox"
            className="wahoo-consent-check"
            checked={accepted}
            onChange={e => setAccepted(e.target.checked)}
          />
          <span>He leído el aviso anterior y acepto el acceso a mis datos de Wahoo para el análisis de entrenamientos</span>
        </label>

        <button
          className="btn-primary"
          onClick={handleConnect}
          disabled={!accepted || loading}
        >
          {loading ? 'Redirigiendo a Wahoo...' : 'Conectar con Wahoo'}
        </button>

        <button className="btn-ghost wahoo-skip-btn" onClick={dismissWahooModal}>
          Ahora no
        </button>
      </div>
    </div>
  )
}
