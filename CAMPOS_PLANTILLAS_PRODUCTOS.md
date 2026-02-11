# Campos de las Plantillas de Productos

Este documento describe los nombres de campos que deben usarse en las plantillas de importación (CSV y Excel) para mantener consistencia con el modal de creación de productos.

**⚠️ IMPORTANTE:** 
- Los nombres de las columnas deben ser EXACTAMENTE como aparecen en el modal (con mayúsculas, acentos y espacios)
- El orden de las columnas coincide exactamente con el orden en que se presentan en el modal de "Agregar Producto"

## Plantilla General (Todos los tipos de negocio)

### Orden de columnas (nombres exactos del modal):

1. `Código` - Código del producto
2. `Nombre` - Nombre del producto  
3. `Tipo` - Tipo de producto (fisico/servicio/comida/accesorio)
4. `Precio de Compra` - Precio de compra *
5. `Precio de Venta` - Precio de venta *
6. `Stock` - Cantidad en inventario *
7. `Umbral de stock bajo` - Umbral de stock bajo (opcional)
8. `Permitir agregar toppings/adicionales` - Permitir adicionales (si/no, true/false, 1/0)
9. `Imagen` - URL o ruta de imagen

### Campos opcionales (paso 2 del modal):
10. `Categoría` - Categoría del producto
11. `Descripción` - Descripción del producto
12. `Peso` - Peso del producto
13. `Unidad de Peso` - Unidad de peso (kg/g/lb/oz)
14. `Dimensiones (L x A x H)` - Dimensiones
15. `Marca` - Marca del producto
16. `Modelo` - Modelo del producto
17. `Color` - Color del producto
18. `Talla` - Talla del producto
19. `Material` - Material del producto
20. `Fecha de Vencimiento` - Fecha de vencimiento
21. `Duración del Servicio` - Duración del servicio (ej: "1 hora")
22. `Ingredientes` - Lista de ingredientes
23. `Alérgenos` - Alérgenos del producto
24. `Calorías` - Calorías por porción
25. `Porción` - Tamaño de la porción

### Campos para variantes (final):
26. `Variante Nombre` - Nombre de la variante (ej: "Tono 01", "Talla M")
27. `Variante Código` - Código de barras de la variante
28. `Variante Stock` - Stock de la variante

**Nota:** Los campos marcados con * son requeridos según el tipo de producto.

---

## Plantilla para Joyería y Metales

**⚠️ IMPORTANTE:** Los nombres son EXACTAMENTE como aparecen en el modal.

### Orden de columnas (nombres exactos del modal de joyería):

1. `Código` - Código del producto
2. `Nombre` - Nombre del producto
3. `Tipo` - Tipo de producto (generalmente "accesorio")
4. `Peso` - **REQUERIDO** para joyería (peso en gramos u otra unidad)
5. `Unidad de Peso` - Unidad de peso (g/kg/lb/oz)
6. `Pureza` - Pureza del metal (24k, 22k, 18k, 14k, 10k, 925, 950)
7. `Precio de Compra` - **REQUERIDO** - Precio de compra por unidad de peso
8. `Tipo de precio` - Modo de cálculo del precio (fixed/variable)
9. `Precio de Venta` - Precio de venta (opcional si Tipo de precio = variable)
10. `Tipo de material` - Tipo de material (local/international/na)
11. `Margen mínimo (%)` - Margen mínimo en moneda (ej: 15000)
12. `Cómo definir el precio estático` - Para precio fijo (fixed/percent)
13. `Porcentaje sobre compra (%)` - Porcentaje de margen (ej: 25 para 25%)
14. `Stock` - Cantidad en inventario
15. `Umbral de stock bajo` - Umbral de stock bajo
16. `Permitir agregar toppings/adicionales` - Permitir adicionales (si/no)
17. `Imagen` - URL o ruta de imagen

