import { useMemo, useRef, useState } from 'react'
import { planApi } from '../../api/plan'
import { useApp } from '../../context/AppContext'
import { prepareImage } from '../../utils/images'
import type { ImportPreview } from '../../types/plan'
import { FOCUS_LABEL } from './labels'
import { formatMinutes, formatShort } from '../../utils/dates'

type Source = 'file' | 'image'

const FORMAT_LABEL: Record<string, string> = {
  trainingpeaks: 'TrainingPeaks', 'cycling-coach': 'Cycling Coach', image: 'imagen',
}

const MAX_FILE_BYTES = 7 * 1024 * 1024   // el backend acepta 8 MB de JSON

export function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: (firstDate: string | null) => void }) {
  const { showNotification } = useApp()
  const [source, setSource] = useState<Source>('file')
  const [hint, setHint] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [chosen, setChosen] = useState<Set<number>>(new Set())
  const [onDuplicate, setOnDuplicate] = useState<'skip' | 'replace'>('skip')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setPreview(null)
    setChosen(new Set())
    setError('')
    setImagePreviewUrl(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function showPreview(p: ImportPreview) {
    setPreview(p)
    setChosen(new Set(p.items.filter(i => i.valid).map(i => i.index)))
  }

  async function handleFile(file: File) {
    setError('')
    setBusy(true)
    try {
      if (source === 'file') {
        if (file.size > MAX_FILE_BYTES) throw new Error('El fichero es demasiado grande (máx. 7 MB)')
        let json: unknown
        try { json = JSON.parse(await file.text()) } catch { throw new Error('El fichero no es un JSON válido') }
        showPreview(await planApi.previewFile(json))
      } else {
        const img = await prepareImage(file)
        setImagePreviewUrl(img.previewUrl)
        showPreview(await planApi.previewImage({ mediaType: img.mediaType, data: img.data }, hint.trim()))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el fichero')
    } finally {
      setBusy(false)
    }
  }

  const selectedItems = useMemo(
    () => (preview?.items ?? []).filter(i => i.valid && chosen.has(i.index)),
    [preview, chosen]
  )
  const selectedDuplicates = selectedItems.filter(i => i.duplicateOf).length

  function toggle(index: number) {
    setChosen(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function toggleAll() {
    if (!preview) return
    const valid = preview.items.filter(i => i.valid)
    setChosen(chosen.size === valid.length ? new Set() : new Set(valid.map(i => i.index)))
  }

  async function confirm() {
    if (!selectedItems.length) return
    setBusy(true)
    setError('')
    try {
      const r = await planApi.confirmImport(selectedItems, onDuplicate)
      const parts = [`${r.created} creados`]
      if (r.updated) parts.push(`${r.updated} actualizados`)
      if (r.skipped) parts.push(`${r.skipped} ya estaban`)
      showNotification(`Importado: ${parts.join(', ')}`)
      onImported(r.created || r.updated ? r.from : null)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo importar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay visible" onClick={e => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <div className="modal detail-modal import-modal">
        <div className="modal-header">
          <span className="modal-title">Importar entrenos</span>
          <button className="btn-close" onClick={onClose} disabled={busy}>×</button>
        </div>

        {!preview && (
          <>
            <div className="seg">
              <button className={source === 'file' ? 'active' : ''} onClick={() => { setSource('file'); reset() }}>fichero JSON</button>
              <button className={source === 'image' ? 'active' : ''} onClick={() => { setSource('image'); reset() }}>foto o captura</button>
            </div>

            {source === 'file' ? (
              <p className="muted">Exportación de TrainingPeaks (lista de entrenos con <code>workoutDay</code> y <code>structure</code>) o el formato propio de Cycling Coach.</p>
            ) : (
              <>
                <p className="muted">Foto o captura de una tabla de entrenos. El coach la transcribe y verás el resultado antes de guardar nada.</p>
                <div className="field">
                  <label>Indicación (opcional)</label>
                  <input value={hint} onChange={e => setHint(e.target.value)} maxLength={300}
                    placeholder="p. ej. la semana empieza el lunes 16 de noviembre" />
                </div>
              </>
            )}

            <input
              ref={fileRef}
              type="file"
              accept={source === 'file' ? 'application/json,.json' : 'image/jpeg,image/png,image/webp,image/gif'}
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? (source === 'image' ? 'leyendo la imagen…' : 'leyendo…') : 'Elegir fichero'}
            </button>
          </>
        )}

        {preview && (
          <>
            {imagePreviewUrl && <img className="import-image" src={imagePreviewUrl} alt="Imagen importada" />}
            <div className="detail-metrics">
              <div className="metric"><div className="metric-label">Formato</div><div className="metric-value">{FORMAT_LABEL[preview.format] ?? preview.format}</div></div>
              <div className="metric"><div className="metric-label">Entrenos</div><div className="metric-value">{preview.valid}<span className="metric-sub"> / {preview.total}</span></div></div>
              <div className="metric"><div className="metric-label">Horas · TSS</div><div className="metric-value">{preview.totalHours} h · {Math.round(preview.totalTss)}</div></div>
              {preview.from && <div className="metric"><div className="metric-label">Fechas</div><div className="metric-value">{formatShort(preview.from)} – {formatShort(preview.to!)}</div></div>}
            </div>
            {preview.invalid > 0 && <div className="warn">⚠ {preview.invalid} no se pueden importar (ver el motivo en la lista).</div>}
            {preview.warnings.map((w, i) => <div key={i} className="warn">⚠ {w}</div>)}

            <div className="import-list-head">
              <label className="check"><input type="checkbox" checked={chosen.size > 0 && chosen.size === preview.valid} onChange={toggleAll} /> todos</label>
              <span className="muted">{selectedItems.length} seleccionados</span>
            </div>
            <div className="import-list">
              {preview.items.map(item => (
                <label key={item.index} className={`import-item ${item.valid ? '' : 'invalid'}`}>
                  <input type="checkbox" disabled={!item.valid} checked={item.valid && chosen.has(item.index)} onChange={() => toggle(item.index)} />
                  <div className="import-item-main">
                    {item.workout ? (
                      <>
                        <div className="import-item-title">
                          <span className="muted">{formatShort(item.workout.date)}</span> {item.workout.title}
                          {item.duplicateOf && <span className="tag">ya en el plan</span>}
                        </div>
                        <div className="muted">
                          {FOCUS_LABEL[item.workout.focus]} · {formatMinutes(item.workout.durationMinutes)}
                          {item.workout.plannedTss != null && ` · ${Math.round(item.workout.plannedTss)} TSS`}
                          {item.workout.structure && ` · ${item.workout.structure}`}
                        </div>
                      </>
                    ) : <div className="import-item-title">Entrada {item.index + 1}</div>}
                    {item.error && <div className="auth-error">{item.error}</div>}
                    {item.warnings.map((w, i) => <div key={i} className="warn small">⚠ {w}</div>)}
                  </div>
                </label>
              ))}
            </div>

            {selectedDuplicates > 0 && (
              <div className="field">
                <label>{selectedDuplicates} ya están en el plan</label>
                <select value={onDuplicate} onChange={e => setOnDuplicate(e.target.value as 'skip' | 'replace')}>
                  <option value="skip">Dejarlos como están</option>
                  <option value="replace">Sustituirlos por los importados</option>
                </select>
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}
            <div className="detail-actions">
              <button className="btn-ghost" onClick={reset} disabled={busy}>otro fichero</button>
              <span className="spacer" />
              <button className="btn-primary inline" onClick={confirm} disabled={busy || !selectedItems.length}>
                {busy ? 'guardando…' : `Guardar ${selectedItems.length}`}
              </button>
            </div>
          </>
        )}

        {!preview && error && <div className="auth-error">{error}</div>}
      </div>
    </div>
  )
}
