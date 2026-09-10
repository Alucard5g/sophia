# ==============================================================================
# Dockerfile Multi-Stage de Producción para SophIA V.2026 en Google Cloud Run
# ==============================================================================
# Construido para Node.js LTS (Alpine Linux) con optimización de capas,
# seguridad sin privilegios de root (non-root user), y soporte para Port 3000.

# ------------------------------------------------------------------------------
# Fase 1: Build & Compilación de Frontend y Backend CJS
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias del sistema requeridas
RUN apk add --no-cache libc6-compat

# Copiar manifiestos de paquetes
COPY package.json ./

# Instalar dependencias completas para compilación
RUN npm install

# Copiar el código fuente completo del proyecto
COPY . .

# Ejecutar compilación de producción:
# 1. vite build (genera frontend estático en dist/)
# 2. esbuild server.ts --bundle (genera backend ejecutable en dist/server.cjs)
ENV NODE_ENV=production
RUN npm run build

# ------------------------------------------------------------------------------
# Fase 2: Runner de Producción Ligero y Seguro
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# El puerto requerido por el entorno de Cloud Run es el 3000
ENV PORT=3000

# Crear usuario seguro sin privilegios de root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sophia

# Copiar manifiesto e instalar únicamente dependencias de producción
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copiar artefactos de compilación desde la fase builder
COPY --from=builder --chown=sophia:nodejs /app/dist ./dist
COPY --from=builder --chown=sophia:nodejs /app/metadata.json ./metadata.json

# Ajustar permisos de directorios
USER sophia

# Exponer el puerto de Cloud Run
EXPOSE 3000

# Healthcheck de contenedor para Cloud Run y Kubernetes
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Comando de inicio del servidor en producción
CMD ["node", "dist/server.cjs"]
