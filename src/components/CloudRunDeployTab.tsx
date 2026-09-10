import React, { useState } from 'react';
import { GitBranch, Cloud, CheckCircle2, Copy, Terminal, Server, ExternalLink, ShieldAlert, Bot } from 'lucide-react';

export const CloudRunDeployTab: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const dockerfileCode = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]`;

  const cloudRunDeployCmd = `gcloud run deploy sophia-ai-service \\
  --source . \\
  --region us-east1 \\
  --allow-unauthenticated \\
  --port 3000 \\
  --set-env-vars "NODE_ENV=production,GEMINI_API_KEY=your_gemini_api_key_here"`;

  const githubActionsCode = `name: Deploy SophIA AI Assistant to Google Cloud Run

on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: \${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy sophia-ai-service \\
            --source . \\
            --region us-east1 \\
            --allow-unauthenticated \\
            --port 3000 \\
            --set-env-vars "GEMINI_API_KEY=\${{ secrets.GEMINI_API_KEY }}"`;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Despliegue de SophIA en GitHub & Cloud Run</h2>
            <p className="text-xs text-slate-400">
              Proceso automatizado para subir a repositorio y correr en Google Cloud Run
            </p>
          </div>
        </div>

        {/* Readiness Badge */}
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>SophIA Lista para Cloud Run:</strong> Servidor Express en puerto 3000, bundling con esbuild y API Gemini del lado del servidor.
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: GitHub Push Guide */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-rose-400" />
            Paso 1: Subir el Código a GitHub
          </h3>
          <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-800 font-mono">
            git push origin main
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Ejecuta estos comandos en tu terminal local para inicializar el repositorio e incluir este proyecto:
        </p>

        <div className="relative bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-rose-300">
          <pre className="whitespace-pre-wrap">
            {`git init
git add .
git commit -m "feat: Asistente de Voz SophIA con simulador de escenarios y multi-formato"
git branch -M main
git remote add origin https://github.com/tu-usuario/sophia-ai-assistant.git
git push -u origin main`}
          </pre>
          <button
            onClick={() =>
              copyToClipboard(
                `git init\ngit add .\ngit commit -m "feat: Asistente SophIA AI"\ngit branch -M main\ngit remote add origin https://github.com/tu-usuario/sophia-ai-assistant.git\ngit push -u origin main`,
                1
              )
            }
            className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedIndex === 1 ? '¡Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      {/* Step 2: Cloud Run Deploy Command */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            Paso 2: Desplegar en Google Cloud Run (CLI)
          </h3>
          <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-800 font-mono">
            gcloud run deploy
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Despliega SophIA directamente a un contenedor autosustentable en Google Cloud Run:
        </p>

        <div className="relative bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto">
          <pre className="whitespace-pre-wrap">{cloudRunDeployCmd}</pre>
          <button
            onClick={() => copyToClipboard(cloudRunDeployCmd, 2)}
            className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedIndex === 2 ? '¡Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      {/* Step 3: Dockerfile Code */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            Paso 3: Dockerfile para Cloud Run (`/Dockerfile`)
          </h3>
          <button
            onClick={() => copyToClipboard(dockerfileCode, 3)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedIndex === 3 ? '¡Copiado!' : 'Copiar Dockerfile'}</span>
          </button>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
          <pre>{dockerfileCode}</pre>
        </div>
      </div>

      {/* Step 4: GitHub Actions Workflow */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-purple-400" />
            Paso 4: CI/CD Automático (.github/workflows/deploy.yml)
          </h3>
          <button
            onClick={() => copyToClipboard(githubActionsCode, 4)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedIndex === 4 ? '¡Copiado!' : 'Copiar Workflow'}</span>
          </button>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-purple-300 overflow-x-auto max-h-48 overflow-y-auto">
          <pre>{githubActionsCode}</pre>
        </div>
      </div>
    </div>
  );
};