### Campos opcionales adicionales (paso 2 del modal):
18. `Categoría` - Categoría del producto
19. `Descripción` - Descripción del producto
20. `Material` - Material del producto (Oro, Plata, etc.)
21. `Talla` - Talla o tamaño
22. `Color` - Color del producto
23. `Marca` - Marca del producto
24. `Modelo` - Modelo del producto
25. `Fecha de Vencimiento` - Fecha de vencimiento

### Campos para variantes (final):
26. `Variante Nombre` - Nombre de la variante
27. `Variante Código` - Código de barras de la variante
28. `Variante Stock` - Stock de la variante

### Valores válidos para campos de joyería:

**Tipo de precio:**
- `fixed` - Precio fijo/estático
- `variable` - Precio variable por peso

**Tipo de material:**
- `local` - Material nacional
- `international` - Material internacional  
- `na` - No aplica

**Cómo definir el precio estático:**
- `fixed` - Valor específico
- `percent` - Porcentaje sobre compra

**Pureza (opciones):**
- `24k`, `22k`, `18k`, `14k`, `10k` - Para oro
- `925`, `950` - Para plata

### Notas importantes para joyería:
1. El campo `Precio de Venta` es **opcional** si `Tipo de precio = variable`
2. Si `Tipo de precio = variable`, el precio de venta se calcula automáticamente basado en:
   - Precio actual del oro (configurado en preferencias)
   - Peso del producto
   - Pureza (si aplica y `Tipo de material = international`)
   - Margen mínimo
3. Si `Tipo de precio = fixed`, el precio de venta es fijo y puede ser:
   - Un valor específico ingresado manualmente (`Cómo definir el precio estático = fixed`)
   - Calculado como porcentaje sobre el precio de compra (`Cómo definir el precio estático = percent`)
4. **Los nombres de las columnas deben escribirse EXACTAMENTE como aparecen en el modal** (con mayúsculas, acentos y espacios)
5. **El orden de las columnas es fundamental** - debe coincidir con el modal para facilitar el llenado

---

## Orden de campos - Resumen Visual

### 📋 Plantilla General
```
Paso 1 (Básico):
Código → Nombre → Tipo → Precio de Compra → Precio de Venta → Stock → 
Umbral de stock bajo → Permitir agregar toppings/adicionales → Imagen

Paso 2 (Opcionales):
Categoría → Descripción → Peso → Unidad de Peso → Dimensiones (L x A x H) → 
Marca → Modelo → Color → Talla → Material → Fecha de Vencimiento → 
Duración del Servicio → Ingredientes → Alérgenos → Calorías → Porción

Paso 3 (Variantes):
Variante Nombre → Variante Código → Variante Stock
```

### 💎 Plantilla Joyería
```
Paso 1 (Básico + Joyería):
Código → Nombre → Tipo → Peso → Unidad de Peso → Pureza → Precio de Compra → 
Tipo de precio → Precio de Venta → Tipo de material → Margen mínimo (%) → 
Cómo definir el precio estático → Porcentaje sobre compra (%) → Stock → 
Umbral de stock bajo → Permitir agregar toppings/adicionales → Imagen

Paso 2 (Opcionales):
Categoría → Descripción → Material → Talla → Color → Marca → Modelo → 
Fecha de Vencimiento

Paso 3 (Variantes):
Variante Nombre → Variante Código → Variante Stock
```

---

## Compatibilidad con nombres en inglés

El sistema también acepta los nombres antiguos en inglés para **retrocompatibilidad**:

- `jewelry_price_mode` → `modo_precio_joyeria`
- `jewelry_material_type` → `tipo_material_joyeria`
- `jewelry_min_margin` → `margen_minimo_joyeria`  
- `jewelry_static_mode` → `modo_estatico_joyeria`
- `jewelry_static_percent` → `porcentaje_estatico_joyeria`

**Recomendación:** Usar los nombres en español en las plantillas nuevas.

---

## Correspondencia con campos del modal

