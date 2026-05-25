import { useState } from 'react'
import { useApp } from '../../context/AppContext'

type Tab = 'login' | 'register'

export function AuthScreen() {
  const { login, register, showNotification } = useApp()
  const [tab, setTab]               = useState<Tab>('login')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [verifyPending, setVerifyPending] = useState(false)

  function switchTab(t: Tab) {
    setTab(t)
    setError('')
    setVerifyPending(false)
  }

  async function handleSubmit() {
    setError('')

    if (tab === 'login') {
      if (!email || !password) { setError('Completa todos los campos'); return }
    } else {
      if (!firstName || !email || !password || !confirm) { setError('Completa todos los campos'); return }
      if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
      if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    }

    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        await register(email, password, firstName, lastName)
        setVerifyPending(true)
        showNotification('Cuenta creada. Revisa tu email para verificarla.')
      }
    } catch (err) {
      setError(translateFirebaseError(err))
    } finally {
      setLoading(false)
    }
  }

  if (verifyPending) {
    return (
      <div className="auth-screen">
        <Logo />
        <div className="auth-card">
          <div className="auth-verify-message">
            <p>Te hemos enviado un correo de verificación a <strong>{email}</strong>.</p>
            <p>Confirma tu cuenta y después inicia sesión.</p>
          </div>
          <button className="btn-primary" onClick={() => { setVerifyPending(false); switchTab('login') }}>
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <Logo />

      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
          >
            Iniciar sesión
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => switchTab('register')}
          >
            Registrarse
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {tab === 'register' && (
          <div className="auth-name-row">
            <div className="field">
              <label>Nombre</label>
              <input
                type="text"
                placeholder="Abraham"
                autoComplete="given-name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Apellidos</label>
              <input
                type="text"
                placeholder="Olano"
                autoComplete="family-name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>
          </div>
        )}

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
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && tab === 'login') handleSubmit() }}
          />
        </div>

        {tab === 'register' && (
          <div className="field">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            />
          </div>
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? '...' : tab === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </div>
    </div>
  )
}

function Logo() {
  return (
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
  )
}

function translateFirebaseError(err: unknown): string {
  const code = (err as { code?: string }).code ?? ''
  const map: Record<string, string> = {
    'auth/email-already-in-use':    'Ya existe una cuenta con ese email.',
    'auth/invalid-email':           'El email no es válido.',
    'auth/weak-password':           'La contraseña es demasiado débil (mínimo 6 caracteres).',
    'auth/user-not-found':          'No existe ninguna cuenta con ese email.',
    'auth/wrong-password':          'Contraseña incorrecta.',
    'auth/invalid-credential':      'Email o contraseña incorrectos.',
    'auth/too-many-requests':       'Demasiados intentos fallidos. Espera unos minutos.',
    'auth/network-request-failed':  'Error de red. Comprueba tu conexión.',
    'auth/user-disabled':           'Esta cuenta ha sido deshabilitada.',
  }
  return map[code] ?? (err instanceof Error ? err.message : 'Error desconocido')
}
