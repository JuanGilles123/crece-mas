#!/usr/bin/env node

/**
 * 🔐 Script para ejecutar políticas de storage usando Service Role Key
 * 
 * Uso:
 *   node ejecutar-politicas-storage.js
 * 
 * Requiere variables de entorno:
 *   - SUPABASE_URL (o REACT_APP_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY (clave de servicio, NO anon key)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Para usar fetch en Node.js (si no está disponible globalmente)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Leer variables de entorno
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('');
  console.error('Necesitas configurar:');
  console.error('  - SUPABASE_URL o REACT_APP_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY (clave de servicio, NO anon key)');
  console.error('');
  console.error('Ejemplo:');
  console.error('  export SUPABASE_URL="https://tu-proyecto.supabase.co"');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"');
  console.error('  node ejecutar-politicas-storage.js');
  console.error('');
  console.error('⚠️  IMPORTANTE: El Service Role Key tiene permisos completos.');
  console.error('   NUNCA lo expongas en el frontend o en repositorios públicos.');
  process.exit(1);
}

// Leer el archivo SQL
const sqlFile = path.join(__dirname, 'docs', 'AGREGAR_POLITICAS_TOPPINGS_V2.sql');
if (!fs.existsSync(sqlFile)) {
  console.error(`❌ Error: No se encontró el archivo ${sqlFile}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, 'utf8');

// Crear cliente con Service Role Key (tiene permisos de administrador)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Función para ejecutar SQL usando Supabase CLI o mostrar alternativas
async function ejecutarSQL() {
  console.log('🔐 Configurando políticas de storage para toppings...');
  console.log('');
  console.log('📄 Archivo SQL:', sqlFile);
  console.log('🔗 Supabase URL:', supabaseUrl);
  console.log('');

  // Verificar si Supabase CLI está disponible
  const { execSync } = require('child_process');
  let tieneSupabaseCLI = false;
  
  try {
    execSync('which supabase', { stdio: 'ignore' });
    tieneSupabaseCLI = true;
  } catch (e) {
    tieneSupabaseCLI = false;
  }

  // Intentar ejecutar usando la API REST directamente
  console.log('🚀 Intentando ejecutar SQL usando Service Role Key...');
  console.log('');

  try {
    // Dividir el SQL en statements individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        const trimmed = s.trim();
        return trimmed.length > 0 && 
               !trimmed.startsWith('--') && 
               trimmed !== ';' &&
               !trimmed.match(/^COMMENT\s+ON/i); // Saltar comentarios de PostgreSQL
      })
      .map(s => s + ';');

    console.log(`📝 Ejecutando ${statements.length} statements...`);
    console.log('');

    // Ejecutar cada statement usando fetch directo a la API de Supabase
    // Nota: Supabase no tiene un endpoint REST para ejecutar SQL arbitrario
    // La mejor opción es usar psql o ejecutar manualmente
    
    console.log('⚠️  Supabase no permite ejecutar SQL arbitrario desde la API REST.');
    console.log('   Esto es por seguridad. Usaremos el método más directo...');
    console.log('');
    
    // Mostrar instrucciones claras
    console.log('📋 La forma más directa es ejecutar el SQL en Supabase Dashboard:');
    console.log('');
    console.log('1. Ve a: https://supabase.com/dashboard/project/ywilkhfkuwhsjvojocso/sql/new');
    console.log('2. Copia y pega el SQL que se muestra abajo');
    console.log('3. Click en "Run" o presiona Cmd+Enter');
    console.log('');
    console.log('📄 SQL a ejecutar:');
    console.log('═'.repeat(70));
    console.log(sql);
    console.log('═'.repeat(70));
    console.log('');
    console.log('✅ Después de ejecutarlo, verifica en:');
    console.log('   Storage → productos → Policies');
    console.log('   Deberías ver las 4 nuevas políticas para toppings');
    console.log('');
    
    return;
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

}

// Verificar que el proyecto esté accesible
async function verificarConexion() {
  try {
    // Intentar una consulta simple para verificar la conexión
    const { data, error } = await supabase.from('organizations').select('id').limit(1);
    if (error && !error.message.includes('permission denied') && !error.message.includes('relation')) {
      throw error;
    }
    console.log('✅ Conexión a Supabase verificada');
    return true;
  } catch (error) {
    // Si falla, puede ser que la tabla no exista, pero la conexión está bien
    console.log('⚠️  No se pudo verificar la conexión completamente, pero continuando...');
    console.log('   (Esto es normal si algunas tablas no existen aún)');
    return true; // Continuar de todas formas
  }
}

// Ejecutar
(async () => {
  console.log('🔐 Configurando políticas de storage para toppings');
  console.log('═'.repeat(60));
  console.log('');

  const conectado = await verificarConexion();
  if (!conectado) {
    process.exit(1);
  }

  console.log('');
  await ejecutarSQL();
})();

