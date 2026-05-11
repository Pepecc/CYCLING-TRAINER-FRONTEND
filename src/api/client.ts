const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiFetch(
  path: string,
  token: string | null,
  opts: RequestInit = {}
): Promise<Response> {
  return fetch(API_BASE + '/api' + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  })
}
