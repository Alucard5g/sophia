#!/usr/bin/env bash
# ==============================================================================
# Script de Sincronización Automática con Repositorio GitHub
# SophIA V.2026 — Google AI Studio Build
# ==============================================================================

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   🐙 Sincronización de SophIA con GitHub            ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Verificar si git está inicializado
if [ ! -d ".git" ]; then
  echo -e "${YELLOW}→ Inicializando repositorio Git local...${NC}"
  git init
  git branch -M main
fi

# 2. Configuración remota si se pasa por argumento o variable de entorno
GITHUB_REPO_URL="${1:-${GITHUB_REPO_URL:-}}"

if [ -n "$GITHUB_REPO_URL" ]; then
  if git remote | grep -q "^origin$"; then
    echo -e "${BLUE}→ Actualizando origen remoto a: $GITHUB_REPO_URL${NC}"
    git remote set-url origin "$GITHUB_REPO_URL"
  else
    echo -e "${BLUE}→ Vinculando repositorio remoto origin: $GITHUB_REPO_URL${NC}"
    git remote add origin "$GITHUB_REPO_URL"
  fi
fi

# 3. Comprobar que haya un remoto configurado
if ! git remote | grep -q "^origin$"; then
  echo -e "${YELLOW}⚠️  Aviso: No se ha configurado un repositorio remoto 'origin'.${NC}"
  echo -e "Puedes configurarlo ejecutando:"
  echo -e "  ./sync-github.sh https://github.com/TU_USUARIO/TU_REPOSITORIO.git"
  echo ""
fi

# 4. Estado de archivos
echo -e "${BLUE}→ Agregando cambios al stage...${NC}"
git add .

COMMIT_MSG="${2:-"feat: sincronización y actualización de SophIA V.2026 para Cloud Run y GitHub"}"

if git diff --staged --quiet; then
  echo -e "${GREEN}✓ No hay cambios pendientes por commitear.${NC}"
else
  echo -e "${BLUE}→ Creando commit: \"$COMMIT_MSG\"...${NC}"
  git commit -m "$COMMIT_MSG"
fi

# 5. Push a GitHub si existe el remoto
if git remote | grep -q "^origin$"; then
  echo -e "${BLUE}→ Empujando cambios a origin/main...${NC}"
  git push -u origin main
  echo -e "${GREEN}✅ ¡Código sincronizado exitosamente con GitHub!${NC}"
else
  echo -e "${GREEN}✓ Commit local creado con éxito. Listo para vincular y sincronizar con tu repo de GitHub.${NC}"
fi
