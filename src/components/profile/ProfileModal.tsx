import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ZONE_COLORS, ZONE_LABELS, computeWperKg } from '../../utils/powerZones'
import type { Experience } from '../../types'

export function ProfileModal() {
  const { state, closeProfileModal, saveProfile } = useApp()
  const p = state.profile

  const [ftp, setFtp] = useState(p?.ftp?.toString() ?? '')
  const [weight, setWeight] = useState(p?.weightKg?.toString() ?? '')
  const [hours, setHours] = useState(p?.hoursPerWeek?.toString() ?? '')
  const [goal, setGoal] = useState(p?.goal ?? '')
  const [experience, setExperience] = useState<Experience>(p?.experience ?? 'intermediate')

  const ftpNum = parseInt(ftp) || 0
  const weightNum = parseFloat(weight) || 0

  async function handleSave() {
    try {
      await saveProfile({
        ftp: parseInt(ftp) || null,
        weightKg: parseFloat(weight) || null,
        hoursPerWeek: parseFloat(hours) || null,
        goal: goal.trim() || null,
        experience,
      })
    } catch (err) {
      // saveProfile shows notification on success; errors surface via context
    }
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
        </div>

        {ftpNum > 0 && (
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' }}>
              Zonas de potencia
            </div>
            <div className="zones-preview">
              {ZONE_COLORS.map((color, i) => (
                <div key={i} className="zone-bar" style={{ background: color }} title={ZONE_LABELS[i]} />
              ))}
            </div>
          </div>
        )}

        <button className="btn-primary" onClick={handleSave}>Guardar perfil</button>
      </div>
    </div>
  )
}
