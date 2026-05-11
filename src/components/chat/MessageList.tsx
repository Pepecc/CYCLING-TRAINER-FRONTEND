import { useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { EmptyState } from './EmptyState'

export function MessageList() {
  const { state } = useApp()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages, state.loading])

  if (state.messages.length === 0 && !state.loading) {
    return (
      <div className="messages">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="messages">
      {state.messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      {state.loading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}
