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
      // Verificar si la URL cacheada aún es válida (menos de 50 minutos)
      if (Date.now() - cachedData.timestamp < 3000000) {
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

    // Función para generar signed URL
    const generateSignedUrl = async () => {
      try {
        const { supabase } = await import('../supabaseClient');
        
        // Extraer la ruta del archivo de la URL completa si es necesario
        let filePath = imagePath;
        if (imagePath.includes('/storage/v1/object/public/productos/')) {
          filePath = imagePath.split('/storage/v1/object/public/productos/')[1];
        }

        const { data, error } = await supabase.storage
          .from('productos')
          .createSignedUrl(filePath, 3600);

        if (error) throw error;

        return data.signedUrl;
      } catch (err) {
        throw err;
      }
    };

    // Proceso de carga
    const loadImage = async () => {
      try {
        const signedUrl = await generateSignedUrl();
        
        // Guardar en cache global
        globalImageCache.set(imagePath, {
          url: signedUrl,
          timestamp: Date.now()
        });

        // Precargar la imagen
        await preloadImage(signedUrl);

        if (mountedRef.current) {
          setImageUrl(signedUrl);
          setLoading(false);
        }
      } catch (err) {
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
