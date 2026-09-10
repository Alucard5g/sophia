# SophIA V.2026 — Avatar AGI Nivel 5 & Asistente Universal

Aplicación full-stack de alto rendimiento construida con **React 19**, **Tailwind CSS**, **Vite**, **Express**, y el SDK oficial de **Google GenAI (`@google/genai`)**. SophIA integra simulación cuantitativa de 3 escenarios en tiempo real, síntesis vocal auditiva, control domótico IoT / Bluetooth y soporte nativo para despliegue en contenedores en **Google Cloud Run** y **GitHub CI/CD**.

---

## 🛠️ Arquitectura y Tecnologías
- **Frontend**: React 19 + TypeScript + Motion + Tailwind CSS + Lucide Icons + React-Markdown (GFM).
- **Backend / API**: Servidor Express con Vite middleware en desarrollo y bundle CommonJS (`dist/server.cjs`) generado por `esbuild` en producción.
- **Motor de Inteligencia Artificial**: SDK `@google/genai` con cascada adaptativa y balanceo de carga:
  - `gemini-3.7-flash` (con razonamiento profundo y Google Search Grounding).
  - `gemini-3.6-flash`.
  - `gemini-3.1-flash-lite-preview`.
- **Despliegue y Contenedorización**: Multi-stage Dockerfile sobre Node 20 Alpine, puerto `3000`, optimizado para Google Cloud Run.
- **CI/CD**: Flujos de GitHub Actions (`.github/workflows/deploy-cloud-run.yml`) y Cloud Build (`cloudbuild.yaml`).

---

## 📦 Ejecución en Desarrollo Local
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Configura tu GEMINI_API_KEY en .env

# 3. Iniciar el servidor de desarrollo (puerto 3000)
npm run dev
```

Abre tu navegador en `http://localhost:3000`.

---

## 🏗️ Compilación de Producción
```bash
# Compila el frontend estático en dist/ y genera el bundle backend en dist/server.cjs
npm run build

# Ejecuta el servidor compilado
npm start
```

---

## 🐙 Sincronización con GitHub desde Aquí

Para sincronizar y enviar el código directamente a tu repositorio de GitHub:

### Opción 1: Mediante el script automático
```bash
chmod +x sync-github.sh
./sync-github.sh https://github.com/TU_USUARIO/TU_REPOSITORIO.git "feat: despliegue SophIA V.2026"
```

### Opción 2: Comandos Git directos
```bash
git init
git branch -M main
git add .
git commit -m "feat: SophIA V.2026 - configuración Cloud Run y GitHub"
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

---

## ☁️ Despliegue en Google Cloud Run

### Método 1: Despliegue directo con el Script Automatizado
```bash
chmod +x deploy-cloud-run.sh
export GCP_PROJECT_ID="tu-proyecto-google-cloud"
./deploy-cloud-run.sh
```

### Método 2: Despliegue con Google Cloud Build
```bash
gcloud builds submit --config=cloudbuild.yaml
```

### Método 3: Despliegue con Docker y gcloud CLI
```bash
# 1. Construir la imagen Docker
docker build -t gcr.io/TU_PROJECT_ID/sophia-app:latest .

# 2. Subir imagen a Google Container Registry
docker push gcr.io/TU_PROJECT_ID/sophia-app:latest

# 3. Desplegar en Cloud Run
gcloud run deploy sophia-app \
  --image gcr.io/TU_PROJECT_ID/sophia-app:latest \
  --platform managed \
  --region us-east1 \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,GEMINI_API_KEY=TU_API_KEY"
```

### Método 4: Despliegue Automatizado con GitHub Actions
El archivo `.github/workflows/deploy-cloud-run.yml` se ejecuta automáticamente al hacer `push` a la rama `main`:
1. En tu repositorio de GitHub, ve a **Settings > Secrets and variables > Actions**.
2. Añade los siguientes secretos:
   - `GCP_PROJECT_ID`: ID de tu proyecto en Google Cloud.
   - `GCP_SA_KEY`: Clave JSON de tu Service Account de Google Cloud con permisos de Cloud Run y Artifact Registry.
   - `GEMINI_API_KEY`: Tu clave de API de Google Gemini.

---

## 🩺 Verificación y Health Check
El contenedor incluye una sonda de liveness y readiness para Cloud Run en:
- `GET /api/health`
Retorna estado del servidor, uptime, uso de memoria y versión de la suite.
