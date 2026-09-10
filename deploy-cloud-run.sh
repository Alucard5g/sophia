#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Automatizado a Google Cloud Run
# SophIA V.2026 — Google AI Studio Suite
# ==============================================================================

set -euo pipefail

# Colores para consola
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   🚀 Despliegue de SophIA V.2026 en Google Cloud Run   ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Parámetros de configuración
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "")}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-sophia-app}"
REGION="${CLOUD_RUN_REGION:-us-east1}"
PORT=3000

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ Error: No se ha especificado GCP_PROJECT_ID ni hay un proyecto activo configurado en gcloud.${NC}"
  echo -e "${YELLOW}Ejemplo de uso:${NC}"
  echo "  export GCP_PROJECT_ID=tu-proyecto-gcp"
  echo "  ./deploy-cloud-run.sh"
  exit 1
fi

echo -e "${GREEN}✓ Proyecto GCP:${NC} $PROJECT_ID"
echo -e "${GREEN}✓ Servicio Cloud Run:${NC} $SERVICE_NAME"
echo -e "${GREEN}✓ Región:${NC} $REGION"
echo -e "${GREEN}✓ Puerto interno:${NC} $PORT"

# 2. Habilitar APIs necesarias en Google Cloud
echo -e "\n${BLUE}→ Habilitando APIs requeridas (run.googleapis.com, cloudbuild.googleapis.com)...${NC}"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com --project="$PROJECT_ID"

# 3. Compilación y Construcción del Contenedor con Cloud Build
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"
echo -e "\n${BLUE}→ Construyendo imagen en Cloud Build: $IMAGE_NAME ...${NC}"
gcloud builds submit --tag "$IMAGE_NAME" --project="$PROJECT_ID" .

# 4. Despliegue en Google Cloud Run
echo -e "\n${BLUE}→ Desplegando en Google Cloud Run...${NC}"
DEPLOY_OUTPUT=$(gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_NAME" \
  --platform managed \
  --region "$REGION" \
  --port "$PORT" \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --project="$PROJECT_ID" \
  --format="value(status.url)")

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}   ✅ ¡Despliegue completado con éxito!               ${NC}"
echo -e "${GREEN}   🌐 URL del servicio en Cloud Run:                  ${NC}"
echo -e "${YELLOW}   $DEPLOY_OUTPUT${NC}"
echo -e "${GREEN}======================================================${NC}"
