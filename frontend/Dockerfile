# syntax=docker/dockerfile:1
# Production image for the Matessa storefront (Next.js 16, standalone output).
# Multi-stage: install deps → build → run a tiny non-root runtime image.
# The browser only ever talks to THIS server (same-origin BFF at /api/bff); it in turn
# calls the gateway server-side via API_GATEWAY_URL. So no NEXT_PUBLIC_* build args are
# needed — the gateway URL is read from the environment at runtime.

# ---- deps: install exactly the locked dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile to a self-contained server bundle (.next/standalone) ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: minimal, non-root, production-only ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3100 \
    HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs
# public assets (brand logos, patterns) + the standalone server + hashed static chunks
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3100
CMD ["node", "server.js"]
