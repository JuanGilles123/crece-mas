// ============================================
// SCRIPT DE MIGRACIÓN DE ARCHIVOS EN STORAGE
// ============================================
// Copia archivos de productos/{user_id}/ a productos/{organization_id}/
// Requiere: Service Role Key de Supabase
// Ejecutar: node migrate-storage-images.js
// ============================================

const { createClient } = require('@supabase/supabase-js');

// ⚠️ CONFIGURACIÓN - Cambiar estos valores
const SUPABASE_URL = 'TU_SUPABASE_URL'; // Ejemplo: https://xyzcompany.supabase.co
const SUPABASE_SERVICE_ROLE_KEY = 'TU_SERVICE_ROLE_KEY'; // ⚠️ Usar Service Role Key, NO anon key

// Cliente con permisos de administrador
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const BUCKET_NAME = 'productos';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función principal de migración
async function migrarArchivos() {
  log('\n============================================', 'cyan');
  log('🚀 INICIANDO MIGRACIÓN DE ARCHIVOS', 'cyan');
  log('============================================\n', 'cyan');

  try {
    // 1. Obtener todos los productos con imágenes
    log('📋 Obteniendo lista de productos...', 'cyan');
    const { data: productos, error: productsError } = await supabase
      .from('productos')
      .select('id, nombre, imagen, user_id, organization_id')
      .not('imagen', 'is', null)
      .neq('imagen', '');

    if (productsError) {
      log(`❌ Error al obtener productos: ${productsError.message}`, 'red');
      throw productsError;
    }

    log(`✅ Encontrados ${productos.length} productos con imágenes\n`, 'green');

    let exitosos = 0;
    let omitidos = 0;
    let errores = 0;

    // 2. Procesar cada producto
    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];
      const progreso = `[${i + 1}/${productos.length}]`;
      
      log(`${progreso} Procesando: ${producto.nombre}`, 'blue');

      // Extraer el filename de la ruta actual
      const filename = producto.imagen.split('/').slice(1).join('/');
      const rutaOrigen = `${producto.user_id}/${filename}`;
      const rutaDestino = `${producto.organization_id}/${filename}`;

      // Si la ruta ya es correcta, omitir
      if (producto.imagen.startsWith(producto.organization_id)) {
        log(`   ℹ️  Ya tiene ruta correcta, omitiendo\n`, 'yellow');
        omitidos++;
        continue;
      }

      log(`   Origen: ${rutaOrigen}`, 'blue');
      log(`   Destino: ${rutaDestino}`, 'blue');

      try {
        // 3. Descargar archivo de origen
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(BUCKET_NAME)
          .download(rutaOrigen);

        if (downloadError) {
          log(`   ❌ Error descarga: ${downloadError.message}\n`, 'red');
          errores++;
          continue;
        }

        // 4. Subir a destino
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(rutaDestino, fileData, {
            contentType: fileData.type,
            upsert: true // Sobrescribe si existe
          });

        if (uploadError) {
          log(`   ❌ Error subida: ${uploadError.message}\n`, 'red');
          errores++;
          continue;
        }

        log(`   ✅ Archivo copiado exitosamente\n`, 'green');
        exitosos++;

      } catch (err) {
        log(`   ❌ Error: ${err.message}\n`, 'red');
        errores++;
      }

      // Pequeña pausa para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 5. Resumen final
    log('\n============================================', 'cyan');
    log('📊 RESUMEN DE MIGRACIÓN', 'cyan');
    log('============================================\n', 'cyan');
    log(`Total productos:    ${productos.length}`, 'blue');
    log(`✅ Exitosos:        ${exitosos}`, 'green');
    log(`⚠️  Omitidos:        ${omitidos}`, 'yellow');
    log(`❌ Errores:         ${errores}`, 'red');
    log('\n============================================\n', 'cyan');

    if (exitosos === productos.length) {
      log('🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!', 'green');
    } else if (exitosos > 0) {
      log('⚠️  Migración completada con advertencias', 'yellow');
    } else {
      log('❌ La migración tuvo problemas', 'red');
    }

    log('\n📋 SIGUIENTE PASO:', 'cyan');
    log('1. Las rutas en BD ya están actualizadas', 'blue');
    log('2. Los archivos ya están copiados', 'blue');
    log('3. Verificar imágenes en la aplicación', 'blue');
    log('4. Si funciona, eliminar archivos antiguos\n', 'blue');

  } catch (error) {
    log(`\n❌ ERROR FATAL: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Validar configuración
function validarConfiguracion() {
  log('\n🔍 Validando configuración...', 'cyan');

  if (SUPABASE_URL === 'TU_SUPABASE_URL') {
    log('❌ ERROR: Debes configurar SUPABASE_URL', 'red');
    log('   Edita el archivo y reemplaza TU_SUPABASE_URL', 'yellow');
    log('   Lo encuentras en: Supabase Dashboard > Settings > API\n', 'yellow');
    process.exit(1);
  }

  if (SUPABASE_SERVICE_ROLE_KEY === 'TU_SERVICE_ROLE_KEY') {
    log('❌ ERROR: Debes configurar SUPABASE_SERVICE_ROLE_KEY', 'red');
    log('   ⚠️  Usa Service Role Key, NO anon key', 'yellow');
    log('   La encuentras en: Supabase Dashboard > Settings > API', 'yellow');
    log('   Sección: "Project API keys" > "service_role"\n', 'yellow');
    process.exit(1);
  }

  log('✅ Configuración válida\n', 'green');
}

// Ejecutar
validarConfiguracion();
migrarArchivos();
