import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { apiFetch } from '../api/client'
import type { Profile, Message, ConversationSummary } from '../types'

interface AppState {
  token: string | null
  email: string | null
  conversationId: string | null
  conversationTitle: string | null
  conversations: ConversationSummary[]
  messages: Message[]
  profile: Profile | null
  loading: boolean
  showProfileModal: boolean
  showWahooModal: boolean
  wahooConnected: boolean | null
  notification: string | null
}

interface AppContextValue {
  state: AppState
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  loadConversations: () => Promise<void>
  loadConversation: (id: string) => Promise<void>
  newConversation: () => void
  sendMessage: (content: string) => Promise<void>
  loadProfile: () => Promise<void>
  saveProfile: (data: Partial<Profile>) => Promise<void>
  openProfileModal: () => void
  closeProfileModal: () => void
  checkWahooStatus: () => Promise<void>
  connectWahoo: () => Promise<void>
  dismissWahooModal: () => void
  showNotification: (msg: string) => void
  clearNotification: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    token: localStorage.getItem('cc_token'),
    email: localStorage.getItem('cc_email'),
    conversationId: null,
    conversationTitle: null,
    conversations: [],
    messages: [],
    profile: null,
    loading: false,
    showProfileModal: false,
    showWahooModal: false,
    wahooConnected: null,
    notification: null,
  })

  const set = useCallback((patch: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  const showNotification = useCallback((msg: string) => {
    set({ notification: msg })
  }, [set])

  const clearNotification = useCallback(() => {
    set({ notification: null })
  }, [set])

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('cc_token')
    if (!token) return
    try {
      const res = await apiFetch('/profile', token)
      if (res.ok) {
        const data = await res.json()
        set({ profile: data.profile })
      }
    } catch {}
  }, [set])

  const loadConversations = useCallback(async () => {
    const token = localStorage.getItem('cc_token')
    if (!token) return
    try {
      const res = await apiFetch('/chat/conversations', token)
      if (res.ok) {
        const data = await res.json()
        set({ conversations: data.conversations })
      }
    } catch {}
  }, [set])

  const checkWahooStatus = useCallback(async () => {
    const token = localStorage.getItem('cc_token')
    if (!token) return
    try {
      const res = await apiFetch('/wahoo/status', token)
      if (res.ok) {
        const data = await res.json()
        set({ wahooConnected: data.connected, showWahooModal: !data.connected })
      }
    } catch {}
  }, [set])

  const connectWahoo = useCallback(async () => {
    const token = localStorage.getItem('cc_token')
    if (!token) return
    try {
      const res = await apiFetch('/wahoo/connect-url', token)
      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
      }
    } catch {}
  }, [])

  const dismissWahooModal = useCallback(() => {
    set({ showWahooModal: false })
  }, [set])

  useEffect(() => {
    // Handle Wahoo OAuth callback params
    const params = new URLSearchParams(window.location.search)
    if (params.get('wahoo_connected') === 'true') {
      set({ wahooConnected: true, showWahooModal: false })
      showNotification('Wahoo conectado. Tus entrenamientos ya están disponibles.')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (params.get('wahoo_error')) {
      showNotification(`Error al conectar Wahoo: ${params.get('wahoo_error')}`)
      window.history.replaceState({}, '', window.location.pathname)
    }

    if (state.token) {
      Promise.all([loadConversations(), loadProfile(), checkWahooStatus()])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch('/auth/login', null, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error desconocido')

    localStorage.setItem('cc_token', data.token)
    localStorage.setItem('cc_email', data.user.email)
    set({ token: data.token, email: data.user.email })
    await Promise.all([loadConversations(), loadProfile(), checkWahooStatus()])
  }, [set, loadConversations, loadProfile, checkWahooStatus])

  const register = useCallback(async (email: string, password: string) => {
    const res = await apiFetch('/auth/register', null, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error desconocido')
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cc_token')
    localStorage.removeItem('cc_email')
    set({
      token: null,
      email: null,
      conversationId: null,
      conversationTitle: null,
      conversations: [],
      messages: [],
      profile: null,
    })
  }, [set])

  const loadConversation = useCallback(async (id: string) => {
    const token = localStorage.getItem('cc_token')
    if (!token) return
    try {
      const res = await apiFetch(`/chat/conversations/${id}`, token)
      if (!res.ok) return
      const data = await res.json()
      const conv = data.conversation
      set({
        conversationId: id,
        conversationTitle: conv.title || 'sesión',
        messages: conv.messages,
      })
    } catch {}
  }, [set])

  const newConversation = useCallback(() => {
    set({ conversationId: null, conversationTitle: null, messages: [] })
  }, [set])

  const sendMessage = useCallback(async (content: string) => {
    const token = localStorage.getItem('cc_token')
    if (!token) return

    let currentConvId: string | null = null
    setState(prev => {
      currentConvId = prev.conversationId
      return { ...prev, loading: true, messages: [...prev.messages, { role: 'user', content }] }
    })

    try {
      const res = await apiFetch('/chat/message', token, {
        method: 'POST',
        body: JSON.stringify({ content, conversationId: currentConvId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      let isNew = false
      setState(prev => {
        isNew = !prev.conversationId
        return {
          ...prev,
          loading: false,
          messages: [...prev.messages, { role: 'assistant', content: data.message.content }],
          conversationId: prev.conversationId ?? data.conversationId,
          conversationTitle: prev.conversationTitle ?? content.slice(0, 50),
        }
      })

      if (isNew) {
        await loadConversations()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setState(prev => ({
        ...prev,
        loading: false,
        messages: [...prev.messages, { role: 'assistant', content: `Error: ${msg}` }],
      }))
    }
  }, [loadConversations])

  const saveProfile = useCallback(async (data: Partial<Profile>) => {
    const token = localStorage.getItem('cc_token')
    if (!token) return
    const res = await apiFetch('/profile', token, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    set({ profile: json.profile, showProfileModal: false })
    showNotification('Perfil guardado ✓')
  }, [set, showNotification])

  const openProfileModal = useCallback(() => set({ showProfileModal: true }), [set])
  const closeProfileModal = useCallback(() => set({ showProfileModal: false }), [set])

  return (
    <AppContext.Provider value={{
      state,
      login,
      register,
      logout,
      loadConversations,
      loadConversation,
      newConversation,
      sendMessage,
      loadProfile,
      saveProfile,
      openProfileModal,
      closeProfileModal,
      checkWahooStatus,
      connectWahoo,
      dismissWahooModal,
      showNotification,
      clearNotification,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
