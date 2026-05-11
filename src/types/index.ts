export type Experience = 'beginner' | 'intermediate' | 'advanced'

export interface Profile {
  ftp: number | null
  weightKg: number | null
  hoursPerWeek: number | null
  goal: string | null
  experience: Experience
  updatedAt: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ConversationSummary {
  id: string
  title: string | null
  createdAt: string
}

export interface Conversation {
  id: string
  title: string | null
  messages: Message[]
  createdAt: string
}
