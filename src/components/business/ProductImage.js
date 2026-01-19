import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/api/supabaseClient';

const ProductImage = ({ imagePath, alt, className, onError }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Cache para URLs firmadas
  const signedUrlCache = useMemo(() => new Map(), []);

  useEffect(() => {
    const getSignedUrl = async () => {
      if (!imagePath) {
        setLoading(false);
        return;
      }

      // Extraer la ruta del archivo de la URL completa si es necesario
      let filePath = imagePath;
      if (imagePath.includes('/storage/v1/object/public/productos/')) {
        filePath = imagePath.split('/storage/v1/object/public/productos/')[1];
      }

      // Verificar cache primero
      if (signedUrlCache.has(filePath)) {
        const cachedData = signedUrlCache.get(filePath);
        // Verificar si la URL cacheada aún es válida (menos de 50 minutos)
        if (Date.now() - cachedData.timestamp < 3000000) {
          setImageUrl(cachedData.url);
          setLoading(false);
          return;
        } else {
          // Remover URL expirada del cache
          signedUrlCache.delete(filePath);
        }
      }
      try {
        const { data, error } = await supabase.storage
          .from('productos')
          .createSignedUrl(filePath, 3600); // URL válida por 1 hora

        if (error) {
          console.error('Error generando signed URL:', error);
          setError(true);
          if (onError) onError(error);
        } else {
          // Guardar en cache
          signedUrlCache.set(filePath, {
            url: data.signedUrl,
            timestamp: Date.now()
          });
          setImageUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error:', err);
        setError(true);
        if (onError) onError(err);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [imagePath, onError, signedUrlCache]);

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
      loading="lazy" // Carga perezosa
      decoding="async" // Decodificación asíncrona
      onLoad={() => {
      }}
      onError={(e) => {
        setError(true);
        if (onError) onError(e);
      }}
      style={{
        transition: 'opacity 0.3s ease-in-out',
        opacity: loading ? 0 : 1
      }}
    />
  );
};

export default ProductImage;
