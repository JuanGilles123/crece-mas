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
    if (onError) onError(e);
  }, [onError]);

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
    <>
      {!imageLoaded && (
        <div className={className} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
          borderRadius: '12px',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Cargando...</div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </>
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
