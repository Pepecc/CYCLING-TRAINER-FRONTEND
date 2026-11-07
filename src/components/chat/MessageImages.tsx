import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/client'
import type { Message, MessageAttachment } from '../../types'

// Stored images need the auth header: fetch them as blobs and show them through object URLs
function StoredImage({ conversationId, attachment }: { conversationId: string; attachment: MessageAttachment }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    apiFetch(`/chat/conversations/${conversationId}/attachments/${attachment.id}`)
      .then(res => (res.ok ? res.blob() : Promise.reject(new Error())))
      .then(blob => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [conversationId, attachment.id])

  if (failed) return <div className="msg-image missing">imagen no disponible</div>
  if (!url) return <div className="msg-image loading" />
  return (
    <a className="msg-image" href={url} target="_blank" rel="noreferrer" title={attachment.name ?? undefined}>
      <img src={url} alt={attachment.name ?? 'imagen adjunta'} />
    </a>
  )
}

export function MessageImages({ message }: { message: Message }) {
  if (message.localImages?.length) {
    return (
      <div className="msg-images">
        {/* Browsers block opening data: URLs in a new tab, so these are not links */}
        {message.localImages.map((src, i) => (
          <div className="msg-image" key={i}>
            <img src={src} alt="imagen adjunta" />
          </div>
        ))}
      </div>
    )
  }
  if (!message.attachments?.length || !message.conversationId) return null
  return (
    <div className="msg-images">
      {message.attachments.map(a => (
        <StoredImage key={a.id} conversationId={message.conversationId!} attachment={a} />
      ))}
    </div>
  )
}
