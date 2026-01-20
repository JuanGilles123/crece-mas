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
    if (!imagePath) {
      setLoading(false);
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
        
        // Extraer la ruta del archivo de la URL completa si es necesario
        let filePath = imagePath;
        if (imagePath.includes('/storage/v1/object/public/productos/')) {
          filePath = imagePath.split('/storage/v1/object/public/productos/')[1];
        }
        
        // Limpiar la ruta (remover espacios, caracteres especiales, etc.)
        filePath = filePath.trim();

        // Intentar usar URL pública primero (más rápido, sin firma)
        // Esto funciona si el bucket 'productos' es público
        const { data: publicData } = supabase.storage
          .from('productos')
          .getPublicUrl(filePath);
        
        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
        
        // Fallback: usar signed URL si la pública no está disponible
        const { data: signedData, error } = await supabase.storage
          .from('productos')
          .createSignedUrl(filePath, 3600);

        if (error) {
          console.warn('⚠️ Error generando URL para:', filePath);
          throw error;
        }

        return signedData.signedUrl;
      } catch (err) {
        console.error('❌ Error en generateImageUrl:', err);
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

        // Precargar la imagen (solo si está en viewport o cerca)
        await preloadImage(imageUrl);

        if (mountedRef.current) {
          setImageUrl(imageUrl);
          setLoading(false);
        }
      } catch (err) {
        console.warn('⚠️ No se pudo cargar la imagen:', imagePath);
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
