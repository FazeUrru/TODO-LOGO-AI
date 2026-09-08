# ─────────────────────────────────────────────────────────────
# todólogo.ai — imagen de producción multi-stage (Bun + Next standalone)
# Construir:  docker build -t todologo-ai .
# Ejecutar:   docker run -p 3000:3000 -v ./db:/app/db todologo-ai
# ─────────────────────────────────────────────────────────────

# ── Fase 1: dependencias ─────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

# ── Fase 2: build de producción ──────────────────────────────
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate
# La build no necesita datos, solo un esquema válido para el cliente
ENV DATABASE_URL=file:./db/build.db
RUN bunx prisma db push --accept-data-loss \
 && bun run build

# ── Fase 3: runner mínimo ────────────────────────────────────
FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/app/db/custom.db

# El script build ya dejó .next/static y public dentro de standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
# Base con el esquema ya aplicado (se puede montar como volumen)
COPY --from=builder /app/db/build.db ./db/custom.db
COPY prisma ./prisma

RUN mkdir -p /app/db
EXPOSE 3000

CMD ["bun", "server.js"]
