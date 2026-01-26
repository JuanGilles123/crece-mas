import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen antes de subirla
 * @param {File} file - El archivo de imagen original
 * @param {Object} options - Opciones de compresión
 * @returns {Promise<File>} - El archivo comprimido
 */
export const compressImage = async (file, options = {}) => {
  try {
    // Configuración por defecto para compresión (optimizada para performance)
    const defaultOptions = {
      maxSizeMB: 0.3, // Máximo 300KB (reducido de 500KB)
      maxWidthOrHeight: 600, // Máximo 600px de ancho o alto (reducido de 800px)
      useWebWorker: true,
      fileType: 'image/jpeg', // Convertir a JPEG para mejor compresión
      initialQuality: 0.7, // Calidad inicial del 70% (reducido de 80% para mejor performance)
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
 * Recorta y redimensiona una imagen a un tamaño cuadrado específico
 * @param {File} file - El archivo de imagen original
 * @param {number} size - Tamaño del cuadrado (ancho y alto) en píxeles
 * @returns {Promise<File>} - El archivo procesado
 */
const cropAndResizeToSquare = async (file, size = 400) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Crear canvas para el recorte cuadrado
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calcular el tamaño del recorte (usar el lado más pequeño)
        const minSize = Math.min(img.width, img.height);
        
        // Calcular el punto de inicio para centrar el recorte
        const startX = (img.width - minSize) / 2;
        const startY = (img.height - minSize) / 2;
        
        // Configurar el canvas al tamaño final
        canvas.width = size;
        canvas.height = size;
        
        // Dibujar la imagen recortada y redimensionada
        ctx.drawImage(
          img,
          startX, startY, minSize, minSize, // Recorte desde la imagen original
          0, 0, size, size // Dibujar en el canvas con el tamaño final
        );
        
        // Convertir a blob y luego a File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al procesar la imagen'));
              return;
            }
            const processedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(processedFile);
          },
          'image/jpeg',
          0.9 // Calidad inicial alta antes de la compresión final
        );
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Comprime una imagen para productos (optimizada para inventario)
 * Recorta y redimensiona a un tamaño cuadrado fijo para consistencia visual
 * @param {File} file - El archivo de imagen original
 * @returns {Promise<File>} - El archivo comprimido y recortado a cuadrado
 */
export const compressProductImage = async (file) => {
  try {
    // Primero recortar y redimensionar a cuadrado 400x400px
    const squareImage = await cropAndResizeToSquare(file, 400);
    
    // Luego comprimir el resultado
    return compressImage(squareImage, {
      maxSizeMB: 0.15, // Máximo 150KB para productos
      maxWidthOrHeight: 400, // Ya está en 400px, pero mantener para compresión
      fileType: 'image/jpeg',
      initialQuality: 0.75 // Calidad del 75% para productos
    });
  } catch (error) {
    console.error('Error procesando imagen de producto:', error);
    // Si falla el recorte, intentar compresión normal
    return compressImage(file, {
      maxSizeMB: 0.15,
      maxWidthOrHeight: 400,
      fileType: 'image/jpeg',
      initialQuality: 0.75
    });
  }
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
