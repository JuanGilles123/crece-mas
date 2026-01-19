#!/bin/bash
# Script para configurar credenciales de producción de Wompi

echo "🚀 Configurando Wompi para Producción"
echo "======================================"
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
    echo ""
    echo "Por favor ejecuta primero:"
    echo "  supabase login"
    echo ""
    echo "Luego vuelve a ejecutar este script:"
    echo "  ./configurar-produccion.sh"
    exit 1
fi

echo "✅ Autenticado en Supabase"
echo ""

# Credenciales de producción
WOMPI_PUBLIC_KEY="pub_prod_ZiFNjvA83CFk8VouM9s7OAyso4JZ8D8f"
WOMPI_PRIVATE_KEY="prv_prod_cPqNwcQXF7GibILRWosXK2BoqUJTkqPX"
WOMPI_EVENTS_SECRET="prod_events_cuMZ65u4M7x3fm2zMKzNTYUKjebf95Ee"
WOMPI_INTEGRITY_SECRET="prod_integrity_BMOlK0oKdX5RVqYUuAp9UCzSJKL5KJaN"

# Pedir URL de redirección
echo "📝 Configuración de URL de Redirección"
echo ""
echo "¿Cuál es tu dominio de producción?"
echo "  Ejemplo: https://tudominio.com"
echo "  O deja vacío para usar localhost (desarrollo)"
echo ""
read -p "Dominio: " PROD_URL

if [ -z "$PROD_URL" ]; then
    echo "⚠️  Usando localhost para desarrollo"
    WOMPI_REDIRECT_URL="http://localhost:3000/subscription/callback"
else
    # Asegurar que tenga https://
    if [[ ! "$PROD_URL" =~ ^https?:// ]]; then
        PROD_URL="https://$PROD_URL"
    fi
    WOMPI_REDIRECT_URL="${PROD_URL}/subscription/callback"
fi

echo ""
echo "🔐 Configurando variables de entorno de producción..."
echo ""

# Configurar secrets
echo "1️⃣  Configurando WOMPI_PUBLIC_KEY..."
if supabase secrets set WOMPI_PUBLIC_KEY="$WOMPI_PUBLIC_KEY" 2>&1; then
    echo "   ✅ WOMPI_PUBLIC_KEY configurado"
else
    echo "   ❌ Error configurando WOMPI_PUBLIC_KEY"
    exit 1
fi

echo ""
echo "2️⃣  Configurando WOMPI_PRIVATE_KEY..."
if supabase secrets set WOMPI_PRIVATE_KEY="$WOMPI_PRIVATE_KEY" 2>&1; then
    echo "   ✅ WOMPI_PRIVATE_KEY configurado"
else
    echo "   ❌ Error configurando WOMPI_PRIVATE_KEY"
    exit 1
fi

echo ""
echo "3️⃣  Configurando WOMPI_INTEGRITY_SECRET..."
if supabase secrets set WOMPI_INTEGRITY_SECRET="$WOMPI_INTEGRITY_SECRET" 2>&1; then
    echo "   ✅ WOMPI_INTEGRITY_SECRET configurado"
else
    echo "   ❌ Error configurando WOMPI_INTEGRITY_SECRET"
    exit 1
fi

echo ""
echo "4️⃣  Configurando WOMPI_EVENTS_SECRET..."
if supabase secrets set WOMPI_EVENTS_SECRET="$WOMPI_EVENTS_SECRET" 2>&1; then
    echo "   ✅ WOMPI_EVENTS_SECRET configurado"
else
    echo "   ❌ Error configurando WOMPI_EVENTS_SECRET"
    exit 1
fi

echo ""
echo "5️⃣  Configurando WOMPI_REDIRECT_URL..."
if supabase secrets set WOMPI_REDIRECT_URL="$WOMPI_REDIRECT_URL" 2>&1; then
    echo "   ✅ WOMPI_REDIRECT_URL configurado: $WOMPI_REDIRECT_URL"
else
    echo "   ❌ Error configurando WOMPI_REDIRECT_URL"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ ¡Todas las variables configuradas!"
echo ""
echo "📋 Credenciales configuradas:"
echo "   ✅ WOMPI_PUBLIC_KEY (producción)"
echo "   ✅ WOMPI_PRIVATE_KEY (producción)"
echo "   ✅ WOMPI_INTEGRITY_SECRET (producción)"
echo "   ✅ WOMPI_EVENTS_SECRET (producción)"
echo "   ✅ WOMPI_REDIRECT_URL: $WOMPI_REDIRECT_URL"
echo ""
echo "📋 Próximos pasos en Wompi Dashboard:"
echo ""
echo "1. Ve a: https://comercios.wompi.co"
echo ""
echo "2. Configura el Webhook:"
echo "   URL: https://ywilkhfkuwhsjvojocso.supabase.co/functions/v1/wompi-webhook"
echo "   Evento: transaction.updated"
echo ""
echo "3. Configura URLs de Redirección Permitidas:"
echo "   - $WOMPI_REDIRECT_URL"
echo "   - ${WOMPI_REDIRECT_URL/callback/success}"
echo ""
echo "4. Verifica que los Tokens de Aceptación estén activos"
echo ""
echo "5. Prueba el flujo completo con un pago real"
echo ""
echo "📖 Para más detalles: docs/CAMBIAR_A_PRODUCCION.md"

