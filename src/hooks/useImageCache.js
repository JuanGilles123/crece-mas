import { useState, useEffect, useRef } from 'react';

// Cache global para todas las imágenes (compartido entre componentes)
// Usar window.__imageCache si existe (para compartir con Inventario), sino crear uno nuevo
const globalImageCache = (() => {
  if (typeof window !== 'undefined') {
    if (!window.__imageCache) {
      window.__imageCache = new Map();
    }
    return window.__imageCache;
  }
  return new Map();
})();

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
    // Resetear estados al cambiar imagePath
    if (mountedRef.current) {
      setLoading(true);
      setError(false);
      setImageUrl(null);
    }

    if (!imagePath || imagePath.trim() === '' || imagePath === 'null' || imagePath === 'undefined') {
      if (mountedRef.current) {
        setLoading(false);
        setError(true);
        setImageUrl(null);
      }
      return;
    }

    const imagePathTrimmed = imagePath.trim();
    if (imagePathTrimmed.startsWith('http://') || imagePathTrimmed.startsWith('https://') || imagePathTrimmed.startsWith('data:')) {
      if (mountedRef.current) {
        setImageUrl(imagePathTrimmed);
        setLoading(false);
        setError(false);
      }
      return;
    }

    // Función para generar URL de imagen (debe estar definida antes de usarse)
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

        // Decodificar la ruta si viene codificada
        try {
          filePath = decodeURIComponent(filePath);
        } catch (e) {
          // Si falla la decodificación, usar el original
        }

        // Intentar usar signed URL primero (más confiable si el bucket no es público)
        // El bucket 'productos' puede requerir autenticación
        try {
          const { data: signedData, error: signedError } = await supabase.storage
            .from('productos')
            .createSignedUrl(filePath, 3600); // 1 hora de validez

          if (signedError) {
            // Intentar URL pública como fallback
          } else if (signedData?.signedUrl) {
            const urlString = signedData.signedUrl;
            const hasToken = urlString.includes('token=');
            
            if (hasToken) {
              return urlString;
            }
            // Si no tiene token, intentar URL pública como fallback
          }
        } catch (signedErr) {
          // Intentar URL pública como fallback
        }
        
        // Fallback: usar URL pública si está disponible
        try {
          const { data: publicData } = supabase.storage
            .from('productos')
            .getPublicUrl(filePath);
          
          if (publicData?.publicUrl) {
            return publicData.publicUrl;
          }
        } catch (publicErr) {
          // Continuar con el error
        }
        
        // Si llegamos aquí, ningún método funcionó
        const errorMsg = `No se pudo generar URL válida para: ${filePath}. Verifica que el archivo exista y que las políticas de storage permitan acceso.`;
        throw new Error(errorMsg);
      } catch (err) {
        throw err;
      }
    };

    // Proceso de carga
    const loadImage = async () => {
      if (mountedRef.current) {
        setLoading(true);
        setError(false);
      }

      try {
        const imageUrl = await generateImageUrl();
        
        if (!imageUrl) {
          throw new Error('No se generó una URL válida');
        }
        
        globalImageCache.set(imagePath, {
          url: imageUrl,
          timestamp: Date.now()
        });
        
        if (mountedRef.current) {
          setImageUrl(imageUrl);
          setLoading(false);
          setError(false);
        }

        // Precargar la imagen DESPUÉS de actualizar el estado
        const img = new Image();
        img.src = imageUrl;
      } catch (err) {
        if (mountedRef.current) {
          setError(true);
          setLoading(false);
          setImageUrl(null);
        }
      }
    };

    // Función para verificar el cache
    const checkCache = () => {
      if (globalImageCache.has(imagePath)) {
        const cachedData = globalImageCache.get(imagePath);
        // Verificar si la URL cacheada aún es válida (menos de 2 horas para URLs públicas)
        if (Date.now() - cachedData.timestamp < 7200000) {
          if (mountedRef.current) {
            setImageUrl(cachedData.url);
            setLoading(false);
            setError(false);
          }
          return true; // Encontrado en cache
        } else {
          // Remover URL expirada del cache
          globalImageCache.delete(imagePath);
        }
      }
      return false; // No encontrado en cache
    };

    // Verificar cache inmediatamente
    if (checkCache()) {
      return; // Encontrado en cache, no hacer nada más
    }

    // Si no está en cache y el cache es pequeño, verificar periódicamente
    // Esto es útil cuando Inventario está precargando imágenes
    let cacheCheckInterval = null;
    if (globalImageCache.size < 10) {
      let attempts = 0;
      const maxAttempts = 10; // Verificar hasta 10 veces (5 segundos)
      
      cacheCheckInterval = setInterval(() => {
        attempts++;
        if (checkCache()) {
          // Encontrado en cache, limpiar intervalo
          clearInterval(cacheCheckInterval);
          return;
        }
        
        if (attempts >= maxAttempts) {
          // Después de varios intentos, continuar con la generación normal
          clearInterval(cacheCheckInterval);
          loadImage();
        }
      }, 500); // Verificar cada 500ms
      
      // Cleanup del intervalo
      return () => {
        if (cacheCheckInterval) {
          clearInterval(cacheCheckInterval);
        }
      };
    } else {
      // Cache grande, probablemente ya está todo cargado, generar URL inmediatamente
      loadImage();
    }
  }, [imagePath]);

  return { imageUrl, loading, error };
};
