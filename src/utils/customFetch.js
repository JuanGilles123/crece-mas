/**
 * Custom Fetch para manejar errores SSL y proxies corporativos
 * Este fetch wrapper ayuda a trabajar con redes que interceptan SSL
 */

// Variable para desarrollo (solo en desarrollo local)
const isDevelopment = process.env.NODE_ENV === 'development';

// Guardar el fetch original para evitar recursión
// En navegador: window.fetch, en otros entornos: fetch global
// eslint-disable-next-line no-undef
const originalFetch = typeof window !== 'undefined' && window.fetch 
  ? window.fetch 
  : fetch;

/**
 * Fetch personalizado que maneja mejor los errores SSL
 * y proporciona mensajes más claros
 */
export const customFetch = async (url, options = {}) => {
  // Crear signal para timeout solo si no hay uno ya
  let signal = options.signal;
  let timeoutId;
  let controller;
  
  if (!signal) {
    controller = new AbortController();
    signal = controller.signal;
    // Timeout de 30 segundos
    timeoutId = setTimeout(() => controller.abort(), 30000);
  }

  try {
    // Manejar headers correctamente para no perder los de Supabase
    let headers = options.headers;
    
    // Si headers es un Headers object, convertirlo a objeto plano
    if (headers instanceof Headers) {
      const headersObj = {};
      headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      headers = headersObj;
    }
    
    // Si headers es un objeto, agregar headers adicionales sin sobrescribir
    if (headers && typeof headers === 'object' && !Array.isArray(headers)) {
      headers = {
        ...headers, // Primero los headers originales (incluyendo apikey de Supabase)
        'Cache-Control': headers['Cache-Control'] || 'no-cache',
        'Pragma': headers['Pragma'] || 'no-cache',
      };
    } else {
      // Si no hay headers o es otro tipo, crear nuevos
      headers = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      };
    }

    const response = await originalFetch(url, {
      ...options,
      headers,
      signal,
    });

    // Limpiar timeout si se creó
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return response;
  } catch (error) {
    // Limpiar timeout en caso de error
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    // Manejar errores de red/SSL de manera más clara
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      // Solo mostrar mensaje detallado en desarrollo
      if (isDevelopment) {
        console.error('❌ Error de conexión SSL detectado');
        console.error('   URL:', url);
        console.error('   Esto puede deberse a un proxy corporativo (Cisco Umbrella)');
        console.error('   Soluciones:');
        console.error('   1. Usar red personal (no corporativa)');
        console.error('   2. Contactar administrador de TI para certificado raíz');
        console.error('   3. Ver: docs/SOLUCION_PROXY_CISCO_UMBRELLA.md');
      }
      
      const sslError = new Error(
        'Error de conexión SSL. Ver consola para más detalles.'
      );
      sslError.name = 'SSLError';
      sslError.originalError = error;
      throw sslError;
    }
    throw error;
  }
};

/**
 * Verificar si estamos en un entorno con proxy corporativo
 */
export const detectCorporateProxy = async () => {
  try {
    // Usar un endpoint real de Supabase en lugar de la raíz
    const testUrl = `${process.env.REACT_APP_SUPABASE_URL || 'https://ywilkhfkuwhsjvojocso.supabase.co'}/rest/v1/`;
    const response = await fetch(testUrl, { 
      method: 'HEAD',
      mode: 'no-cors' // Esto evita el error CORS pero no SSL
    });
    return false; // Si no hay error, no hay proxy problemático
  } catch (error) {
    // Si hay error de SSL, probablemente hay un proxy
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return true;
    }
    // Otros errores (404, etc.) no indican proxy
    return false;
  }
};

/**
 * Configuración para desarrollo con manejo de SSL
 */
export const getDevelopmentConfig = () => {
  if (!isDevelopment) {
    return {};
  }

  return {
    // En desarrollo, podemos agregar opciones adicionales
    // Nota: El navegador controla SSL, no podemos desactivarlo desde JS
    // Pero podemos mejorar el manejo de errores
    onError: (error) => {
      console.warn('⚠️ Error de conexión detectado:', error);
      console.warn('💡 Sugerencia: Verifica tu conexión de red o usa red personal');
    }
  };
};

