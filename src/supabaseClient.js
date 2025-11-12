// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import { customFetch, detectCorporateProxy, getDevelopmentConfig } from './utils/customFetch';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const isDevelopment = process.env.NODE_ENV === 'development';

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Variables de entorno de Supabase no configuradas');
  console.error('   REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  console.error('   Crea un archivo .env en la raíz del proyecto con:');
  console.error('   REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('   REACT_APP_SUPABASE_ANON_KEY=tu-anon-key');
}

// Configuración del cliente Supabase con opciones mejoradas para trabajar con proxies
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'crece-mas-web',
      // Headers adicionales para proxies corporativos
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
    // Usar fetch personalizado si está disponible
    fetch: customFetch,
  },
  // Opciones adicionales para manejar errores de red
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  // Configuración de desarrollo
  ...getDevelopmentConfig(),
});

// Verificar conexión al inicializar
if (supabaseUrl && supabaseAnonKey) {
  console.log('🔗 Supabase client inicializado');
  console.log('   URL:', supabaseUrl);
  
  // Verificar que la URL sea HTTPS
  if (!supabaseUrl.startsWith('https://')) {
    console.warn('⚠️ ADVERTENCIA: La URL de Supabase debe usar HTTPS');
  }

  // En desarrollo, detectar proxy corporativo
  if (isDevelopment) {
    detectCorporateProxy().then(hasProxy => {
      if (hasProxy) {
        console.warn('⚠️ ADVERTENCIA: Detectado posible proxy corporativo');
        console.warn('   Esto puede causar errores SSL');
        console.warn('   Soluciones:');
        console.warn('   1. Usar red personal (no corporativa)');
        console.warn('   2. Contactar administrador de TI para certificado raíz');
        console.warn('   3. Ver: docs/SOLUCION_PROXY_CISCO_UMBRELLA.md');
      }
    }).catch(() => {
      // Ignorar errores en la detección
    });
  }
}

// Nota: El interceptor global se maneja en customFetch.js
// para evitar conflictos y recursión