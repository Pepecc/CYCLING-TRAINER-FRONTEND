# cycling-coach-frontend

Frontend React para **COACH/** — una aplicación de entrenamiento ciclista con IA que actúa como entrenador personal a través de un chat conversacional.

## Stack

- **React 18** + **TypeScript**
- **Vite 6** — bundler y servidor de desarrollo
- **Nginx** — servidor estático en producción
- **Docker** — imagen multi-stage (build con Node 20, serve con nginx:alpine)

## Funcionalidades

- **Autenticación** — registro e inicio de sesión con JWT almacenado en `localStorage`
- **Chat con IA** — conversaciones persistentes con el entrenador, historial en la barra lateral
- **Perfil ciclista** — FTP, peso, horas semanales, nivel de experiencia y objetivo principal
- **Zonas de potencia** — visualización de las 7 zonas calculadas a partir del FTP y el w/kg
- **Integración Wahoo** — conexión OAuth con la plataforma Wahoo para importar entrenamientos
- **Notificaciones** — sistema de toast ligero para feedback de acciones

## Estructura

```
src/
├── components/
│   ├── auth/        # Pantalla de login/registro
│   ├── chat/        # Área de chat, lista de mensajes, input
│   ├── layout/      # TopBar y Sidebar
│   ├── profile/     # Modal de perfil ciclista
│   └── ui/          # Componentes genéricos (Notification)
├── context/
│   └── AppContext.tsx  # Estado global y llamadas a la API
├── api/
│   └── client.ts      # Wrapper de fetch autenticado
├── utils/
│   └── powerZones.ts  # Cálculo de zonas y w/kg
└── types/
    └── index.ts       # Tipos compartidos (Profile, Message, Conversation)
```

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:5173
```

El servidor de desarrollo proxifica `/api` hacia `http://localhost:3000` (backend esperado en ese puerto).

## Build

```bash
npm run build      # tsc + vite build → dist/
npm run preview    # sirve dist/ localmente
```

## Docker

```bash
# Construir imagen
docker build -t cycling-coach-frontend .

# Ejecutar (Render inyecta $PORT automáticamente)
docker run -e PORT=80 -p 80:80 cycling-coach-frontend
```

El Dockerfile usa un build multi-stage: Node 20 compila los assets y nginx:alpine los sirve. La variable de entorno `$PORT` se resuelve en tiempo de ejecución mediante `envsubst` de nginx.

## Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `PORT` | Puerto en el que escucha nginx | `80` (Render lo inyecta) |

La URL del backend se configura a través del proxy de Vite en desarrollo y del servidor nginx en producción.
