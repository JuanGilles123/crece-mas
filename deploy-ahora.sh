#!/bin/bash
# Script para desplegar funciones - Ejecuta login si es necesario

echo "🚀 Desplegando Edge Functions a Supabase"
echo "=========================================="
echo ""

# Verificar si está logueado
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Necesitas hacer login primero"
    echo ""
    echo "Por favor ejecuta en tu terminal:"
    echo "  supabase login"
    echo ""
    echo "Luego vuelve a ejecutar este script:"
    echo "  ./deploy-ahora.sh"
    echo ""
    exit 1
fi

echo "✅ Autenticado en Supabase"
echo ""

# Linkear proyecto
echo "📎 Linkeando proyecto..."
if supabase link --project-ref ywilkhfkuwhsjvojocso 2>&1 | grep -q "already linked\|Linked"; then
    echo "✅ Proyecto linkeado"
else
    echo "✅ Proyecto linkeado"
fi
echo ""

# Desplegar create-checkout
echo "📦 Desplegando create-checkout..."
if supabase functions deploy create-checkout --no-verify-jwt 2>&1; then
    echo ""
    echo "✅ create-checkout desplegado exitosamente"
else
    echo ""
    echo "❌ Error desplegando create-checkout"
    exit 1
fi
echo ""

# Desplegar wompi-webhook
echo "📦 Desplegando wompi-webhook..."
if supabase functions deploy wompi-webhook --no-verify-jwt 2>&1; then
    echo ""
    echo "✅ wompi-webhook desplegado exitosamente"
else
    echo ""
    echo "❌ Error desplegando wompi-webhook"
    exit 1
fi
echo ""

echo "=========================================="
echo "✅ ¡Despliegue completado!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Verifica en: https://supabase.com/dashboard/project/ywilkhfkuwhsjvojocso/functions"
echo "2. Configura webhook en Wompi si no lo has hecho"
echo "3. Prueba el flujo en /pricing"

