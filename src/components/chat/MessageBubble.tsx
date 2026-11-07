import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../../types'
import { MessageImages } from './MessageImages'

// Prefix of the context message the backend sends when analyzing a Wahoo workout
const ANALYSIS_PREFIX = 'ENTRENO A ANALIZAR'

export function MessageBubble({ message }: { message: Message }) {
  const time = new Date(message.createdAt ?? Date.now())
    .toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const label = message.role === 'user' ? 'tú' : 'coach'
  const isAnalysisRequest = message.role === 'user' && message.content.startsWith(ANALYSIS_PREFIX)

  return (
    <div className={`msg ${message.role}`}>
      <div className="msg-label">{label}</div>
      {isAnalysisRequest ? (
        <details className="msg-bubble msg-analysis">
          <summary>Análisis de entreno de Wahoo</summary>
          <div className="msg-analysis-data">{message.content}</div>
        </details>
      ) : message.role === 'assistant' ? (
        <div className="msg-bubble msg-markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      ) : (
        <>
          <MessageImages message={message} />
          {message.content && <div className="msg-bubble">{message.content}</div>}
        </>
      )}
      <div className="msg-time">{time}</div>
    </div>
  )
}
