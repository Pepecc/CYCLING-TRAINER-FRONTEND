import { useState } from 'react'
import { useApp } from '../../context/AppContext'

type Tab = 'login' | 'register'

export function AuthScreen() {
  const { login, register, showNotification } = useApp()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true)
    setError('')
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
        setTab('login')
        setPassword('')
        showNotification('Cuenta creada. Inicia sesión.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" stroke="#e8ff47" strokeWidth="1.5"/>
          <circle cx="20" cy="20" r="7" fill="none" stroke="#e8ff47" strokeWidth="1.5"/>
          <path d="M14 20 A6 6 0 0 1 26 20" stroke="#e8ff47" strokeWidth="1.5" fill="none"/>
          <circle cx="20" cy="8" r="2.5" fill="#e8ff47"/>
          <path d="M20 10.5 L17 17 H23 L20 10.5Z" fill="#e8ff47" opacity="0.5"/>
        </svg>
        <div>
          <div className="auth-logo-text">COACH/</div>
          <div className="auth-tagline">cycling intelligence</div>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError('') }}
          >
            Iniciar sesión
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError('') }}
          >
            Registrarse
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          />
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? '...' : tab === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </div>
    </div>
  )
}
