# 🍔 Cómo Usar el Sistema de Toppings

## 📋 Requisitos Previos

1. ✅ **Ejecutar migración SQL** en Supabase
2. ✅ **Tipo de negocio configurado** como "Comida"
3. ✅ **Suscripción premium** (Profesional, Empresarial o Custom)

---

## 🚀 Pasos para Habilitar Toppings

### Paso 1: Ejecutar Migración SQL

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Abre el **SQL Editor** (menú lateral izquierdo)
3. Crea una nueva query
4. Copia y pega el contenido completo de `docs/CREATE_TOPPINGS_TABLE.sql`
5. Haz clic en **Run** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
6. Verifica que aparezca el mensaje de éxito

**Verificar que funcionó:**
- Ve a **Table Editor** en Supabase
- Deberías ver la tabla `toppings` en la lista

### Paso 2: Configurar Tipo de Negocio

1. En la aplicación, ve a **Dashboard → Configuración → Configuración de Facturación**
2. Busca el campo **"Tipo de Negocio"**
3. Selecciona **"🍔 Comida"** del menú desplegable
4. Haz clic en **"Guardar Cambios"**
5. **Recarga la página** (F5 o Cmd+R)

### Paso 3: Verificar Suscripción

- Debes tener una suscripción **Profesional**, **Empresarial** o **Custom**
- Si tienes plan Gratis, necesitas actualizar a un plan premium
- Ve a **Dashboard → Suscripción** para verificar tu plan actual

---

## 🎯 Cómo Usar Toppings

### Crear Toppings (Inventario)

1. Ve a **Dashboard → Inventario**
2. Busca el botón **"Gestionar Toppings 🍔"** (debería aparecer después de los filtros)
3. Haz clic en el botón para expandir la sección
4. Haz clic en **"Nuevo Topping"**
5. Completa el formulario:
   - **Nombre**: Ej: "Queso", "Tocino", "Lechuga"
   - **Precio Adicional**: Precio en COP que se suma al producto
   - **Stock Inicial**: Cantidad disponible
6. Haz clic en **"Crear"**

### Usar Toppings en Ventas (Caja)

1. Ve a **Dashboard → Caja**
2. Agrega un producto al carrito haciendo clic en él
3. **Aparecerá un modal** preguntando: **"¿Lleva toppings?"**
4. Si seleccionas **"Sí"**:
   - Verás una lista de toppings disponibles (solo los que tienen stock)
   - Selecciona los toppings que quieras (puedes seleccionar múltiples)
   - Ajusta la cantidad de cada topping con los botones +/-
   - Verás el precio total actualizado en tiempo real
5. Haz clic en **"Agregar al carrito"**
6. El producto se agregará con los toppings seleccionados
7. En el carrito verás:
   ```
   Hamburguesa
   + Queso x1, + Tocino x2
   $20,000 c/u
   ```

### Ver Toppings en el Carrito

- Los toppings aparecen debajo del nombre del producto
- El precio mostrado incluye el producto + toppings
- El total se calcula automáticamente

### Actualización de Stock

- Al completar una venta, el stock de toppings se actualiza automáticamente
- Solo se muestran toppings con stock > 0 en el selector
- Si un topping se queda sin stock, no aparecerá en la lista hasta que agregues más

---

## 🔍 Verificar que Todo Funciona

### Checklist de Verificación

- [ ] Tabla `toppings` creada en Supabase
- [ ] Tipo de negocio configurado como "Comida"
- [ ] Tienes suscripción premium activa
- [ ] Botón "Gestionar Toppings" visible en Inventario
- [ ] Modal de toppings aparece al agregar producto en Caja
- [ ] Los toppings se muestran en el carrito
- [ ] El stock se actualiza después de la venta

### Si No Aparece la Opción

1. **Verifica la consola del navegador** (F12) por errores
2. **Recarga la página** después de cambiar el tipo de negocio
3. **Verifica en Supabase** que la tabla `toppings` existe
4. **Confirma tu suscripción** en Dashboard → Suscripción
5. **Limpia la caché** del navegador (Ctrl+Shift+R o Cmd+Shift+R)

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Hamburguesa con Toppings

1. Producto: "Hamburguesa" - $15,000
2. Toppings seleccionados:
   - Queso ($2,000) x1
   - Tocino ($3,000) x1
3. **Precio total**: $20,000

### Ejemplo 2: Pizza Personalizada

1. Producto: "Pizza Personal" - $25,000
2. Toppings seleccionados:
   - Queso Extra ($3,000) x2
   - Champiñones ($2,000) x1
   - Aceitunas ($1,500) x1
3. **Precio total**: $34,500

---

## 🆘 Solución de Problemas

### Error: "No se puede crear topping"
- Verifica que tengas permisos de owner o admin
- Revisa la consola del navegador para más detalles

### Error: "Toppings no disponibles"
- Verifica que el tipo de negocio sea "Comida"
- Confirma que tienes suscripción premium
- Recarga la página

### Los toppings no aparecen en el selector
- Verifica que los toppings tengan stock > 0
- Confirma que están marcados como "activos"
- Revisa que el tipo de negocio esté configurado correctamente

---

**¿Necesitas ayuda?** Revisa los logs en la consola del navegador o contacta al soporte.

