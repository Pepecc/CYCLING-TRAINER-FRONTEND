import type { RaceEvent, RaceWindow } from '../../types/plan'
import { RACE_TYPE_LABEL, PRIORITY_LABEL } from './labels'
import { countdown, daysBetween, formatLong, formatShort, todayKey } from '../../utils/dates'

export function RaceModal({ race, window: win, onClose }: { race: RaceEvent; window: RaceWindow | null; onClose: () => void }) {
  const days = daysBetween(todayKey(), race.date)
  return (
    <div className="modal-overlay visible" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal detail-modal">
        <div className="modal-header">
          <div>
            <div className="modal-title"><span className={`race-badge prio-${race.priority}`}>{race.priority}</span> {race.name}</div>
            <div className="detail-sub">
              {formatLong(race.date)}{race.days > 1 ? ` · ${race.days} días` : ''} · {days >= 0 ? `faltan ${countdown(days)}` : countdown(days)}
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="detail-tags">
          <span className="tag">{RACE_TYPE_LABEL[race.type] ?? race.type}</span>
          <span className="tag">{PRIORITY_LABEL[race.priority]}</span>
          {race.location && <span className="tag">{race.location}</span>}
        </div>

        <div className="detail-metrics">
          {race.distanceKm != null && <div className="metric"><div className="metric-label">Distancia</div><div className="metric-value">{race.distanceKm} km</div></div>}
          {race.elevationM != null && <div className="metric"><div className="metric-label">Desnivel</div><div className="metric-value">{race.elevationM} m</div></div>}
        </div>

        {race.goal && <p className="detail-text"><span className="muted">Objetivo:</span> {race.goal}</p>}
        {race.notes && <p className="detail-text muted">{race.notes}</p>}
        {race.result && <p className="detail-text"><span className="muted">Resultado:</span> {race.result}</p>}

        {win && (win.taper || win.recovery) && (
          <div className="detail-box">
            {win.taper && <div>{race.priority === 'A' ? 'Taper' : 'Mini-taper'}: {formatShort(win.taper.from)} – {formatShort(win.taper.to)}</div>}
            {win.recovery && <div>Recuperación: {formatShort(win.recovery.from)} – {formatShort(win.recovery.to)}</div>}
            {win.warnings.map((w, i) => <div key={i} className="warn">⚠ {w}</div>)}
          </div>
        )}

        <div className="muted">Las carreras se añaden o cambian hablando con el coach.</div>
      </div>
    </div>
  )
}
