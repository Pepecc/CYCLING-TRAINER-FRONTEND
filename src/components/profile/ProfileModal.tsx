import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { computeZones, computeWperKg } from '../../utils/powerZones'
import type { Experience } from '../../types'

export function ProfileModal() {
  const { state, closeProfileModal, saveProfile, disconnectWahoo, openWahooModal } = useApp()
  const p = state.profile
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const [ftp, setFtp] = useState(p?.ftp?.toString() ?? '')
  const [weight, setWeight] = useState(p?.weightKg?.toString() ?? '')
  const [hours, setHours] = useState(p?.hoursPerWeek?.toString() ?? '')
  const [goal, setGoal] = useState(p?.goal ?? '')
  const [experience, setExperience] = useState<Experience>(p?.experience ?? 'intermediate')
  const [maxHr, setMaxHr] = useState(p?.maxHr?.toString() ?? '')
  const [restingHr, setRestingHr] = useState(p?.restingHr?.toString() ?? '')
  const [availableDays, setAvailableDays] = useState(p?.availableDays ?? '')
  const [targetEvents, setTargetEvents] = useState(p?.targetEvents ?? '')
  const [limitations, setLimitations] = useState(p?.limitations ?? '')

  const ftpNum = parseInt(ftp) || 0
  const weightNum = parseFloat(weight) || 0

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      await saveProfile({
        ftp: parseInt(ftp) || null,
        weightKg: parseFloat(weight) || null,
        hoursPerWeek: parseFloat(hours) || null,
        goal: goal.trim() || null,
        experience,
        maxHr: parseInt(maxHr) || null,
        restingHr: parseInt(restingHr) || null,
        availableDays: availableDays.trim() || null,
        targetEvents: targetEvents.trim() || null,
        limitations: limitations.trim() || null,
      })
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'No se pudo guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    if (!confirmDisconnect) { setConfirmDisconnect(true); return }
    await disconnectWahoo()
    setConfirmDisconnect(false)
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) closeProfileModal()
  }

  return (
    <div className="modal-overlay visible" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Tu perfil ciclista</span>
          <button className="btn-close" onClick={closeProfileModal}>×</button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {ftpNum > 0 && weightNum > 0 && (
          <div className="profile-badge">
            ⚡ {ftpNum}w / {computeWperKg(ftpNum, weightNum)} w/kg / {hours}h semana
          </div>
        )}

        <div className="modal-grid">
          <div className="field">
            <label>FTP (watios)</label>
            <input type="number" placeholder="280" min="100" max="600" value={ftp} onChange={e => setFtp(e.target.value)} />
          </div>
          <div className="field">
            <label>Peso (kg)</label>
            <input type="number" placeholder="70" min="40" max="150" step="0.5" value={weight} onChange={e => setWeight(e.target.value)} />
          </div>
          <div className="field">
            <label>Horas / semana</label>
            <input type="number" placeholder="8" min="1" max="30" step="0.5" value={hours} onChange={e => setHours(e.target.value)} />
          </div>
          <div className="field">
            <label>Nivel</label>
            <select value={experience} onChange={e => setExperience(e.target.value as Experience)}>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>
          <div className="field span2">
            <label>Objetivo principal</label>
            <input type="text" placeholder="ej: preparar Mallorca 312, mejorar FTP, perder peso" value={goal} onChange={e => setGoal(e.target.value)} />
          </div>
          <div className="field">
            <label>FC máxima (ppm)</label>
            <input type="number" placeholder="185" min="100" max="230" value={maxHr} onChange={e => setMaxHr(e.target.value)} />
          </div>
          <div className="field">
            <label>FC en reposo (ppm)</label>
            <input type="number" placeholder="50" min="25" max="120" value={restingHr} onChange={e => setRestingHr(e.target.value)} />
          </div>
          <div className="field span2">
            <label>Días disponibles</label>
            <input type="text" placeholder="ej: martes, jueves, sábado y domingo" value={availableDays} onChange={e => setAvailableDays(e.target.value)} />
          </div>
          <div className="field span2">
            <label>Eventos objetivo y fechas</label>
            <input type="text" placeholder="ej: Quebrantahuesos 20/06/2027" value={targetEvents} onChange={e => setTargetEvents(e.target.value)} />
          </div>
          <div className="field span2">
            <label>Lesiones o limitaciones</label>
            <input type="text" placeholder="ej: molestias en rodilla izquierda" value={limitations} onChange={e => setLimitations(e.target.value)} />
          </div>
        </div>

        {ftpNum > 0 && (
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' }}>
              Zonas de potencia
            </div>
            <div className="zones-table">
              {computeZones(ftpNum).map(z => (
                <div key={z.label} className="zone-row">
                  <span className="zone-swatch" style={{ background: z.color }} />
                  <span className="zone-label">{z.label}</span>
                  <span className="zone-range">{z.max === null ? `${z.min}w +` : `${z.min}–${z.max}w`}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="profile-wahoo">
          <span>
            Wahoo: {state.wahooConnected ? <strong className="wahoo-on">conectado</strong> : 'no conectado'}
          </span>
          {state.wahooConnected ? (
            <button className="btn-ghost" onClick={handleDisconnect}>
              {confirmDisconnect ? '¿seguro? pulsa otra vez' : 'desconectar'}
            </button>
          ) : (
            <button className="btn-ghost" onClick={openWahooModal}>conectar</button>
          )}
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>
    </div>
  )
}
