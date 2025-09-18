import { supabase } from '../supabaseClient';

/**
 * Elimina una imagen del storage de Supabase
 * @param {string} imagePath - Ruta de la imagen en el storage
 * @returns {Promise<boolean>} - true si se eliminó correctamente, false si hubo error
 */
export const deleteImageFromStorage = async (imagePath) => {
  if (!imagePath) {
    console.log('No hay imagen para eliminar');
    return true;
  }

  try {
    console.log('Eliminando imagen del storage:', imagePath);
    
    const { error } = await supabase.storage
      .from('productos')
      .remove([imagePath]);

    if (error) {
      console.error('Error eliminando imagen del storage:', error);
      return false;
    }

    console.log('Imagen eliminada exitosamente del storage');
    return true;
  } catch (error) {
    console.error('Error inesperado eliminando imagen:', error);
    return false;
  }
};

/**
 * Elimina múltiples imágenes del storage de Supabase
 * @param {string[]} imagePaths - Array de rutas de imágenes
 * @returns {Promise<boolean>} - true si todas se eliminaron correctamente
 */
export const deleteMultipleImagesFromStorage = async (imagePaths) => {
  if (!imagePaths || imagePaths.length === 0) {
    console.log('No hay imágenes para eliminar');
    return true;
  }

  try {
    console.log('Eliminando múltiples imágenes del storage:', imagePaths);
    
    const { error } = await supabase.storage
      .from('productos')
      .remove(imagePaths);

    if (error) {
      console.error('Error eliminando imágenes del storage:', error);
      return false;
    }

    console.log('Todas las imágenes eliminadas exitosamente del storage');
    return true;
  } catch (error) {
    console.error('Error inesperado eliminando imágenes:', error);
    return false;
  }
};

/**
 * Limpia imágenes huérfanas del storage (imágenes que no están referenciadas en la base de datos)
 * @param {string} userId - ID del usuario
 * @returns {Promise<{deleted: number, errors: number}>} - Resultado de la limpieza
 */
export const cleanupOrphanedImages = async (userId) => {
  try {
    console.log('Iniciando limpieza de imágenes huérfanas para usuario:', userId);
    
    // Obtener todas las imágenes del usuario en el storage
    const { data: storageFiles, error: listError } = await supabase.storage
      .from('productos')
      .list(userId, {
        limit: 1000,
        offset: 0
      });

    if (listError) {
      console.error('Error listando archivos del storage:', listError);
      return { deleted: 0, errors: 1 };
    }

    if (!storageFiles || storageFiles.length === 0) {
      console.log('No hay archivos en el storage para limpiar');
      return { deleted: 0, errors: 0 };
    }

    // Obtener todas las rutas de imágenes referenciadas en la base de datos
    const { data: productos, error: dbError } = await supabase
      .from('productos')
      .select('imagen')
      .eq('user_id', userId);

    if (dbError) {
      console.error('Error obteniendo productos de la base de datos:', dbError);
      return { deleted: 0, errors: 1 };
    }

    const referencedImages = new Set(
      productos
        .filter(p => p.imagen)
        .map(p => p.imagen)
    );

    // Encontrar imágenes huérfanas
    const orphanedImages = storageFiles
      .filter(file => !referencedImages.has(`${userId}/${file.name}`))
      .map(file => `${userId}/${file.name}`);

    if (orphanedImages.length === 0) {
      console.log('No se encontraron imágenes huérfanas');
      return { deleted: 0, errors: 0 };
    }

    console.log(`Encontradas ${orphanedImages.length} imágenes huérfanas:`, orphanedImages);

    // Eliminar imágenes huérfanas
    const { error: deleteError } = await supabase.storage
      .from('productos')
      .remove(orphanedImages);

    if (deleteError) {
      console.error('Error eliminando imágenes huérfanas:', deleteError);
      return { deleted: 0, errors: orphanedImages.length };
    }

    console.log(`Limpieza completada: ${orphanedImages.length} imágenes eliminadas`);
    return { deleted: orphanedImages.length, errors: 0 };

  } catch (error) {
    console.error('Error inesperado en limpieza de imágenes:', error);
    return { deleted: 0, errors: 1 };
  }
};

/**
 * Obtiene el tamaño total de las imágenes de un usuario en el storage
 * @param {string} userId - ID del usuario
 * @returns {Promise<{totalSize: number, fileCount: number}>} - Información del storage
 */
export const getStorageInfo = async (userId) => {
  try {
    const { data: storageFiles, error } = await supabase.storage
      .from('productos')
      .list(userId, {
        limit: 1000,
        offset: 0
      });

    if (error) {
      console.error('Error obteniendo información del storage:', error);
      return { totalSize: 0, fileCount: 0 };
    }

    const totalSize = storageFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
    const fileCount = storageFiles.length;

    return { totalSize, fileCount };
  } catch (error) {
    console.error('Error inesperado obteniendo información del storage:', error);
    return { totalSize: 0, fileCount: 0 };
  }
};
