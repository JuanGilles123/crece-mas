# 🔧 GUÍA DE INSTALACIÓN - Venta Rápida

## 📋 PASO 1: Inspeccionar la estructura actual

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo `inspeccion_ventas.sql`
3. Copia todo el contenido y pégalo en el SQL Editor
4. Haz clic en **RUN**
5. **COMPARTE EL RESULTADO** para que pueda ajustar el código si es necesario

## 📊 PASO 2: Ejecutar el script de actualización

Una vez confirmada la estructura:

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo `setup_ventas_rapidas.sql` (el actualizado)
3. Copia todo el contenido y pégalo
4. Haz clic en **RUN**
5. Deberías ver el mensaje: ✅ "Tabla ventas actualizada correctamente"

## ❓ PREGUNTAS PARA ENTENDER TU ESTRUCTURA

Mirando tu diagrama de base de datos, necesito confirmar:

### 1. ¿Cómo se registran las ventas en tu sistema actual?

**Opción A - Venta Simple (directo en tabla ventas)**
```
ventas:
- id
- user_id
- organization_id
- total
- metodo_pago
- fecha
```

**Opción B - Venta con Detalle (tabla intermedia)**
```
ventas:               ventas_detalle:
- id                  - id
- user_id             - venta_id (FK)
- organization_id     - producto_id (FK)
- total               - cantidad
- fecha               - precio_unitario
                      - subtotal
```

**Opción C - Venta con Items (otra variante)**
```
ventas:               ventas_items:
- id                  - id
- organization_id     - venta_id
- user_id             - producto_id
- fecha               - cantidad
                      - precio
```

### 2. ¿Qué columnas tiene actualmente tu tabla `ventas`?

Por favor ejecuta `inspeccion_ventas.sql` y comparte el resultado.

### 3. ¿Existe una tabla para los items/detalles de cada venta?

Mirando el diagrama veo:
- ✅ `ventas` (existe)
- ❓ `ventas_items` o `ventas_detalle` (¿existe?)
- ✅ `productos` (existe)
- ✅ `user_profiles` (existe)

## 🎯 AJUSTE SEGÚN TU ESTRUCTURA

### Si NO tienes tabla de detalle (Opción A):
→ El código actual de VentaRapida.js está **PERFECTO**
→ Solo ejecuta `setup_ventas_rapidas.sql`

### Si SÍ tienes tabla de detalle (Opción B o C):
→ Necesito ajustar VentaRapida.js para que:
1. Inserte en `ventas` (la cabecera)
2. Opcionalmente inserte en `ventas_detalle` con producto_id NULL

## 🔍 RESULTADO ESPERADO DE INSPECCIÓN

Después de ejecutar `inspeccion_ventas.sql`, deberías ver algo como:

```
column_name          | data_type | is_nullable
---------------------|-----------|-------------
id                   | uuid      | NO
organization_id      | uuid      | NO
user_id              | uuid      | NO
total                | numeric   | NO
metodo_pago          | text      | YES
fecha                | timestamp | NO
...
```

**Comparte este resultado y ajustaré el código si es necesario.**

## ⚠️ NOTA IMPORTANTE

El error que obtuviste:
```
ERROR: 42703: column "producto_id" of relation "ventas" does not exist
```

Confirma que tu tabla `ventas` **NO tiene** la columna `producto_id`. Esto significa:

1. ✅ Las ventas se registran directamente en la tabla `ventas` 
2. ✅ NO necesitas relación con productos para ventas rápidas
3. ✅ El código actual debería funcionar DESPUÉS de agregar las columnas `tipo_venta` y `descripcion`

## 🚀 SIGUIENTE PASO

**Ejecuta `inspeccion_ventas.sql` y compárteme:**
1. La lista completa de columnas de la tabla `ventas`
2. Si existe alguna tabla `ventas_items`, `ventas_detalle`, o similar
3. Un ejemplo de cómo se ve un registro de venta actual

Con esa información, confirmaré que el script SQL es correcto o lo ajustaré.
