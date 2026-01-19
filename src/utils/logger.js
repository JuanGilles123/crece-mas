/**
 * Sistema de logging condicional para desarrollo y producción
 * Previene exposición de información sensible en producción
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL || (isDevelopment ? 'debug' : 'error');

// Niveles de log ordenados por importancia
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4
};

const currentLogLevel = LOG_LEVELS[LOG_LEVEL] ?? LOG_LEVELS.error;

/**
 * Sanitiza datos sensibles antes de logearlos
 * @param {*} data - Datos a sanitizar
 * @returns {*} Datos sanitizados
 */
const sanitizeData = (data) => {
  if (!data) return data;
  
  // Si es un objeto, crear copia y sanitizar
  if (typeof data === 'object' && data !== null) {
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    // Lista de campos sensibles que deben ser ocultados
    const sensitiveFields = [
      'password',
      'token',
      'auth',
      'authorization',
      'api_key',
      'apikey',
      'secret',
      'private_key',
      'privatekey',
      'session',
      'cookie',
      'credit_card',
      'creditcard',
      'cvv',
      'ssn',
      'nit', // Información fiscal sensible
      'email', // Puede ser sensible en algunos contextos
      'phone',
      'telefono'
    ];
    
    // Recursivamente sanitizar objetos
    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveFields.some(field => 
        lowerKey.includes(field)
      );
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  // Si es un string que contiene información sensible
  if (typeof data === 'string') {
    // Ocultar posibles tokens o keys en strings
    const sensitivePatterns = [
      /(password|token|key|secret)=['"]?[^'"\s]+/gi,
      /bearer\s+[a-zA-Z0-9\-_]+/gi,
      /api[_-]?key['":=]\s*[a-zA-Z0-9\-_]+/gi
    ];
    
    let sanitized = data;
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, (match) => {
        const parts = match.split(/[=:]\s*/);
        if (parts.length === 2) {
          return `${parts[0]}=[REDACTED]`;
        }
        return '[REDACTED]';
      });
    });
    
    return sanitized;
  }
  
  return data;
};

/**
 * Logger principal con niveles y sanitización
 */
export const logger = {
  /**
   * Log de debug - solo en desarrollo
   */
  debug: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.debug && isDevelopment) {
      const sanitized = args.map(sanitizeData);
      console.log('[DEBUG]', ...sanitized);
    }
  },

  /**
   * Log de información - solo en desarrollo
   */
  info: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.info && isDevelopment) {
      const sanitized = args.map(sanitizeData);
      console.info('[INFO]', ...sanitized);
    }
  },

  /**
   * Log de advertencia - visible en desarrollo y producción
   */
  warn: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.warn) {
      const sanitized = args.map(sanitizeData);
      console.warn('[WARN]', ...sanitized);
    }
  },

  /**
   * Log de error - siempre visible pero sanitizado
   */
  error: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.error) {
      const sanitized = args.map(sanitizeData);
      console.error('[ERROR]', ...sanitized);
    }
  },

  /**
   * Log de datos de negocio - solo en desarrollo y con límite de profundidad
   */
  business: (message, data = null) => {
    if (currentLogLevel <= LOG_LEVELS.debug && isDevelopment) {
      const sanitized = data ? sanitizeData(data) : null;
      console.log(`[BUSINESS] ${message}`, sanitized || '');
    }
  },

  /**
   * Log de performance - solo en desarrollo
   */
  performance: (label, duration) => {
    if (currentLogLevel <= LOG_LEVELS.debug && isDevelopment) {
      console.log(`[PERF] ${label}: ${duration}ms`);
    }
  }
};

/**
 * Helper para reemplazar console.log en el código existente
 * En producción, estos logs serán silenciados automáticamente
 */
export default logger;
