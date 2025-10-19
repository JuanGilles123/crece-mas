# 📅 Guía: Control de Fechas de Vencimiento

## 🎯 Descripción
Sistema completo para gestionar fechas de vencimiento de productos, ideal para negocios de comida, farmac human, y productos perecederos.

---

## 🔧 Implementación

### 1. Base de Datos ✅

**Ejecuta el archivo:** `agregar_fecha_vencimiento.sql`

**¿Qué hace?**
- ✅ Agrega columna `fecha_vencimiento` a la tabla `productos`
- ✅ Crea índices para búsquedas rápidas
- ✅ Crea vistas automáticas:
  - `productos_proximos_vencer` - Productos que vencen en los próximos 7 días
  - `productos_vencidos` - Productos ya vencidos
- ✅ Función `get_vencimiento_stats(org_id)` para estadísticas

### 2. Formularios ✅

**Archivos modificados:**
- ✅ `AgregarProductoModal.js` - Campo de fecha agregado
- 🔄 `EditarProductoModal.js` - Pendiente de actualizar

**Campo agregado:**
```jsx
<label>Fecha de Vencimiento (Opcional)</label>
<input 
  type="date"
  name="fecha_vencimiento"
  min={hoy}  // No permite fechas pasadas
  placeholder="Seleccionar fecha"
/>
```

---

## 📋 Características Implementadas

### ✅ En el Formulario de Productos:
1. **Campo opcional** de fecha de vencimiento
2. **Validación**: No permite fechas pasadas
3. **Hint visual**: "Solo para productos perecederos"
4. **Guardado automático** en la base de datos

### 🔄 Próximas Mejoras (Recomendadas):

#### 1. **Alert de Productos Próximos a Vencer**
Mostrar banner en Inventario:
```jsx
// En Inventario.js
{proximosVencer.length > 0 && (
  <div className="alert-warning-vencimiento">
    ⚠️ {proximosVencer.length} producto(s) próximo a vencer
  </div>
)}
```

#### 2. **Badge de Estado en Tarjeta de Producto**
```jsx
{producto.fecha_vencimiento && (
  <span className={`badge-vencimiento ${getEstadoVencimiento(producto)}`}>
    {diasRestantes} días
  </span>
)}
```

#### 3. **Filtro en Inventario**
```jsx
<select onChange={filtrarPorVencimiento}>
  <option value="todos">Todos</option>
  <option value="proximos">Próximos a vencer (7 días)</option>
  <option value="vencidos">Vencidos</option>
  <option value="con_fecha">Con fecha de vencimiento</option>
</select>
```

#### 4. **Dashboard con Estadísticas**
```jsx
<div className="stats-vencimiento">
  <StatCard 
    titulo="Productos Vencidos" 
    valor={stats.vencidos} 
    color="red" 
  />
  <StatCard 
    titulo="Próximos a Vencer" 
    valor={stats.proximos_vencer} 
    color="yellow" 
  />
  <StatCard 
    titulo="Vencen Hoy" 
    valor={stats.vencen_hoy} 
    color="orange" 
  />
</div>
```

#### 5. **Notificaciones Automáticas**
- Email/Toast cuando un producto vence en 3 días
- Alert diario de productos vencidos
- Sugerencias de descuentos para productos próximos a vencer

---

## 🎨 Estilos CSS Sugeridos

```css
/* Badge de vencimiento */
.badge-vencimiento {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-vencimiento.vencido {
  background: #fee2e2;
  color: #dc2626;
}

.badge-vencimiento.proximo {
  background: #fef3c7;
  color: #d97706;
}

.badge-vencimiento.normal {
  background: #d1fae5;
  color: #059669;
}

/* Alert de vencimiento */
.alert-warning-vencimiento {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
```

---

## 📊 Queries Útiles

### Ver productos próximos a vencer:
```sql
SELECT * FROM productos_proximos_vencer 
WHERE organization_id = 'tu_org_id'
ORDER BY dias_restantes ASC;
```

### Ver productos vencidos:
```sql
SELECT * FROM productos_vencidos 
WHERE organization_id = 'tu_org_id';
```

### Obtener estadísticas:
```sql
SELECT get_vencimiento_stats('tu_org_id');
```

### Actualizar vencimiento masivo (por categoría):
```sql
UPDATE productos 
SET fecha_vencimiento = '2025-12-31'
WHERE categoria = 'lácteos' 
AND organization_id = 'tu_org_id';
```

---

## 🚀 Pasos para Activar

1. **Ejecutar SQL:**
   ```bash
   # En Supabase SQL Editor, ejecuta:
   agregar_fecha_vencimiento.sql
   ```

2. **Reiniciar aplicación:**
   ```bash
   npm start
   ```

3. **Probar:**
   - Ir a Inventario
   - Agregar nuevo producto
   - Llenar campo "Fecha de Vencimiento"
   - Guardar producto
   - Verificar que se guardó correctamente

---

## 🔍 Validación

Para verificar que todo funciona:

```javascript
// En la consola del navegador:
const { data } = await supabase
  .from('productos')
  .select('nombre, fecha_vencimiento')
  .not('fecha_vencimiento', 'is', null);

console.log('Productos con vencimiento:', data);
```

---

## 💡 Casos de Uso

### Restaurante:
- Ingredientes perecederos (carnes, vegetales, lácteos)
- Control de FIFO (First In, First Out)
- Alertas de productos próximos a vencer para promociones

### Farmacia:
- Medicamentos con fecha de caducidad
- Cumplimiento regulatorio
- Rotación de inventario por lotes

### Panadería:
- Productos frescos diarios
- Pan y pasteles con vencimiento corto
- Control de mermas

### Supermercado:
- Productos refrigerados
- Productos secos con fecha larga
- Gestión de ofertas por vencimiento

---

## ⚠️ Importante

- El campo es **OPCIONAL** - No afecta productos sin vencimiento
- Productos sin fecha seguirán funcionando normalmente
- Compatible con importación CSV (agregar columna opcional)
- No requiere migración de datos existentes

---

## 📞 Soporte

¿Necesitas ayuda para implementar las mejoras sugeridas?
- Alertas visuales
- Dashboard de vencimiento
- Notificaciones automáticas
- Reportes de productos vencidos

¡Avísame y te ayudo a implementarlas! 🚀
