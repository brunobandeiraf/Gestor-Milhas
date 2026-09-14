# =============================================================================
# Gestor Milhas API — Production Dockerfile (Railway)
# =============================================================================
# Multi-stage build: builder instala dependências, gera o Prisma Client e
# compila TypeScript; runner copia apenas o necessário para a imagem final.
# =============================================================================

# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependências (incluindo devDependencies, necessárias para o build)
COPY package.json package-lock.json* ./
RUN npm install

# Gera o Prisma Client a partir do schema
COPY prisma ./prisma
RUN npx prisma generate

# Compila TypeScript (inclui o client gerado em src/generated/prisma)
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

# Instala apenas dependências de produção
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copia artefatos compilados e o schema/migrations (necessários em runtime)
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 3000

ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
