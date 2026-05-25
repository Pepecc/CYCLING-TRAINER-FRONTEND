import { auth } from '../firebase'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null
  return fetch(API_BASE + '/api' + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  })
}
