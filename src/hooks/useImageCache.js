import { useState, useEffect, useRef } from 'react';

// Cache global para todas las imágenes
const globalImageCache = new Map();

export const useImageCache = (imagePath) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!imagePath || imagePath.trim() === '' || imagePath === 'null' || imagePath === 'undefined') {
      setLoading(false);
      setError(true);
      return;
    }

    // Verificar cache global
    if (globalImageCache.has(imagePath)) {
      const cachedData = globalImageCache.get(imagePath);
      // Verificar si la URL cacheada aún es válida (menos de 2 horas para URLs públicas)
      if (Date.now() - cachedData.timestamp < 7200000) {
        if (mountedRef.current) {
          setImageUrl(cachedData.url);
          setLoading(false);
        }
        return;
      } else {
        // Remover URL expirada del cache
        globalImageCache.delete(imagePath);
      }
    }

    // Precargar imagen
    const preloadImage = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = reject;
        img.src = url;
      });
    };

    // Función para generar URL de imagen (optimizada para performance)
    const generateImageUrl = async () => {
      try {
        const { supabase } = await import('../services/api/supabaseClient');
        
        if (!imagePath) {
          throw new Error('imagePath está vacío o es null');
        }

        // Extraer la ruta del archivo de la URL completa si es necesario
        let filePath = imagePath;
        
        // Si es una URL completa de Supabase Storage, extraer la ruta
        if (imagePath.includes('/storage/v1/object/public/productos/')) {
          filePath = imagePath.split('/storage/v1/object/public/productos/')[1];
        } else if (imagePath.includes('/storage/v1/object/sign/productos/')) {
          filePath = imagePath.split('/storage/v1/object/sign/productos/')[1].split('?')[0];
        } else if (imagePath.includes('productos/')) {
          // Si contiene 'productos/', podría ser una ruta parcial
          const parts = imagePath.split('productos/');
          if (parts.length > 1) {
            filePath = parts[1].split('?')[0];
          }
        }
        
        // Limpiar la ruta (remover espacios, caracteres especiales, etc.)
        filePath = filePath.trim();
        
        // Si después de limpiar está vacío, usar el original
        if (!filePath) {
          filePath = imagePath.trim();
        }

        console.log('🖼️ Generando URL para imagen:', { original: imagePath, filePath });

        // Intentar usar URL pública primero (más rápido, sin firma)
        // Esto funciona si el bucket 'productos' es público
        const { data: publicData } = supabase.storage
          .from('productos')
          .getPublicUrl(filePath);
        
        if (publicData?.publicUrl) {
          console.log('✅ URL pública generada:', publicData.publicUrl);
          return publicData.publicUrl;
        }
        
        // Fallback: usar signed URL si la pública no está disponible
        const { data: signedData, error } = await supabase.storage
          .from('productos')
          .createSignedUrl(filePath, 3600);

        if (error) {
          console.error('❌ Error generando signed URL:', error, 'para ruta:', filePath);
          throw error;
        }

        console.log('✅ Signed URL generada:', signedData.signedUrl);
        return signedData.signedUrl;
      } catch (err) {
        console.error('❌ Error en generateImageUrl:', err, 'imagePath original:', imagePath);
        throw err;
      }
    };

    // Proceso de carga
    const loadImage = async () => {
      try {
        const imageUrl = await generateImageUrl();
        
        // Guardar en cache global (aumentar tiempo de cache a 2 horas)
        globalImageCache.set(imagePath, {
          url: imageUrl,
          timestamp: Date.now()
        });

        // Precargar la imagen para verificar que es válida
        try {
          await preloadImage(imageUrl);
          console.log('✅ Imagen precargada exitosamente:', imagePath);
        } catch (preloadError) {
          console.warn('⚠️ Error precargando imagen (pero continuando):', preloadError);
          // Continuar aunque falle la precarga, la imagen podría cargar en el navegador
        }

        if (mountedRef.current) {
          setImageUrl(imageUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ No se pudo cargar la imagen:', imagePath, 'Error:', err);
        if (mountedRef.current) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadImage();
  }, [imagePath]);

  return { imageUrl, loading, error };
};
