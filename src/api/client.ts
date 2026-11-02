import { auth } from '../firebase'
import { env } from '../env'

// Empty → same origin (/api goes through the Vite proxy in local dev)
const API_BASE = (env('VITE_API_BASE_URL') ?? '').replace(/\/$/, '')

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
