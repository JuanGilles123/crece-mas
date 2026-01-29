/**
 * Utilidades para manejo de archivos
 */

/**
 * Valida el nombre de un archivo para Supabase Storage
 * Retorna un objeto con isValid y un mensaje de error si hay caracteres no permitidos
 * 
 * @param {string} filename - Nombre del archivo original
 * @param {number} maxLength - Longitud máxima del nombre (por defecto 200)
 * @returns {{isValid: boolean, error?: string, invalidChars?: string[]}} - Resultado de la validación
 */
export const validateFilename = (filename, maxLength = 200) => {
  if (!filename || typeof filename !== 'string') {
    return {
      isValid: false,
      error: 'El nombre del archivo no puede estar vacío'
    };
  }

  // Caracteres permitidos: letras, números, guiones (-), puntos (.), guiones bajos (_) y espacios
  // Caracteres no permitidos: caracteres especiales, Unicode problemáticos, etc.
  const allowedPattern = /^[a-zA-Z0-9._\s-]+$/;

  // Verificar longitud
  if (filename.length > maxLength) {
    return {
      isValid: false,
      error: `El nombre del archivo no puede tener más de ${maxLength} caracteres`
    };
  }

  // Verificar caracteres permitidos
  if (!allowedPattern.test(filename)) {
    // Encontrar caracteres no permitidos
    const invalidChars = [];
    for (let i = 0; i < filename.length; i++) {
      const char = filename[i];
      if (!allowedPattern.test(char)) {
        if (!invalidChars.includes(char)) {
          invalidChars.push(char);
        }
      }
    }

    const charsList = invalidChars.map(c => `"${c}"`).join(', ');
    return {
      isValid: false,
      error: `El nombre del archivo contiene caracteres no permitidos: ${charsList}. Solo se permiten letras, números, espacios, guiones (-), puntos (.) y guiones bajos (_)`,
      invalidChars
    };
  }

  return {
    isValid: true
  };
};

/**
 * Genera un nombre de archivo para Supabase Storage
 * Combina un prefijo (como organizationId), timestamp y nombre original
 * 
 * @param {string} prefix - Prefijo para el path (ej: organizationId o user.id)
 * @param {string} originalFilename - Nombre original del archivo
 * @param {string} folder - Carpeta opcional (ej: 'productos', 'toppings')
 * @returns {string} - Path completo para Supabase Storage
 */
export const generateStoragePath = (prefix, originalFilename, folder = null) => {
  const timestamp = Date.now();
  
  let path = '';
  if (folder) {
    path = `${folder}/${prefix}/${timestamp}_${originalFilename}`;
  } else {
    path = `${prefix}/${timestamp}_${originalFilename}`;
  }
  
  return path;
};
