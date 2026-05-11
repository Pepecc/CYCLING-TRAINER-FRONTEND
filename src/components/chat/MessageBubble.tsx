import type { Message } from '../../types'

export function MessageBubble({ message }: { message: Message }) {
  const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const label = message.role === 'user' ? 'tú' : 'coach'

  return (
    <div className={`msg ${message.role}`}>
      <div className="msg-label">{label}</div>
      <div className="msg-bubble">{message.content}</div>
      <div className="msg-time">{time}</div>
    </div>
  )
}
