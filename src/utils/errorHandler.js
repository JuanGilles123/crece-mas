/**
 * Sistema de manejo de errores seguro
 * Previene exposición de información sensible en producción
 */

import logger from './logger';

/**
 * Tipos de errores conocidos y sus mensajes amigables
 */
const ERROR_MESSAGES = {
  // Errores de autenticación
  'invalid_credentials': 'Correo o contraseña incorrectos.',
  'email_not_confirmed': 'Por favor, confirma tu correo electrónico antes de iniciar sesión.',
  'invalid_email': 'El correo electrónico no es válido.',
  'weak_password': 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.',
  'email_already_registered': 'Este correo electrónico ya está registrado.',
  'too_many_requests': 'Demasiados intentos. Por favor, espera un momento antes de intentar nuevamente.',
  
  // Errores de red
  'network_error': 'Error de conexión. Por favor, verifica tu conexión a internet.',
  'timeout': 'La solicitud tardó demasiado. Por favor, intenta nuevamente.',
  'server_error': 'Error en el servidor. Por favor, intenta más tarde.',
  
  // Errores de validación
  'validation_error': 'Por favor, verifica que todos los campos sean correctos.',
  'required_field': 'Este campo es obligatorio.',
  'invalid_format': 'El formato ingresado no es válido.',
  
  // Errores de permisos
  'permission_denied': 'No tienes permisos para realizar esta acción.',
  'unauthorized': 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  
  // Errores de recursos
  'not_found': 'El recurso solicitado no fue encontrado.',
  'already_exists': 'Este recurso ya existe.',
  
  // Errores genéricos
  'unknown_error': 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente o contacta al soporte si el problema persiste.',
};

/**
 * Obtiene el tipo de error de un objeto de error
 * @param {Error|Object} error - Objeto de error
 * @returns {string} - Tipo de error identificado
 */
const getErrorType = (error) => {
  if (!error) return 'unknown_error';
  
  const errorMessage = (error.message || '').toLowerCase();
  const errorCode = error.code || '';
  const errorStatus = error.status || error.statusCode || '';
  
  // Verificar por código de error
  if (errorCode) {
    const codeLower = errorCode.toLowerCase();
    if (codeLower.includes('invalid_credentials') || codeLower.includes('invalid_login')) {
      return 'invalid_credentials';
    }
    if (codeLower.includes('email_not_confirmed') || codeLower.includes('email_not_verified')) {
      return 'email_not_confirmed';
    }
    if (codeLower.includes('too_many_requests') || codeLower.includes('rate_limit')) {
      return 'too_many_requests';
    }
    if (codeLower === '23505') { // PostgreSQL unique violation
      return 'already_exists';
    }
  }
  
  // Verificar por mensaje
  if (errorMessage.includes('invalid login credentials') || 
      errorMessage.includes('invalid credentials')) {
    return 'invalid_credentials';
  }
  
  if (errorMessage.includes('email not confirmed') || 
      errorMessage.includes('email not verified')) {
    return 'email_not_confirmed';
  }
  
  if (errorMessage.includes('password should be at least') ||
      errorMessage.includes('weak password')) {
    return 'weak_password';
  }
  
  if (errorMessage.includes('email') && errorMessage.includes('already') ||
      errorMessage.includes('user already registered')) {
    return 'email_already_registered';
  }
  
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection')) {
    return 'network_error';
  }
  
  if (errorMessage.includes('timeout')) {
    return 'timeout';
  }
  
  if (errorStatus === 401 || errorMessage.includes('unauthorized')) {
    return 'unauthorized';
  }
  
  if (errorStatus === 403 || errorMessage.includes('permission denied') ||
      errorMessage.includes('forbidden')) {
    return 'permission_denied';
  }
  
  if (errorStatus === 404 || errorMessage.includes('not found')) {
    return 'not_found';
  }
  
  if (errorStatus >= 500) {
    return 'server_error';
  }
  
  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return 'validation_error';
  }
  
  return 'unknown_error';
};

/**
 * Obtiene un mensaje de error amigable para el usuario
 * @param {Error|Object} error - Objeto de error
 * @param {string} defaultMessage - Mensaje por defecto si no se encuentra el error
 * @returns {string} - Mensaje amigable para el usuario
 */
export const getErrorMessage = (error, defaultMessage = null) => {
  // En desarrollo, logear el error completo para debugging
  if (process.env.NODE_ENV === 'development') {
    logger.error('Error completo:', error);
  } else {
    // En producción, solo logear el tipo de error
    const errorType = getErrorType(error);
    logger.error('Error tipo:', errorType, 'Código:', error?.code);
  }
  
  const errorType = getErrorType(error);
  const friendlyMessage = ERROR_MESSAGES[errorType] || defaultMessage || ERROR_MESSAGES.unknown_error;
  
  return friendlyMessage;
};

/**
 * Maneja errores de forma segura, logueando detalles pero mostrando mensajes genéricos
 * @param {Error|Object} error - Objeto de error
 * @param {Object} options - Opciones adicionales
 * @returns {string} - Mensaje de error para mostrar al usuario
 */
export const handleError = (error, options = {}) => {
  const {
    defaultMessage = null,
    logDetails = true,
    showTechnicalDetails = false
  } = options;
  
  const errorType = getErrorType(error);
  
  // Logear detalles técnicos solo en desarrollo o si está habilitado
  if (logDetails && (process.env.NODE_ENV === 'development' || showTechnicalDetails)) {
    logger.error('Error técnico:', {
      type: errorType,
      message: error?.message,
      code: error?.code,
      status: error?.status || error?.statusCode,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
  
  // Retornar mensaje amigable
  return getErrorMessage(error, defaultMessage);
};

/**
 * Wrapper para manejar errores en funciones async
 * @param {Function} asyncFn - Función async
 * @param {Object} options - Opciones de manejo de errores
 * @returns {Promise} - Promise que resuelve o rechaza con mensaje amigable
 */
export const safeAsync = async (asyncFn, options = {}) => {
  try {
    return await asyncFn();
  } catch (error) {
    const friendlyMessage = handleError(error, options);
    
    // Si el usuario quiere el error original, lanzarlo con el mensaje amigable
    if (options.throwError) {
      const friendlyError = new Error(friendlyMessage);
      friendlyError.originalError = error;
      friendlyError.errorType = getErrorType(error);
      throw friendlyError;
    }
    
    // De lo contrario, retornar null y dejar que el llamador maneje el error
    return null;
  }
};

export default {
  getErrorMessage,
  handleError,
  safeAsync,
  getErrorType
};
