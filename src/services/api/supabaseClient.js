// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Validar variables de entorno críticas
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validación en tiempo de carga
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('REACT_APP_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('REACT_APP_SUPABASE_ANON_KEY');
  
  const errorMessage = `
    ❌ ERROR DE CONFIGURACIÓN:
    
    Las siguientes variables de entorno son requeridas pero no están configuradas:
    ${missingVars.join(', ')}
    
    Por favor, crea un archivo .env.local en la raíz del proyecto con:
    REACT_APP_SUPABASE_URL=tu_url_de_supabase
    REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
    
    Puedes usar env.example como referencia.
  `;
  
  if (process.env.NODE_ENV === 'development') {
    console.error(errorMessage);
    throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
  } else {
    // En producción, lanzar error más genérico
    throw new Error('Error de configuración del sistema. Por favor contacte al soporte.');
  }
}

// Validar formato básico de URL
if (!supabaseUrl.match(/^https?:\/\/.+/)) {
  const errorMessage = 'REACT_APP_SUPABASE_URL debe ser una URL válida (ej: https://xxx.supabase.co)';
  if (process.env.NODE_ENV === 'development') {
    console.error(errorMessage);
    throw new Error(errorMessage);
  } else {
    throw new Error('Error de configuración del sistema.');
  }
}

// Crear cliente de Supabase con validaciones
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});