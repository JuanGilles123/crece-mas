# Script PowerShell para limpiar archivos innecesarios antes de deploy a producción

Write-Host "🧹 Limpiando archivos innecesarios para producción..." -ForegroundColor Cyan

# Archivos de desarrollo local (no necesarios en producción)
Write-Host "📝 Eliminando scripts de desarrollo local..." -ForegroundColor Yellow
Remove-Item -Path "start-dev-network.ps1" -ErrorAction SilentlyContinue
Remove-Item -Path "start-dev-network.sh" -ErrorAction SilentlyContinue
Remove-Item -Path "start-dev.sh" -ErrorAction SilentlyContinue
Remove-Item -Path "diagnostico-red.ps1" -ErrorAction SilentlyContinue
Remove-Item -Path "permitir-firewall.ps1" -ErrorAction SilentlyContinue

# Documentación de desarrollo local
Write-Host "📚 Eliminando documentación de desarrollo local..." -ForegroundColor Yellow
Remove-Item -Path "ACCESO_DESDE_CELULAR.md" -ErrorAction SilentlyContinue
Remove-Item -Path "SOLUCION_TABLET_NO_CARGA.md" -ErrorAction SilentlyContinue
Remove-Item -Path "CHECKLIST_PRUEBAS_LOCAL.md" -ErrorAction SilentlyContinue
Remove-Item -Path "LOCAL_TESTING_QUICKSTART.md" -ErrorAction SilentlyContinue

# Archivos temporales
Write-Host "🗑️ Eliminando archivos temporales..." -ForegroundColor Yellow
Remove-Item -Path "COPIA_AQUI_POLITICA_*.txt" -ErrorAction SilentlyContinue
Remove-Item -Path "ConfiguracionFacturacion.css.backup" -ErrorAction SilentlyContinue

# Scripts de migración ya ejecutados
Write-Host "🔄 Eliminando scripts de migración ya ejecutados..." -ForegroundColor Yellow
Remove-Item -Path "migrate-storage-images.js" -ErrorAction SilentlyContinue
Remove-Item -Path "remove-console-logs.js" -ErrorAction SilentlyContinue

# SQL files de una sola vez
Write-Host "🗄️ Eliminando archivos SQL de referencia..." -ForegroundColor Yellow
Remove-Item -Path "UPDATE_SCHEMA_SERVICES_V2.sql" -ErrorAction SilentlyContinue
Remove-Item -Path "INSPECT_SCHEMA.sql" -ErrorAction SilentlyContinue
Remove-Item -Path "SQL_PURO_POLITICAS.txt" -ErrorAction SilentlyContinue
Remove-Item -Path "EXPRESIONES_SQL_POLITICAS.txt" -ErrorAction SilentlyContinue

# Limpiar build anterior
Write-Host "🏗️ Limpiando build anterior..." -ForegroundColor Yellow
Remove-Item -Path "build" -Recurse -ErrorAction SilentlyContinue

Write-Host "✅ Limpieza completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Archivos que se mantienen:" -ForegroundColor Cyan
Write-Host "  - src/ (código fuente)"
Write-Host "  - public/ (assets públicos)"
Write-Host "  - package.json (dependencias)"
Write-Host "  - vercel.json / netlify.toml (configuración deployment)"
Write-Host "  - docs/ (documentación del proyecto)"
Write-Host "  - scripts/ (scripts útiles como generar-plantilla-excel.js)"
Write-Host "  - README.md (documentación principal)"
Write-Host "  - env.example (template de variables)"
