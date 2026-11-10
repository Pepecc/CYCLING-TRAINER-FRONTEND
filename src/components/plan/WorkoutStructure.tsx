import type { WorkoutBlock } from '../../types/plan'
import { STEP_LABEL, targetText, durationText, cadenceText, stepIntensity, flattenSteps } from './labels'

// Perfil del entreno: cada paso es una barra con ancho = duración y alto = intensidad
export function WorkoutProfile({ blocks }: { blocks: WorkoutBlock[] }) {
  const steps = flattenSteps(blocks)
  const total = steps.reduce((s, st) => s + st.durationSeconds, 0)
  if (!total) return null
  return (
    <div className="wk-profile" aria-hidden="true">
      {steps.map((st, i) => {
        const level = stepIntensity(st)
        return (
          <div
            key={i}
            className={`wk-profile-step lvl-${Math.min(4, Math.floor(level * 5))}`}
            style={{ flexGrow: st.durationSeconds, height: `${Math.max(12, level * 100)}%` }}
            title={`${durationText(st.durationSeconds)} · ${targetText(st)}`}
          />
        )
      })}
    </div>
  )
}

export function WorkoutBlocks({ blocks }: { blocks: WorkoutBlock[] }) {
  if (!blocks.length) return <div className="muted">Sin estructura: sesión libre.</div>
  return (
    <ol className="wk-blocks">
      {blocks.map((b, i) => (
        <li key={i} className="wk-block">
          <div className="wk-block-head">
            {b.repeat > 1 && <span className="wk-repeat">{b.repeat} ×</span>}
            {b.name && <span>{b.name}</span>}
          </div>
          <ul className="wk-steps">
            {b.steps.map((st, j) => (
              <li key={j}>
                <span className="wk-step-time">{durationText(st.durationSeconds)}</span>
                <span className="wk-step-target">{targetText(st)}{cadenceText(st)}</span>
                <span className="wk-step-kind">{STEP_LABEL[st.kind]}{st.notes ? ` — ${st.notes}` : ''}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}
