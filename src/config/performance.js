// Configuración de rendimiento para el sistema
export const PERFORMANCE_CONFIG = {
  // Configuración de paginación
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    MAX_PAGE_SIZE: 100
  },

  // Configuración de búsqueda
  SEARCH: {
    MIN_SEARCH_LENGTH: 2,
    DEBOUNCE_MS: 300,
    MAX_SEARCH_RESULTS: 50
  },

  // Configuración de cache
  CACHE: {
    PRODUCTOS_STALE_TIME: 2 * 60 * 1000, // 2 minutos
    PRODUCTOS_CACHE_TIME: 5 * 60 * 1000, // 5 minutos
    SEARCH_STALE_TIME: 1 * 60 * 1000, // 1 minuto
    SEARCH_CACHE_TIME: 2 * 60 * 1000 // 2 minutos
  },

  // Configuración de infinite scroll
  INFINITE_SCROLL: {
    THRESHOLD: 200, // px desde el final para cargar más
    ROOT_MARGIN: '200px'
  },

  // Configuración de imágenes
  IMAGES: {
    MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
    COMPRESSION_QUALITY: 0.8,
    THUMBNAIL_SIZE: 200
  },

  // Configuración de límites
  LIMITS: {
    MAX_PRODUCTS_PER_USER: 10000,
    MAX_PRODUCTS_PER_PAGE: 100,
    MAX_SEARCH_RESULTS: 100
  }
};

// Función para determinar si usar paginación o infinite scroll
export const shouldUsePagination = (totalItems, userPreference = 'auto') => {
  if (userPreference === 'pagination') return true;
  if (userPreference === 'infinite') return false;
  
  // Auto: usar paginación si hay más de 100 items
  return totalItems > 100;
};

// Función para calcular el tamaño de página óptimo
export const getOptimalPageSize = (totalItems, deviceType = 'desktop') => {
  const baseSize = deviceType === 'mobile' ? 10 : 20;
  
  if (totalItems < 50) return Math.min(baseSize, totalItems);
  if (totalItems < 200) return baseSize;
  if (totalItems < 1000) return baseSize * 2;
  
  return baseSize * 3;
};

// Función para determinar si mostrar skeleton loading
export const shouldShowSkeleton = (isLoading, hasData) => {
  return isLoading && !hasData;
};

// Configuración de React Query por defecto
export const DEFAULT_QUERY_OPTIONS = {
  staleTime: PERFORMANCE_CONFIG.CACHE.PRODUCTOS_STALE_TIME,
  cacheTime: PERFORMANCE_CONFIG.CACHE.PRODUCTOS_CACHE_TIME,
  retry: 1,
  refetchOnWindowFocus: false,
  keepPreviousData: true
};