**✨ Los nombres en las plantillas son EXACTAMENTE iguales a como aparecen en el modal (con mayúsculas, acentos y espacios).**

El orden de las columnas en las plantillas coincide EXACTAMENTE con el orden del modal.

Tabla de correspondencia mostrando el orden exacto:

| Orden | Nombre en Plantilla CSV/Excel | Aparece en el Modal como | Paso |
|-------|------------------------------|--------------------------|------|
| 1 | `Código` | Código | Paso 1 |
| 2 | `Nombre` | Nombre | Paso 1 |
| 3 | `Tipo` | (inferido del tipo de negocio) | - |
| 4 | `Peso` * | Peso | Paso 1 (joyería) |
| 5 | `Pureza` * | Pureza | Paso 1 (joyería) |
| 6 | `Precio de Compra` | Precio de Compra | Paso 1 |
| 7 | `Precio de Venta` | Precio de Venta | Paso 1 |
| 8 | `Stock` | Stock | Paso 1 |
| 9 | `Umbral de stock bajo` | Umbral de stock bajo | Paso 1 |
| 10 | `Permitir agregar toppings/adicionales` | Permitir agregar toppings/adicionales a este producto | Paso 1 |
| 11 | `Imagen` | Imagen del Producto | Paso 1 |
| 12+ | `Categoría`, `Descripción`, etc. | Campos opcionales | Paso 2 |
| Final | `Variante Nombre`, etc. | Variantes con stock | Paso 2 |

**Campos específicos de joyería (aparecen después de Código y Nombre):**

| Nombre en Plantilla | Aparece en el Modal como |
|--------------------|--------------------------|
| `Peso` | Peso |
| `Unidad de Peso` | (no visible, se infiere por configuración) |
| `Pureza` | Pureza |
| `Tipo de precio` | Tipo de precio |
| `Tipo de material` | Tipo de material |
| `Margen mínimo (%)` | Margen mínimo (%) |
| `Cómo definir el precio estático` | Cómo definir el precio estático |
| `Porcentaje sobre compra (%)` | Porcentaje sobre compra (%) |

**Nota:** `*` indica campos que solo aparecen para tipo de negocio joyería.

---

## Actualización de plantillas Excel

Las plantillas Excel existentes deben actualizarse manualmente para:
1. Usar los nombres en español
2. **Mantener el mismo orden de columnas que las plantillas CSV**

### Archivos a actualizar:
- `/public/templates/plantilla-importacion-productos-joyeria.xlsx`
- `/public/templates/plantilla-importacion-productos.xlsx`
- `/public/templates/plantilla_con_imagenes.xlsx` (si se usa)

### Cambios requeridos:

1. **Reordenar columnas** según el orden indicado en este documento
2. **Renombrar encabezados** de inglés a español:
   - `jewelry_price_mode` → `modo_precio_joyeria`
   - `jewelry_material_type` → `tipo_material_joyeria`
   - `jewelry_min_margin` → `margen_minimo_joyeria`
   - `jewelry_static_mode` → `modo_estatico_joyeria`
   - `jewelry_static_percent` → `porcentaje_estatico_joyeria`

3. **Agregar listas desplegables** (validación de datos) para:
   - `tipo`: fisico, servicio, comida, accesorio
   - `unidad_peso`: g, kg, lb, oz
   - `pureza`: 24k, 22k, 18k, 14k, 10k, 925, 950
   - `modo_precio_joyeria`: fixed, variable
   - `tipo_material_joyeria`: local, international, na
   - `modo_estatico_joyeria`: fixed, percent
   - `permite_toppings`: si, no, true, false, 1, 0

4. **Proteger la primera fila** (encabezados) para evitar modificaciones accidentales

### Beneficio de usar el mismo orden:
- Facilita el llenado: el usuario puede seguir el modal mientras llena la plantilla
- Reduce errores: menos confusión sobre qué campo va en qué columna
- Mejor experiencia: coherencia total entre modal y plantilla
