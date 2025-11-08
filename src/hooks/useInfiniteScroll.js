import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook personalizado para implementar infinite scroll de forma optimizada
 * @param {Function} loadMore - Función para cargar más datos
 * @param {boolean} hasMore - Si hay más datos para cargar
 * @param {boolean} isLoading - Si está cargando actualmente
 * @param {Object} options - Opciones adicionales
 */
export const useInfiniteScroll = (loadMore, hasMore, isLoading, options = {}) => {
  const {
    threshold = 0.8, // Cargar cuando esté al 80% del scroll
    rootMargin = '100px', // Margen antes de llegar al final
  } = options;

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const handleObserver = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin,
      threshold
    });

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, rootMargin, threshold]);

  return { loadMoreRef };
};

/**
 * Hook para detectar cuando el usuario está cerca del final del scroll
 */
export const useScrollEnd = (callback, threshold = 100) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceToBottom < threshold) {
        callback();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [callback, threshold]);

  return { containerRef };
};

/**
 * Hook para implementar debounce en búsquedas
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
