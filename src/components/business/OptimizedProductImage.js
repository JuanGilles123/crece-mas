import React, { useState, useCallback } from 'react';
import { useImageCache } from '../../hooks/useImageCache';

const OptimizedProductImage = ({ imagePath, src, alt, className, onError }) => {
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

  // Verificar cache directamente si está en loading (fallback)
  const checkCacheDirectly = () => {
    if (typeof window !== 'undefined' && window.__imageCache && actualImagePath) {
      const cachedData = window.__imageCache.get(actualImagePath);
      if (cachedData && Date.now() - cachedData.timestamp < 7200000) {
        return cachedData.url;
      }
    }
    return null;
  };

  const cachedUrl = loading ? checkCacheDirectly() : null;

  if (loading && !cachedUrl) {
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

  // Si hay una URL en cache pero el hook aún está en loading, usar la URL del cache
  const finalImageUrl = cachedUrl || imageUrl;

  if (error || !finalImageUrl) {
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
      src={finalImageUrl}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      style={{
        transition: 'opacity 0.3s ease-in-out',
        opacity: imageLoaded ? 1 : loading ? 0 : 1
      }}
    />
  );
};

OptimizedProductImage.displayName = 'OptimizedProductImage';

export default OptimizedProductImage;
