import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen antes de subirla
 * @param {File} file - El archivo de imagen original
 * @param {Object} options - Opciones de compresión
 * @returns {Promise<File>} - El archivo comprimido
 */
export const compressImage = async (file, options = {}) => {
  try {
    // Configuración por defecto para compresión
    const defaultOptions = {
      maxSizeMB: 0.5, // Máximo 500KB
      maxWidthOrHeight: 800, // Máximo 800px de ancho o alto
      useWebWorker: true,
      fileType: 'image/jpeg', // Convertir a JPEG para mejor compresión
      initialQuality: 0.8, // Calidad inicial del 80%
      ...options
    };
    
    const compressedFile = await imageCompression(file, defaultOptions);
    
    return compressedFile;
  } catch (error) {
    console.error('Error comprimiendo imagen:', error);
    // Si falla la compresión, devolver el archivo original
    return file;
  }
};

/**
 * Comprime una imagen para productos (optimizada para inventario)
 * @param {File} file - El archivo de imagen original
 * @returns {Promise<File>} - El archivo comprimido
 */
export const compressProductImage = async (file) => {
  return compressImage(file, {
    maxSizeMB: 0.3, // Máximo 300KB para productos
    maxWidthOrHeight: 600, // Máximo 600px para productos
    fileType: 'image/jpeg',
    initialQuality: 0.75 // Calidad del 75% para productos
  });
};

/**
 * Comprime una imagen para avatares de usuario
 * @param {File} file - El archivo de imagen original
 * @returns {Promise<File>} - El archivo comprimido
 */
export const compressAvatarImage = async (file) => {
  return compressImage(file, {
    maxSizeMB: 0.2, // Máximo 200KB para avatares
    maxWidthOrHeight: 400, // Máximo 400px para avatares
    fileType: 'image/jpeg',
    initialQuality: 0.8 // Calidad del 80% para avatares
  });
};
