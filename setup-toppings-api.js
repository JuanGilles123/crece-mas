#!/usr/bin/env node

/**
 * 🍔 Script para crear la tabla de toppings usando la API REST de Supabase
 * 
 * Uso:
 *   node setup-toppings-api.js
 * 
 * Requiere variables de entorno:
 *   - SUPABASE_URL (o REACT_APP_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY (clave de servicio, no anon key)
 */

const fs = require('fs');
const path = require('path');

// Leer variables de entorno
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('');
  console.error('Necesitas configurar:');
  console.error('  - SUPABASE_URL o REACT_APP_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY (clave de servicio, no anon key)');
  console.error('');
  console.error('Ejemplo:');
  console.error('  export SUPABASE_URL="https://tu-proyecto.supabase.co"');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"');
  console.error('  node setup-toppings-api.js');
  process.exit(1);
}

// Leer el archivo SQL
const sqlFile = path.join(__dirname, 'docs', 'CREATE_TOPPINGS_TABLE.sql');
if (!fs.existsSync(sqlFile)) {
  console.error(`❌ Error: No se encontró el archivo ${sqlFile}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, 'utf8');

// Función para ejecutar SQL usando la API REST de Supabase
async function executeSQL() {
  console.log('🍔 Ejecutando migración de toppings...');
  console.log('');

  try {
    // La API REST de Supabase no tiene un endpoint directo para ejecutar SQL arbitrario
    // Necesitamos usar el endpoint de rpc o ejecutar directamente
    
    // Opción 1: Usar fetch con el endpoint de PostgREST (solo para queries simples)
    // Opción 2: Usar Supabase CLI (recomendado)
    // Opción 3: Usar psql directamente si tienes acceso
    
    console.log('⚠️  La API REST de Supabase no permite ejecutar SQL arbitrario directamente.');
  console.log('');
  console.log('📋 Opciones recomendadas:');
  console.log('');
  console.log('1. Usar Supabase CLI (recomendado):');
  console.log('   npm install -g supabase');
  console.log('   supabase link --project-ref tu-project-ref');
  console.log('   supabase db execute -f docs/CREATE_TOPPINGS_TABLE.sql');
  console.log('');
  console.log('2. Ejecutar manualmente en Supabase Dashboard:');
  console.log('   - Ve a https://supabase.com/dashboard');
  console.log('   - Selecciona tu proyecto');
  console.log('   - Abre SQL Editor');
  console.log('   - Copia y pega el contenido de docs/CREATE_TOPPINGS_TABLE.sql');
  console.log('');
  console.log('3. Usar psql directamente (si tienes acceso):');
  console.log('   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" -f docs/CREATE_TOPPINGS_TABLE.sql');
  console.log('');
  
  // Mostrar el SQL para que lo copien
  console.log('📄 Contenido del SQL a ejecutar:');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

executeSQL();

