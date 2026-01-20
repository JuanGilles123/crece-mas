#!/bin/bash
# Script para limpiar archivos innecesarios antes de deploy a producción

echo "🧹 Limpiando archivos innecesarios para producción..."

# Archivos de desarrollo local (no necesarios en producción)
echo "📝 Eliminando scripts de desarrollo local..."
rm -f start-dev-network.ps1
rm -f start-dev-network.sh
rm -f start-dev.sh
rm -f diagnostico-red.ps1
rm -f permitir-firewall.ps1

# Documentación de desarrollo local
echo "📚 Eliminando documentación de desarrollo local..."
rm -f ACCESO_DESDE_CELULAR.md
rm -f SOLUCION_TABLET_NO_CARGA.md
rm -f CHECKLIST_PRUEBAS_LOCAL.md
rm -f LOCAL_TESTING_QUICKSTART.md

# Archivos temporales
echo "🗑️ Eliminando archivos temporales..."
rm -f COPIA_AQUI_POLITICA_*.txt
rm -f ConfiguracionFacturacion.css.backup

# Scripts de migración ya ejecutados
echo "🔄 Eliminando scripts de migración ya ejecutados..."
rm -f migrate-storage-images.js
rm -f remove-console-logs.js

# SQL files de una sola vez
echo "🗄️ Eliminando archivos SQL de referencia..."
rm -f UPDATE_SCHEMA_SERVICES_V2.sql
rm -f INSPECT_SCHEMA.sql
rm -f SQL_PURO_POLITICAS.txt
rm -f EXPRESIONES_SQL_POLITICAS.txt

# Limpiar build anterior
echo "🏗️ Limpiando build anterior..."
rm -rf build/

# Limpiar node_modules (se reinstalarán en CI/CD)
# echo "📦 Limpiando node_modules..."
# rm -rf node_modules/

echo "✅ Limpieza completada!"
echo ""
echo "📋 Archivos que se mantienen:"
echo "  - src/ (código fuente)"
echo "  - public/ (assets públicos)"
echo "  - package.json (dependencias)"
echo "  - vercel.json / netlify.toml (configuración deployment)"
echo "  - docs/ (documentación del proyecto)"
echo "  - scripts/ (scripts útiles como generar-plantilla-excel.js)"
echo "  - README.md (documentación principal)"
echo "  - env.example (template de variables)"
