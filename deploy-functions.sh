#!/bin/bash
# Script para desplegar Edge Functions a Supabase

echo "🚀 Desplegando Edge Functions a Supabase..."
echo ""

# Verificar que Supabase CLI esté instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado"
    echo "   Instala con: npm install -g supabase"
    exit 1
fi

# Verificar si está logueado
if ! supabase projects list &> /dev/null; then
    echo "⚠️  No estás logueado en Supabase"
    echo "   Ejecuta: supabase login"
    exit 1
fi

# Linkear proyecto si no está linkeado
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "📎 Linkeando proyecto a Supabase..."
    supabase link --project-ref ywilkhfkuwhsjvojocso
fi

echo ""
echo "📦 Desplegando create-checkout..."
supabase functions deploy create-checkout --no-verify-jwt

echo ""
echo "📦 Desplegando wompi-webhook..."
supabase functions deploy wompi-webhook --no-verify-jwt

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Verifica las funciones en: https://supabase.com/dashboard/project/ywilkhfkuwhsjvojocso/functions"
echo "   2. Configura el webhook en Wompi:"
echo "      URL: https://ywilkhfkuwhsjvojocso.supabase.co/functions/v1/wompi-webhook"
echo "      Evento: transaction.updated"
echo "   3. Verifica las variables de entorno en Supabase Dashboard → Edge Functions → Secrets"

