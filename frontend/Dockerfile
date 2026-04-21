FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
RUN mkdir -p frontend packages/shared-api packages/shared-domain packages/shared-i18n wechat-miniapp
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY packages/shared-api/package.json ./packages/shared-api/package.json
COPY packages/shared-domain/package.json ./packages/shared-domain/package.json
COPY packages/shared-i18n/package.json ./packages/shared-i18n/package.json
COPY wechat-miniapp/package.json ./wechat-miniapp/package.json
RUN npm ci

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY frontend ./frontend
COPY packages ./packages
COPY wechat-miniapp/package.json ./wechat-miniapp/package.json
RUN npm --workspace frontend run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /app/frontend ./frontend
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/wechat-miniapp/package.json ./wechat-miniapp/package.json

USER nextjs
WORKDIR /app/frontend

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
