#!/bin/bash

# 🍔 Script para crear la tabla de toppings en Supabase
# Este script ejecuta el SQL usando Supabase CLI

set -e

echo "🍔 Configurando tabla de toppings en Supabase..."
echo ""

SQL_FILE="docs/CREATE_TOPPINGS_TABLE.sql"

# Verificar que el archivo SQL existe
if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Error: No se encontró el archivo $SQL_FILE"
  exit 1
fi

# Verificar si Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
  echo "⚠️  Supabase CLI no está instalado"
  echo ""
  echo "📋 Opciones para ejecutar el SQL:"
  echo ""
  echo "1. Instalar Supabase CLI (recomendado):"
  echo "   npm install -g supabase"
  echo "   # Luego ejecuta: npm run setup-toppings"
  echo ""
  echo "2. Ejecutar manualmente en Supabase Dashboard:"
  echo "   - Ve a https://supabase.com/dashboard"
  echo "   - Selecciona tu proyecto"
  echo "   - Abre SQL Editor"
  echo "   - Copia y pega el contenido de $SQL_FILE"
  echo ""
  echo "3. Usar psql directamente (si tienes acceso a la base de datos):"
  echo "   psql \"postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres\" -f $SQL_FILE"
  echo ""
  exit 1
fi

echo "✅ Supabase CLI detectado"
echo ""

# Verificar si estamos en un proyecto de Supabase vinculado
if [ -f "supabase/config.toml" ]; then
  echo "📦 Proyecto de Supabase detectado"
  echo "🚀 Ejecutando migración..."
  echo ""
  
  # Ejecutar el SQL de la tabla
  if supabase db execute -f "$SQL_FILE"; then
    echo ""
    echo "✅ ¡Tabla de toppings creada exitosamente!"
    echo ""
    
    # Preguntar si quiere ejecutar las políticas de storage
    echo "🔐 ¿Ejecutar políticas de storage para imágenes? (requerido para subir imágenes)"
    echo "   Esto configurará los permisos del bucket 'productos'"
    read -p "   Ejecutar políticas de storage? (s/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
      STORAGE_FILE="docs/SETUP_STORAGE_POLICIES.sql"
      if [ -f "$STORAGE_FILE" ]; then
        echo "🚀 Ejecutando políticas de storage..."
        if supabase db execute -f "$STORAGE_FILE"; then
          echo ""
          echo "✅ ¡Políticas de storage configuradas exitosamente!"
        else
          echo ""
          echo "⚠️  Error al ejecutar políticas de storage"
          echo "   Ejecuta manualmente: docs/SETUP_STORAGE_POLICIES.sql"
        fi
      else
        echo "⚠️  No se encontró $STORAGE_FILE"
      fi
    fi
    
    echo ""
    echo "📝 Verifica en Supabase Dashboard que:"
    echo "   - La tabla 'toppings' existe"
    echo "   - Las políticas RLS de la tabla están configuradas"
    echo "   - Las políticas de storage están configuradas"
    echo "   - El bucket 'productos' existe"
  else
    echo ""
    echo "❌ Error al ejecutar la migración"
    echo ""
    echo "💡 Alternativa: Ejecuta el SQL manualmente en Supabase Dashboard"
    exit 1
  fi
else
  echo "⚠️  No se encontró config.toml de Supabase"
  echo ""
  echo "📋 Para vincular tu proyecto:"
  echo "   1. Ve a https://supabase.com/dashboard"
  echo "   2. Selecciona tu proyecto"
  echo "   3. Ve a Settings > General"
  echo "   4. Copia el 'Reference ID'"
  echo "   5. Ejecuta: supabase link --project-ref [TU_PROJECT_REF]"
  echo ""
  echo "💡 O ejecuta el SQL manualmente en Supabase Dashboard:"
  echo "   - Abre SQL Editor"
  echo "   - Copia y pega el contenido de $SQL_FILE"
  echo ""
  exit 1
fi
