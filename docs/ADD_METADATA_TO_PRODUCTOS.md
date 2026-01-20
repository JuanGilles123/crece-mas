# Agregar Columna Metadata a Productos

Este documento explica cómo agregar la columna `metadata` a la tabla `productos` para almacenar campos adicionales.

## ¿Por qué Metadata?

Los campos adicionales como `marca`, `modelo`, `color`, `talla`, `peso`, `dimensiones`, etc., no existen como columnas individuales en la tabla `productos`. En su lugar, se almacenan en un campo JSON llamado `metadata` para mantener la flexibilidad del sistema.

## Migración SQL

Ejecuta el siguiente SQL en el SQL Editor de Supabase:

```sql
-- Agregar columna metadata para campos adicionales de productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Actualizar el tipo para incluir los nuevos tipos de productos
ALTER TABLE productos 
DROP CONSTRAINT IF EXISTS productos_tipo_check;

ALTER TABLE productos 
ADD CONSTRAINT productos_tipo_check 
CHECK (tipo IN ('fisico', 'servicio', 'comida', 'accesorio'));

-- Comentarios para documentación
COMMENT ON COLUMN productos.metadata IS 'Campos adicionales del producto almacenados en formato JSON (marca, modelo, color, talla, peso, dimensiones, etc.)';
COMMENT ON COLUMN productos.tipo IS 'Tipo de producto: fisico (con stock), servicio (intangible), comida (alimenticio), accesorio (con peso/variables)';
```

## Pasos para Ejecutar

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Crea una nueva query
4. Copia y pega el SQL de arriba
5. Ejecuta la query

## Estructura del Metadata

El campo `metadata` almacenará un objeto JSON con los campos adicionales:

```json
{
  "marca": "Nike",
  "modelo": "Air Max 2024",
  "color": "Azul",
  "talla": "M",
  "peso": "0.5",
  "unidad_peso": "kg",
  "dimensiones": "10x5x3 cm",
  "material": "Algodón",
  "categoria": "Ropa",
  "ingredientes": "Harina, agua, sal",
  "alergenos": "Gluten",
  "calorias": "250",
  "porcion": "100g",
  "variaciones": "Tamaño: Pequeño, Mediano, Grande",
  "descripcion": "Descripción detallada",
  "duracion": "1 hora"
}
```

## Notas

- El campo `metadata` es opcional y puede estar vacío (`{}`)
- Solo se guardan los campos que el usuario completa
- Los campos se pueden consultar usando operadores JSON de PostgreSQL
- Ejemplo de consulta: `SELECT metadata->>'marca' as marca FROM productos WHERE metadata->>'marca' IS NOT NULL;`
