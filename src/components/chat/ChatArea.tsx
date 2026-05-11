import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'

export function ChatArea() {
  return (
    <div className="chat-area">
      <MessageList />
      <ChatInput />
    </div>
  )
}
