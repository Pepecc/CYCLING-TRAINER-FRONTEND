export type Experience = 'beginner' | 'intermediate' | 'advanced'

export interface Profile {
  ftp: number | null
  weightKg: number | null
  hoursPerWeek: number | null
  goal: string | null
  experience: Experience
  maxHr: number | null
  restingHr: number | null
  availableDays: string | null
  limitations: string | null
  updatedAt: string
}

export interface MessageAttachment {
  id: string
  mediaType: string
  name: string | null
  sizeBytes: number
}

// Image ready to send (already shrunk); previewUrl is a data URL to show it before the server answers
export interface OutgoingImage {
  mediaType: string
  data: string
  name: string
  previewUrl: string
}

export interface Message {
  id?: string
  conversationId?: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  attachments?: MessageAttachment[]
  localImages?: string[]      // previews of images just sent (not reloaded from the server yet)
}

export interface WahooWorkoutSummary {
  durationActiveSeconds: number | null
  distanceInMeters: number | null
  ascentInMeters: number | null
  heartRateAvg: number | null
  powerAvg: number | null
  normalizedPower: number | null
  tss: number | null
}

export interface WahooWorkout {
  id: number
  name: string
  startedAt: string
  durationMinutes: number
  workoutTypeName: string
  location: 'indoor' | 'outdoor' | 'unknown'
  summary: WahooWorkoutSummary | null
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
