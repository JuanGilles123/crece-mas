# Utilidades de Compresión de Imágenes

## Descripción
Este módulo proporciona funciones para comprimir imágenes antes de subirlas a Supabase Storage, optimizando el rendimiento y reduciendo el uso de ancho de banda.

## Funciones Disponibles

### `compressImage(file, options)`
Función principal para comprimir imágenes con opciones personalizables.

**Parámetros:**
- `file`: Archivo de imagen original
- `options`: Objeto con opciones de compresión (opcional)

**Opciones por defecto:**
- `maxSizeMB`: 0.5 (máximo 500KB)
- `maxWidthOrHeight`: 800px
- `useWebWorker`: true
- `fileType`: 'image/jpeg'
- `initialQuality`: 0.8 (80%)

### `compressProductImage(file)`
Función optimizada para comprimir imágenes de productos.

**Configuración:**
- `maxSizeMB`: 0.3 (máximo 300KB)
- `maxWidthOrHeight`: 600px
- `fileType`: 'image/jpeg'
- `initialQuality`: 0.75 (75%)

### `compressAvatarImage(file)`
Función optimizada para comprimir imágenes de avatares de usuario.

**Configuración:**
- `maxSizeMB`: 0.2 (máximo 200KB)
- `maxWidthOrHeight`: 400px
- `fileType`: 'image/jpeg'
- `initialQuality`: 0.8 (80%)

## Beneficios

1. **Reducción de tamaño**: Las imágenes se comprimen hasta un 80-90% de su tamaño original
2. **Carga más rápida**: Las imágenes comprimidas se cargan mucho más rápido
3. **Menor uso de ancho de banda**: Reduce el consumo de datos
4. **Mejor experiencia de usuario**: Carga más fluida de la aplicación
5. **Optimización automática**: Convierte todas las imágenes a JPEG para mejor compresión

## Uso

```javascript
import { compressProductImage } from '../utils/imageCompression';

// Comprimir imagen antes de subir
const imagenComprimida = await compressProductImage(imagenOriginal);
```

## Logs
La función proporciona logs detallados en la consola:
- Tamaño original de la imagen
- Tamaño final después de la compresión
- Porcentaje de reducción logrado

## Dependencias
- `browser-image-compression`: Librería para compresión de imágenes en el navegador
