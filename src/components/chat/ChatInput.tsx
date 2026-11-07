import { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { MAX_IMAGES, prepareImage } from '../../utils/images'
import type { OutgoingImage } from '../../types'

export function ChatInput() {
  const { state, sendMessage, showNotification } = useApp()
  const [value, setValue] = useState('')
  const [images, setImages] = useState<OutgoingImage[]>([])
  const [preparing, setPreparing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
    }
  }, [value])

  async function addFiles(files: File[]) {
    const picked = files.filter(f => f.type.startsWith('image/'))
    if (picked.length === 0) return
    const room = MAX_IMAGES - images.length
    if (room <= 0) {
      showNotification(`Como máximo ${MAX_IMAGES} imágenes por mensaje`)
      return
    }
    if (picked.length > room) showNotification(`Como máximo ${MAX_IMAGES} imágenes por mensaje`)
    setPreparing(true)
    try {
      const ready: OutgoingImage[] = []
      for (const file of picked.slice(0, room)) {
        try {
          ready.push(await prepareImage(file))
        } catch (err) {
          showNotification(err instanceof Error ? err.message : 'No se ha podido leer la imagen')
        }
      }
      setImages(prev => [...prev, ...ready].slice(0, MAX_IMAGES))
    } finally {
      setPreparing(false)
    }
  }

  async function handleSend() {
    const content = value.trim()
    if ((!content && images.length === 0) || state.loading || preparing) return
    const toSend = images
    setValue('')
    setImages([])
    await sendMessage(content, toSend)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const files = Array.from(e.clipboardData.files)
    if (files.some(f => f.type.startsWith('image/'))) {
      e.preventDefault()
      addFiles(files)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const canSend = !state.loading && !preparing && (value.trim() !== '' || images.length > 0)

  return (
    <div
      className={`input-area${dragging ? ' dragging' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <button
        className="btn-attach"
        title="Adjuntar imagen (también puedes pegarla o arrastrarla)"
        aria-label="Adjuntar imagen"
        onClick={() => fileRef.current?.click()}
        disabled={state.loading || preparing || images.length >= MAX_IMAGES}
      >
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z"/>
        </svg>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={e => { addFiles(Array.from(e.target.files ?? [])); e.target.value = '' }}
      />
      <div className="input-wrap">
        {(images.length > 0 || preparing) && (
          <div className="input-images">
            {images.map((img, i) => (
              <div className="input-image" key={i}>
                <img src={img.previewUrl} alt={img.name} />
                <button aria-label={`Quitar ${img.name}`} onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            {preparing && <div className="input-image preparing">…</div>}
          </div>
        )}
        <textarea
          ref={textareaRef}
          placeholder={images.length ? 'Añade un comentario (opcional)...' : 'Escribe a tu entrenador...'}
          rows={1}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
      </div>
      <button className="btn-send" onClick={handleSend} disabled={!canSend} aria-label="Enviar">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471z"/>
        </svg>
      </button>
    </div>
  )
}
