#!/usr/bin/env node

/**
 * Script para migrar gradualmente a los componentes optimizados
 * Este script ayuda a reemplazar los componentes antiguos con las versiones optimizadas
 */

const fs = require('fs');
const path = require('path');

const MIGRATION_MAP = {
  // Componentes principales
  'src/pages/dashboard/Caja.js': 'src/pages/dashboard/CajaOptimizada.js',
  'src/pages/dashboard/Inventario.js': 'src/pages/dashboard/InventarioOptimizado.js',
  
  // Hooks
  'src/hooks/useProductos.js': 'src/hooks/useProductosPaginados.js',
  
  // Componentes UI
  'src/components/ui/InfiniteScroll.js': 'src/components/ui/InfiniteScroll.js',
  'src/components/ui/Pagination.js': 'src/components/ui/Pagination.js',
  'src/components/ui/SearchInput.js': 'src/components/ui/SearchInput.js'
};

const BACKUP_DIR = 'backup-before-optimization';

function createBackup() {
  console.log('📦 Creando backup de archivos originales...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  Object.keys(MIGRATION_MAP).forEach(originalPath => {
    if (fs.existsSync(originalPath)) {
      const backupPath = path.join(BACKUP_DIR, originalPath);
      const backupDir = path.dirname(backupPath);
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      fs.copyFileSync(originalPath, backupPath);
      console.log(`✅ Backup creado: ${backupPath}`);
    }
  });
}

function updateImports(filePath, oldImport, newImport) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Reemplazar imports
  content = content.replace(
    new RegExp(`from ['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
    `from '${newImport}'`
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`🔄 Actualizado: ${filePath}`);
  }
}

function migrateFiles() {
  console.log('🚀 Iniciando migración a componentes optimizados...');
  
  // Crear backup primero
  createBackup();
  
  // Actualizar imports en App.js
  updateImports(
    'src/App.js',
    './pages/dashboard/Caja',
    './pages/dashboard/CajaOptimizada'
  );
  
  updateImports(
    'src/App.js',
    './pages/dashboard/Inventario',
    './pages/dashboard/InventarioOptimizado'
  );
  
  // Actualizar imports en Dashboard.js
  updateImports(
    'src/pages/dashboard/Dashboard.js',
    './Caja',
    './CajaOptimizada'
  );
  
  updateImports(
    'src/pages/dashboard/Dashboard.js',
    './Inventario',
    './InventarioOptimizado'
  );
  
  console.log('✅ Migración completada!');
  console.log('');
  console.log('📋 Próximos pasos:');
  console.log('1. Ejecutar npm start para probar la aplicación');
  console.log('2. Verificar que la búsqueda y paginación funcionan correctamente');
  console.log('3. Si todo funciona bien, puedes eliminar los archivos de backup');
  console.log('4. Si hay problemas, puedes restaurar desde backup/');
}

function rollback() {
  console.log('🔄 Revirtiendo cambios...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ No se encontró directorio de backup');
    return;
  }
  
  // Restaurar archivos desde backup
  function restoreFromBackup(backupPath, originalPath) {
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, originalPath);
      console.log(`✅ Restaurado: ${originalPath}`);
    }
  }
  
  // Restaurar archivos principales
  Object.keys(MIGRATION_MAP).forEach(originalPath => {
    const backupPath = path.join(BACKUP_DIR, originalPath);
    restoreFromBackup(backupPath, originalPath);
  });
  
  // Restaurar imports en App.js
  updateImports(
    'src/App.js',
    './pages/dashboard/CajaOptimizada',
    './pages/dashboard/Caja'
  );
  
  updateImports(
    'src/App.js',
    './pages/dashboard/InventarioOptimizado',
    './pages/dashboard/Inventario'
  );
  
  // Restaurar imports en Dashboard.js
  updateImports(
    'src/pages/dashboard/Dashboard.js',
    './CajaOptimizada',
    './Caja'
  );
  
  updateImports(
    'src/pages/dashboard/Dashboard.js',
    './InventarioOptimizado',
    './Inventario'
  );
  
  console.log('✅ Rollback completado!');
}

// Ejecutar script
const command = process.argv[2];

switch (command) {
  case 'migrate':
    migrateFiles();
    break;
  case 'rollback':
    rollback();
    break;
  default:
    console.log('🔧 Script de migración a componentes optimizados');
    console.log('');
    console.log('Uso:');
    console.log('  node scripts/migrate-to-optimized.js migrate   - Migrar a componentes optimizados');
    console.log('  node scripts/migrate-to-optimized.js rollback  - Revertir cambios');
    console.log('');
    console.log('Este script:');
    console.log('- Crea backup de archivos originales');
    console.log('- Actualiza imports para usar componentes optimizados');
    console.log('- Permite rollback si hay problemas');
    break;
}
