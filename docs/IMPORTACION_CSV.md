# 📊 Sistema de Importación de Productos por CSV

## Descripción
El sistema permite importar múltiples productos de una vez usando un archivo CSV, facilitando la gestión masiva del inventario.

## 🚀 Cómo Usar

### 1. Acceder a la Importación
- Ve a la sección **Inventario**
- Haz clic en el botón **"Importar CSV"**

### 2. Descargar la Plantilla
- Haz clic en **"📥 Descargar Plantilla"**
- Se descargará el archivo `plantilla_productos.csv`

### 3. Preparar tu Archivo CSV
- Abre la plantilla con Excel, Google Sheets o cualquier editor de texto
- Completa los datos de tus productos
- Guarda el archivo como CSV

### 4. Importar los Productos
- Haz clic en **"📁 Seleccionar archivo CSV"**
- Selecciona tu archivo CSV
- Revisa la vista previa
- Haz clic en **"📊 Importar Productos"**

## 📋 Formato del CSV

### Columnas Requeridas
| Columna | Descripción | Ejemplo | Requerido |
|---------|-------------|---------|-----------|
| `nombre` | Nombre del producto | "Camisa Polo Azul" | ✅ |
| `precio_compra` | Precio de compra | 25000 | ✅ |
| `precio_venta` | Precio de venta | 45000 | ✅ |
| `stock` | Cantidad en inventario | 10 | ✅ |

### Columnas Opcionales
| Columna | Descripción | Ejemplo | Requerido |
|---------|-------------|---------|-----------|
| `descripcion` | Descripción del producto | "Camisa de algodón 100%" | ❌ |
| `categoria` | Categoría del producto | "Ropa" | ❌ |

### Ejemplo de CSV
```csv
nombre,descripcion,precio_compra,precio_venta,stock,categoria
"Camisa Polo Azul","Camisa de algodón 100% color azul marino","25000","45000","10","Ropa"
"Zapatos Deportivos","Zapatos deportivos para running","80000","150000","5","Calzado"
"Pantalón Jeans","Pantalón de mezclilla clásico","40000","80000","8","Ropa"
```

## ⚠️ Reglas y Validaciones

### Validaciones Automáticas
- ✅ **Nombres únicos**: No se permiten productos duplicados
- ✅ **Precios válidos**: Deben ser números positivos
- ✅ **Stock válido**: Debe ser un número entero positivo
- ✅ **Formato correcto**: El archivo debe ser CSV válido

### Valores por Defecto
- **Descripción**: Vacía si no se especifica
- **Categoría**: "General" si no se especifica
- **Imagen**: null (se puede agregar después)

## 🔧 Procesamiento

### Lotes de Inserción
- Los productos se insertan en lotes de 10 para optimizar el rendimiento
- Si hay errores en un lote, se continúa con el siguiente

### Manejo de Errores
- **Errores de formato**: Se muestran en la interfaz
- **Errores de validación**: Se saltan los productos inválidos
- **Errores de base de datos**: Se reportan en el resultado

## 📊 Resultado de la Importación

### Estadísticas Mostradas
- **Total procesados**: Número total de filas en el CSV
- **Insertados**: Productos agregados exitosamente
- **Errores**: Productos que no se pudieron insertar

### Vista Previa
- Se muestran los primeros 5 productos importados
- Incluye nombre, precio y stock

## 🎯 Consejos para Mejor Resultado

### Preparación del Archivo
1. **Usa la plantilla**: Descarga siempre la plantilla oficial
2. **Revisa los datos**: Verifica precios y cantidades antes de importar
3. **Formato consistente**: Usa comillas para textos con espacios
4. **Sin caracteres especiales**: Evita caracteres que puedan causar problemas

### Mejores Prácticas
- **Importa en lotes pequeños**: Para archivos grandes, divídelos en partes
- **Revisa el resultado**: Siempre verifica las estadísticas de importación
- **Backup**: Mantén una copia de tus archivos CSV originales

## 🚨 Solución de Problemas

### Error: "Faltan columnas requeridas"
- **Causa**: El CSV no tiene las columnas obligatorias
- **Solución**: Usa la plantilla oficial y verifica los nombres de las columnas

### Error: "No se encontraron productos válidos"
- **Causa**: Todos los productos tienen datos inválidos
- **Solución**: Revisa que los precios y stock sean números válidos

### Error: "Error al procesar el archivo CSV"
- **Causa**: El archivo no es un CSV válido
- **Solución**: Guarda el archivo como CSV desde Excel/Google Sheets

### Productos no aparecen después de importar
- **Causa**: Los productos se insertaron pero no se recargó la vista
- **Solución**: Refresca la página o navega a otra sección y regresa

## 📱 Compatibilidad

### Formatos Soportados
- ✅ **CSV estándar**: Separado por comas
- ✅ **UTF-8**: Caracteres especiales y acentos
- ✅ **Comillas**: Textos con espacios

### Tamaño de Archivo
- **Recomendado**: Máximo 1000 productos por archivo
- **Máximo**: Sin límite técnico, pero se procesa en lotes

## 🔄 Actualizaciones Futuras

### Funcionalidades Planificadas
- 📸 **Importación de imágenes**: Desde URLs en el CSV
- 🔄 **Actualización masiva**: Modificar productos existentes
- 📊 **Plantillas personalizadas**: Diferentes formatos según el tipo de negocio
- 🏷️ **Etiquetas automáticas**: Generación automática de categorías

---

**¿Necesitas ayuda?** Contacta al soporte técnico si tienes problemas con la importación.
