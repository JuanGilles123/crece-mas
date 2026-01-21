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

        // Decodificar la ruta si viene codificada
        try {
          filePath = decodeURIComponent(filePath);
        } catch (e) {
          // Si falla la decodificación, usar el original
          console.warn('⚠️ Error decodificando ruta, usando original:', filePath);
        }

        console.log('🖼️ Generando URL para imagen:', { 
          original: imagePath, 
          filePath,
          length: filePath.length,
          firstChars: filePath.substring(0, 50)
        });

        // Intentar usar signed URL primero (más confiable si el bucket no es público)
        // El bucket 'productos' puede requerir autenticación
        console.log('🔍 Intentando generar signed URL para:', filePath);
        try {
          const startTime = Date.now();
          const { data: signedData, error: signedError } = await supabase.storage
            .from('productos')
            .createSignedUrl(filePath, 3600); // 1 hora de validez
          const endTime = Date.now();
          
          console.log(`⏱️ Tiempo de respuesta signed URL: ${endTime - startTime}ms`);
          console.log('📦 Respuesta completa de createSignedUrl:', {
            hasData: !!signedData,
            hasError: !!signedError,
            dataKeys: signedData ? Object.keys(signedData) : null,
            signedUrl: signedData?.signedUrl ? signedData.signedUrl.substring(0, 150) : null
          });

          if (signedError) {
            console.error('❌ Error generando signed URL:', {
              error: signedError,
              message: signedError.message,
              status: signedError.statusCode || 'N/A',
              filePath: filePath
            });
            console.warn('⚠️ Intentando URL pública como fallback...');
          } else if (signedData?.signedUrl) {
            // Verificar que la URL tenga el token en el query string
            const urlString = signedData.signedUrl;
            const hasToken = urlString.includes('token=');
            const urlParts = urlString.split('?');
            const queryString = urlParts.length > 1 ? urlParts[1] : '';
            
            console.log('✅ Signed URL generada:', {
              baseUrl: urlParts[0],
              hasQueryString: urlParts.length > 1,
              queryStringLength: queryString.length,
              hasToken: hasToken,
              urlLength: urlString.length
            });
            
            if (!hasToken) {
              console.error('❌ ERROR CRÍTICO: La signed URL no contiene el parámetro "token"!');
              console.error('URL completa recibida:', urlString);
              console.error('Esto puede indicar un problema con las políticas de storage o la autenticación');
              // No lanzar error, intentar URL pública como fallback
              console.warn('⚠️ Intentando URL pública como fallback...');
            } else {
              console.log('✅ Token encontrado en URL. URL válida.');
              return urlString;
            }
          } else {
            console.warn('⚠️ Signed URL no devolvió signedUrl en la respuesta');
            console.warn('Respuesta completa:', JSON.stringify(signedData, null, 2));
          }
        } catch (signedErr) {
          console.error('❌ Excepción al generar signed URL:', {
            error: signedErr,
            message: signedErr.message,
            stack: signedErr.stack
          });
          console.warn('⚠️ Intentando URL pública como fallback...');
        }
        
        // Fallback: usar URL pública si está disponible
        console.log('🔍 Intentando generar URL pública para:', filePath);
        try {
          const { data: publicData } = supabase.storage
            .from('productos')
            .getPublicUrl(filePath);
          
          if (publicData?.publicUrl) {
            console.log('✅ URL pública generada (puede requerir políticas de acceso público):', publicData.publicUrl.substring(0, 100) + '...');
            console.warn('⚠️ NOTA: Si el bucket no es público, esta URL puede no funcionar. Usa signed URLs.');
            return publicData.publicUrl;
          } else {
            console.warn('⚠️ getPublicUrl no devolvió datos');
          }
        } catch (publicErr) {
          console.error('❌ Error obteniendo URL pública:', {
            error: publicErr,
            message: publicErr.message
          });
        }
        
        // Si llegamos aquí, ningún método funcionó
        const errorMsg = `No se pudo generar URL válida para: ${filePath}. Verifica que el archivo exista y que las políticas de storage permitan acceso. El bucket puede requerir autenticación (signed URLs).`;
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      } catch (err) {
        console.error('❌ Error en generateImageUrl:', err, 'imagePath original:', imagePath);
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
        
        // Guardar en cache global (aumentar tiempo de cache a 2 horas)
        globalImageCache.set(imagePath, {
          url: imageUrl,
          timestamp: Date.now()
        });

        // No precargar la imagen, dejarla que el navegador la cargue directamente
        // Esto evita problemas de CORS y permite que el navegador maneje la carga
        console.log('✅ URL generada, asignando al componente:', {
          urlLength: imageUrl.length,
          hasToken: imageUrl.includes('token='),
          urlPreview: imageUrl.substring(0, 120) + '...' + imageUrl.substring(imageUrl.length - 50),
          fullUrl: imageUrl // Log completo para debugging
        });
        
        // Validar que la URL esté completa antes de asignarla
        if (!imageUrl.includes('token=') && imageUrl.includes('/sign/')) {
          console.error('❌ ADVERTENCIA: URL firmada sin token detectada antes de asignar!');
        }
        
        if (mountedRef.current) {
          setImageUrl(imageUrl);
          setLoading(false);
          setError(false);
        }
      } catch (err) {
        console.error('❌ No se pudo cargar la imagen:', imagePath, 'Error:', err.message || err);
        if (mountedRef.current) {
          setError(true);
          setLoading(false);
          setImageUrl(null);
        }
      }
    };

    loadImage();
  }, [imagePath]);

  return { imageUrl, loading, error };
};
