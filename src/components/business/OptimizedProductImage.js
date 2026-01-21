import React, { memo, useState, useCallback } from 'react';
import { useImageCache } from '../../hooks/useImageCache';

const OptimizedProductImage = memo(({ imagePath, src, alt, className, onError }) => {
  // Soporte para ambas props: imagePath (preferido) o src (compatibilidad)
  const actualImagePath = imagePath || src;
  
  // Los hooks deben llamarse antes de cualquier return temprano
  const { imageUrl, loading, error } = useImageCache(actualImagePath || null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleError = useCallback((e) => {
    console.error('❌ Error cargando imagen en el componente:', {
      imagePath: actualImagePath,
      imageUrl,
      target: e.target,
      currentSrc: e.target?.currentSrc,
      naturalWidth: e.target?.naturalWidth,
      naturalHeight: e.target?.naturalHeight
    });
    
    // No intentar recargar automáticamente, solo reportar el error
    // El usuario puede refrescar la página o el componente se actualizará cuando cambie la URL
    if (onError) onError(e);
  }, [onError, actualImagePath, imageUrl]);

  // Log para verificar que la URL esté completa cuando se renderiza
  // Este hook DEBE estar antes de los returns tempranos
  React.useEffect(() => {
    if (imageUrl) {
      const hasToken = imageUrl.includes('token=');
      console.log('🖼️ Renderizando imagen con URL:', {
        hasToken,
        urlLength: imageUrl.length,
        urlEnd: imageUrl.substring(Math.max(0, imageUrl.length - 100))
      });
      
      if (!hasToken && imageUrl.includes('/sign/')) {
        console.error('❌ ERROR: URL sin token al renderizar!');
      }
    }
  }, [imageUrl]);

  // Si no hay ruta de imagen, mostrar placeholder inmediatamente
  if (!actualImagePath || actualImagePath.trim() === '' || actualImagePath === 'null' || actualImagePath === 'undefined') {
    return (
      <div className={className} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: '12px',
        color: '#666',
        fontSize: '12px'
      }}>
        Sin imagen
      </div>
    );
  }

  if (loading) {
    return (
      <div className={className} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Cargando...</div>
        {/* Skeleton loader */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          animation: 'shimmer 1.5s infinite'
        }}></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={className} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: '12px',
        color: '#666',
        fontSize: '12px'
      }}>
        Sin imagen
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onLoad={handleLoad}
      onError={(e) => {
        console.error('❌ Error en evento onError del img tag:', {
          currentSrc: e.target?.currentSrc,
          src: e.target?.src,
          hasToken: e.target?.src?.includes('token='),
          srcLength: e.target?.src?.length
        });
        handleError(e);
      }}
      style={{
        transition: 'opacity 0.3s ease-in-out',
        opacity: imageLoaded ? 1 : loading ? 0 : 1
      }}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison para evitar re-renders innecesarios
  const prevPath = prevProps.imagePath || prevProps.src;
  const nextPath = nextProps.imagePath || nextProps.src;
  return prevPath === nextPath &&
         prevProps.alt === nextProps.alt &&
         prevProps.className === nextProps.className;
});

OptimizedProductImage.displayName = 'OptimizedProductImage';

export default OptimizedProductImage;
