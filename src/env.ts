// Configuración en tiempo de ejecución.
// En producción (Docker) docker-entrypoint.sh genera /config.js con window._env_;
// en local (npm run dev) se usan las variables VITE_* del .env.

type EnvKey =
  | 'VITE_API_BASE_URL'
  | 'VITE_FIREBASE_API_KEY'
  | 'VITE_FIREBASE_AUTH_DOMAIN'
  | 'VITE_FIREBASE_PROJECT_ID'
  | 'VITE_FIREBASE_STORAGE_BUCKET'
  | 'VITE_FIREBASE_MESSAGING_SENDER_ID'
  | 'VITE_FIREBASE_APP_ID'

declare global {
  interface Window {
    _env_?: Partial<Record<EnvKey, string>>
  }
}

const buildTime: Record<EnvKey, string | undefined> = {
  VITE_API_BASE_URL:                 import.meta.env.VITE_API_BASE_URL,
  VITE_FIREBASE_API_KEY:             import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN:         import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID:          import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET:      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID:              import.meta.env.VITE_FIREBASE_APP_ID,
}

// Runtime value wins; empty strings (unset vars in the container) fall back to build time
export function env(key: EnvKey): string | undefined {
  return window._env_?.[key] || buildTime[key] || undefined
}
