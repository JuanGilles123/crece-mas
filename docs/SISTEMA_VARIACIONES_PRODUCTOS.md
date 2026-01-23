# 🎯 Sistema de Variaciones/Opciones para Productos

## 📋 Resumen

Sistema para manejar productos con ingredientes/opciones variables (ej: Oblea Clásica con arequipe y salsa de mora o melocotón).

## 🎯 Caso de Uso

**Ejemplo: Oblea Clásica**
- **Arequipe**: Sí/No (opcional)
- **Salsa**: Mora / Melocotón / Ninguna (requerido)

## 🗄️ Estructura de Base de Datos

### 1. Tabla `productos` - Campo `metadata.variaciones_config`

```json
{
  "variaciones_config": [
    {
      "nombre": "Salsa",
      "opciones": ["Mora", "Melocotón", "Ninguna"],
      "requerido": true,
      "tipo": "select" // "select" o "checkbox"
    },
    {
      "nombre": "Arequipe",
      "opciones": ["Sí", "No"],
      "requerido": false,
      "tipo": "checkbox"
    }
  ]
}
```

### 2. Tabla `pedido_items` - Campo `variaciones_seleccionadas`

```json
{
  "Salsa": "Mora",
  "Arequipe": "Sí"
}
```

## 🔄 Flujo de Trabajo

### 1. **Configurar Variaciones en el Producto**
- Al crear/editar un producto de tipo "comida"
- Agregar variaciones en el campo `metadata.variaciones_config`
- Definir nombre, opciones, si es requerido, y tipo (select/checkbox)

### 2. **Seleccionar Variaciones al Agregar al Pedido**
- Cuando el usuario agrega un producto con variaciones
- Mostrar un modal/selector similar al de toppings
- Permitir seleccionar las opciones
- Validar que las variaciones requeridas estén seleccionadas

### 3. **Guardar en el Pedido**
- Guardar las selecciones en `variaciones_seleccionadas` (JSONB)
- Incluir en el objeto del item del pedido

### 4. **Mostrar en Cocina**
- En el panel de cocina, mostrar las variaciones seleccionadas
- Formato: "Oblea Clásica | Salsa: Mora, Arequipe: Sí"

## 📝 Implementación Propuesta

### Componentes Necesarios:

1. **VariacionesSelector.js** - Similar a ToppingsSelector
   - Recibe el producto y su configuración de variaciones
   - Muestra opciones según el tipo (select/checkbox)
   - Valida variaciones requeridas
   - Retorna las selecciones

2. **Modificaciones en TomarPedido.js**
   - Detectar si el producto tiene variaciones
   - Mostrar selector de variaciones antes de agregar
   - Guardar selecciones en el item

3. **Modificaciones en PanelCocina.js**
   - Mostrar variaciones seleccionadas en las tarjetas
   - Formato claro y visible

4. **Modificaciones en hooks**
   - Incluir `variaciones_seleccionadas` en las consultas
   - Guardar al crear pedido_items

## 🎨 Ejemplo Visual

**En Tomar Pedido:**
```
Producto: Oblea Clásica
┌─────────────────────────┐
│ Salsa (requerido):      │
│ ○ Mora                  │
│ ● Melocotón             │
│ ○ Ninguna               │
│                         │
│ ☑ Arequipe             │
└─────────────────────────┘
```

**En Panel Cocina:**
```
Oblea Clásica
Salsa: Melocotón | Arequipe: Sí
```

## ✅ Ventajas de esta Solución

1. **Flexible**: Permite cualquier tipo de variación
2. **Estructurado**: Datos en JSONB, fácil de consultar
3. **Escalable**: Fácil agregar más variaciones
4. **Claro en Cocina**: Las opciones se ven claramente
5. **Reutilizable**: Similar al sistema de toppings

## 🚀 Próximos Pasos

1. Ejecutar scripts SQL para agregar columnas
2. Crear componente VariacionesSelector
3. Integrar en flujo de TomarPedido
4. Mostrar en PanelCocina
5. Probar con ejemplo de Oblea Clásica
