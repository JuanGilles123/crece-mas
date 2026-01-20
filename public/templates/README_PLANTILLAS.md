# 📊 Plantillas de Importación de Productos

## 📁 Archivos Disponibles

### Excel (Recomendado)
- **`plantilla-importacion-productos.xlsx`** - Plantilla completa con todos los campos

### CSV
- **`plantilla_productos.csv`** - Plantilla básica en formato CSV
- **`plantilla_simple.csv`** - Plantilla simplificada
- **`plantilla_test.csv`** - Plantilla de prueba

---

## 📋 Estructura de la Plantilla Excel

### Campos Obligatorios (*)

Estos campos son **obligatorios para TODOS** los tipos de productos:

1. **CODIGO *** - Código único del producto (máx 50 caracteres)
   - Si está vacío, se generará automáticamente
   - Ejemplo: `PROD-001`, `SERV-001`, `FOOD-001`

2. **NOMBRE *** - Nombre del producto (máx 100 caracteres)
   - Ejemplo: `Camiseta Básica`, `Consulta Médica`

3. **TIPO *** - Tipo de producto (debe ser exactamente uno de estos):
   - `fisico` - Producto físico con inventario
   - `servicio` - Servicio intangible
   - `comida` - Producto alimenticio
   - `accesorio` - Accesorio con peso/variables

4. **PRECIO VENTA *** - Precio de venta (número sin puntos ni comas)
   - Ejemplo: `25000` para $25.000

### Campos Condicionales (**)

Estos campos son obligatorios **según el tipo de producto**:

5. **PRECIO COMPRA **
   - ✅ Obligatorio para: `fisico`, `comida`, `accesorio`
   - ❌ Opcional para: `servicio`
   - Ejemplo: `15000` para $15.000

6. **STOCK **
   - ✅ Obligatorio para: `fisico`, `comida`
   - ⚠️ Opcional para: `accesorio`
   - ❌ No aplica para: `servicio`
   - Ejemplo: `50` (número entero)

### Campos Opcionales

Estos campos pueden dejarse vacíos:

7. **IMAGEN (OPCIONAL)** - URL de la imagen del producto
   - Ejemplo: `https://ejemplo.com/imagen.jpg`
   - O dejar vacío

8. **FECHA VENCIMIENTO (OPCIONAL)** - Fecha de vencimiento
   - Formato: `YYYY-MM-DD`
   - Ejemplo: `2024-12-31`

9. **PESO (OPCIONAL)** - Peso del producto
   - Ejemplo: `0.5`, `10`, `250`

10. **UNIDAD PESO (OPCIONAL)** - Unidad de peso
    - Valores: `kg`, `g`, `lb`, `oz`

11. **DIMENSIONES (OPCIONAL)** - Dimensiones del producto
    - Ejemplo: `10x5x3 cm`, `30x40x5 cm`

12. **MARCA (OPCIONAL)** - Marca del producto
    - Ejemplo: `Nike`, `Samsung`

13. **MODELO (OPCIONAL)** - Modelo del producto
    - Ejemplo: `Air Max 2024`, `Galaxy S24`

14. **COLOR (OPCIONAL)** - Color del producto
    - Ejemplo: `Azul`, `Rojo, Negro`

15. **TALLA (OPCIONAL)** - Talla del producto
    - Ejemplo: `S`, `M`, `L`, `XL`

16. **MATERIAL (OPCIONAL)** - Material del producto
    - Ejemplo: `Algodón`, `Oro 18k`

17. **CATEGORIA (OPCIONAL)** - Categoría del producto
    - Ejemplo: `Ropa`, `Electrónica`, `Comida Rápida`

18. **DURACION (OPCIONAL)** - Duración del servicio (solo para servicios)
    - Ejemplo: `30 minutos`, `1 hora`

19. **DESCRIPCION (OPCIONAL)** - Descripción detallada
    - Texto libre

20. **INGREDIENTES (OPCIONAL)** - Ingredientes (solo para comida)
    - Ejemplo: `Pan, Carne, Lechuga, Tomate, Queso`

21. **ALERGENOS (OPCIONAL)** - Alérgenos presentes (solo para comida)
    - Ejemplo: `Gluten, Lactosa, Frutos secos`

22. **CALORIAS (OPCIONAL)** - Cantidad de calorías (solo para comida)
    - Ejemplo: `450`

23. **PORCION (OPCIONAL)** - Tamaño de porción (solo para comida)
    - Ejemplo: `1 unidad`, `100g`

24. **VARIACIONES (OPCIONAL)** - Variaciones disponibles
    - Ejemplo: `Tamaño: Pequeño, Mediano, Grande`

---

## 📝 Ejemplos por Tipo de Producto

### Producto Físico (`fisico`)
```
CODIGO * | NOMBRE * | TIPO * | PRECIO VENTA * | PRECIO COMPRA ** | STOCK ** | ...
PROD-001 | Camiseta | fisico | 25000          | 15000           | 50       | ...
```

### Servicio (`servicio`)
```
CODIGO * | NOMBRE * | TIPO * | PRECIO VENTA * | PRECIO COMPRA ** | STOCK ** | DURACION (OPCIONAL) | ...
SERV-001 | Consulta | servicio | 50000        | (vacío)         | (vacío)  | 30 minutos          | ...
```

### Comida (`comida`)
```
CODIGO * | NOMBRE * | TIPO * | PRECIO VENTA * | PRECIO COMPRA ** | STOCK ** | INGREDIENTES (OPCIONAL) | ...
FOOD-001 | Hamburguesa | comida | 15000      | 8000            | 20       | Pan, Carne, Lechuga    | ...
```

### Accesorio (`accesorio`)
```
CODIGO * | NOMBRE * | TIPO * | PRECIO VENTA * | PRECIO COMPRA ** | STOCK ** | PESO (OPCIONAL) | ...
ACC-001 | Collar Oro | accesorio | 500000     | 400000          | 5        | 10              | ...
```

---

## ✅ Validaciones

- ✅ El precio de venta debe ser mayor o igual al precio de compra
- ✅ El stock debe ser un número positivo o 0
- ✅ Los campos obligatorios NO pueden estar vacíos
- ✅ El tipo debe ser exactamente: `fisico`, `servicio`, `comida` o `accesorio`
- ✅ La fecha de vencimiento debe estar en formato `YYYY-MM-DD`

---

## 🔄 Regenerar la Plantilla

Si necesitas regenerar la plantilla con los últimos cambios:

```bash
npm run generar-plantilla-excel
```

Esto actualizará el archivo `public/templates/plantilla-importacion-productos.xlsx`

---

## 📖 Uso

1. Descarga la plantilla Excel desde el sistema
2. Abre el archivo en Excel o Google Sheets
3. Completa los datos siguiendo los ejemplos
4. Guarda el archivo como `.xlsx`
5. Importa el archivo desde el sistema

---

**Última actualización:** 2024
