FROM node:20-bookworm-slim AS deps

WORKDIR /workspace/frontend-v2

COPY package.json package-lock.json ./
RUN npm ci


FROM node:20-bookworm-slim AS builder

WORKDIR /workspace/frontend-v2

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /workspace/frontend-v2/node_modules ./node_modules
COPY . .

RUN npm run build


FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV HOSTNAME=0.0.0.0 \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

COPY --from=builder /workspace/frontend-v2/public ./public
COPY --from=builder /workspace/frontend-v2/.next/standalone ./
COPY --from=builder /workspace/frontend-v2/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
