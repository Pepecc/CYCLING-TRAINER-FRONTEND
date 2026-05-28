# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine3.22 AS builder

RUN apk update && apk upgrade --no-cache

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app


COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: serve ──────────────────────────────────────────────────────────
FROM nginx:alpine3.22 AS runner

# nginx lee /etc/nginx/templates/*.template y aplica envsubst automáticamente,
# lo que permite usar $PORT que Render inyecta en tiempo de ejecución.
COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=builder /app/dist /usr/share/nginx/html

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
