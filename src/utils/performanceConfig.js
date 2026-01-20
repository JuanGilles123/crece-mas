// Configuración de optimización de performance

// Configuración de cache
export const CACHE_CONFIG = {
  // Tiempos de cache por tipo de dato
  PRODUCTOS: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  },
  VENTAS: {
    staleTime: 3 * 60 * 1000, // 3 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
  },
  USUARIOS: {
    staleTime: 15 * 60 * 1000, // 15 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  },
  ORGANIZACIONES: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    cacheTime: 60 * 60 * 1000, // 1 hora
  },
};

// Configuración de paginación
export const PAGINATION_CONFIG = {
  PRODUCTOS: 50,
  VENTAS: 100,
  USUARIOS: 20,
};

// Configuración de debounce para búsquedas
export const DEBOUNCE_CONFIG = {
  SEARCH: 300, // ms
  INPUT: 500, // ms
};

// Configuración de lazy loading de imágenes
export const IMAGE_CONFIG = {
  LAZY_LOAD: true,
  BLUR_PLACEHOLDER: true,
  QUALITY: 80,
  MAX_WIDTH: 800,
  MAX_HEIGHT: 800,
};

// Configuración de queries optimizadas
export const QUERY_CONFIG = {
  // Campos mínimos por tabla
  PRODUCTOS_FIELDS: 'id, nombre, precio_venta, precio_compra, stock, imagen, codigo, organization_id, created_at, tipo, metadata',
  VENTAS_FIELDS: 'id, total, metodo_pago, created_at, items, usuario_nombre, organization_id',
  USUARIOS_FIELDS: 'id, email, nombre, rol, organization_id, created_at',
};

// Función para optimizar queries
export const optimizeQuery = (query, fields) => {
  if (fields) {
    return query.select(fields);
  }
  return query;
};

// Función de debounce
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Función para comprimir imágenes
export const compressImage = async (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
          },
          'image/jpeg',
          quality
        );
      };
    };
  });
};

// Performance monitoring
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
};

export const measureAsyncPerformance = async (name, fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
};
