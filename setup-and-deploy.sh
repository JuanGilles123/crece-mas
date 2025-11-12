#!/bin/bash
# Script completo para configurar y desplegar Edge Functions

set -e  # Salir si hay errores

echo "🚀 Configuración y Despliegue de Edge Functions"
echo "================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI no está instalado${NC}"
    echo "   Instala con: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI instalado${NC}"
echo ""

# Verificar login
echo "🔐 Verificando autenticación..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás logueado en Supabase${NC}"
    echo ""
    echo "Por favor ejecuta:"
    echo "  supabase login"
    echo ""
    echo "Luego vuelve a ejecutar este script."
    exit 1
fi

echo -e "${GREEN}✅ Autenticado en Supabase${NC}"
echo ""

# Linkear proyecto
echo "📎 Linkeando proyecto..."
if supabase link --project-ref ywilkhfkuwhsjvojocso 2>&1 | grep -q "already linked\|Linked"; then
    echo -e "${GREEN}✅ Proyecto ya está linkeado${NC}"
else
    echo -e "${GREEN}✅ Proyecto linkeado${NC}"
fi
echo ""

# Desplegar funciones
echo "📦 Desplegando Edge Functions..."
echo ""

echo "1️⃣  Desplegando create-checkout..."
if supabase functions deploy create-checkout --no-verify-jwt 2>&1; then
    echo -e "${GREEN}✅ create-checkout desplegado${NC}"
else
    echo -e "${RED}❌ Error desplegando create-checkout${NC}"
    exit 1
fi
echo ""

echo "2️⃣  Desplegando wompi-webhook..."
if supabase functions deploy wompi-webhook --no-verify-jwt 2>&1; then
    echo -e "${GREEN}✅ wompi-webhook desplegado${NC}"
else
    echo -e "${RED}❌ Error desplegando wompi-webhook${NC}"
    exit 1
fi
echo ""

echo "================================================"
echo -e "${GREEN}✅ Despliegue completado exitosamente!${NC}"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Verifica las funciones en:"
echo "   https://supabase.com/dashboard/project/ywilkhfkuwhsjvojocso/functions"
echo ""
echo "2. Configura variables de entorno (si no están configuradas):"
echo "   Supabase Dashboard → Edge Functions → Secrets"
echo ""
echo "3. Configura webhook en Wompi:"
echo "   URL: https://ywilkhfkuwhsjvojocso.supabase.co/functions/v1/wompi-webhook"
echo "   Evento: transaction.updated"
echo ""
echo "4. Prueba el flujo completo en /pricing"

