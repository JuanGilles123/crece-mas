# ⚡ ARREGLA AHORA - 3 PASOS SIMPLES

## 🎯 Paso 1: Ejecutar SQL (2 minutos)

1. Abre: https://supabase.com/dashboard
2. Tu proyecto → **SQL Editor**
3. **New Query**
4. Copia y pega el archivo: **`fix_team_members_insert.sql`**
5. Click **Run** ▶️
6. Deberías ver: "✅ POLÍTICA INSERT CONFIGURADA"

---

## 🧹 Paso 2: Limpiar tu Navegador (30 segundos)

Abre la consola (F12) y pega esto:

```javascript
localStorage.clear();
window.location.href = '/login';
```

Presiona Enter. Te llevará al login limpio.

---

## 🧪 Paso 3: Probar de Nuevo (3 minutos)

### A. Crear invitación:
1. Inicia sesión con tu cuenta
2. Dashboard → **Equipo** → **Invitaciones**
3. Llena formulario:
   - Email: prueba@test.com (o cualquiera que NO hayas usado)
   - Rol: Administrador
   - Mensaje: "Test"
4. **Enviar Invitación**
5. Click **"Copiar Link"** 📋

### B. Aceptar invitación:
1. **Cierra sesión**
2. Abre **ventana incógnito** (Ctrl+Shift+N)
3. Pega el link que copiaste
4. Deberías ver página púrpura hermosa ✅
5. Click **"Crear Cuenta"**
6. Registra con el email que usaste
7. **Abre consola (F12)**
8. Deberías ver:
   ```
   🎯 Token de invitación detectado, auto-aceptando...
   📧 Invitación encontrada: {...}
   ✅ Invitación aceptada exitosamente!
   🔄 Recargando perfil...
   ✅ Navegando al dashboard...
   ```
9. Te lleva al dashboard ✅

---

## ✅ Si todo funciona verás:

- ✅ Dashboard de la organización a la que te invitaron
- ✅ Tu rol es "Administrador" (no owner)
- ✅ Puedes ver productos/ventas de esa organización
- ✅ Si tienes 2+ organizaciones, aparece el selector

---

## � ERROR CRÍTICO: Falta columna organization_id

## ❌ EL PROBLEMA

La base de datos **NO TIENE** la columna `organization_id` en las tablas:
- ❌ `productos` (falta organization_id)
- ❌ `ventas` (falta organization_id)

**Error exacto:**
```
column productos.organization_id does not exist
```

Por eso no aparecen los datos - ¡la estructura de la base de datos no está actualizada para multi-organización!

---

## ✅ SOLUCIÓN INMEDIATA

### 1️⃣ **Ejecuta el script SQL**

Ve a **Supabase** → **SQL Editor** → **New Query**

Copia y pega TODO el contenido del archivo:
```
agregar_organization_id.sql
```

Haz clic en **RUN** ▶️

---

## 📋 QUÉ HACE EL SCRIPT

1. **Agrega columnas** `organization_id` a `productos` y `ventas`
2. **Migra datos existentes** (asigna organization_id basado en user_id)
3. **Crea índices** para mejor rendimiento
4. **Agrega Foreign Keys** para integridad referencial
5. **Actualiza RLS policies** para soporte multi-organización
6. **Verifica** que todo esté correcto

---

## 🎯 DESPUÉS DE EJECUTAR

1. **Verás este mensaje:**
   ```
   ✅ MIGRACIÓN COMPLETADA
   ✅ Columnas organization_id agregadas
   ✅ Datos existentes migrados
   ```

2. **Recarga tu aplicación** (F5)

3. **Los datos aparecerán correctamente** 🎉

---

## 📊 ANTES vs DESPUÉS

### ANTES ❌
```sql
CREATE TABLE productos (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,  -- Solo por usuario
  nombre TEXT,
  ...
);
```

### DESPUÉS ✅
```sql
CREATE TABLE productos (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,  -- ¡NUEVO! Por organización
  nombre TEXT,
  ...
);
```

---

## 🔍 VERIFICAR QUE FUNCIONÓ

Después de ejecutar el script, en **Supabase SQL Editor** ejecuta:

```sql
-- Ver estructura actualizada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'productos'
ORDER BY ordinal_position;

-- Ver productos con organization_id
SELECT id, nombre, user_id, organization_id
FROM productos
LIMIT 5;
```

Deberías ver:
- ✅ Columna `organization_id` existe
- ✅ Todos los productos tienen `organization_id` asignado

---

## ⚠️ IMPORTANTE

**Este script es SEGURO:**
- ✅ No elimina datos
- ✅ Migra datos existentes automáticamente
- ✅ Verifica antes de hacer cambios
- ✅ Crea backups automáticos (Supabase)

**Pero si quieres ser extra cuidadoso:**

1. Ve a **Supabase** → **Table Editor** → **productos**
2. Haz clic en **Export CSV** para backup manual
3. Repite con tabla **ventas**
4. Ahora ejecuta el script con confianza

---

## 🚀 PROCESO COMPLETO

```
┌─────────────────────────────┐
│ 1. Abrir Supabase           │
│    SQL Editor               │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 2. Copiar contenido de      │
│    agregar_organization_id  │
│    .sql                     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 3. Pegar en SQL Editor      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 4. Hacer clic en RUN ▶️     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 5. Ver mensajes de éxito    │
│    ✅ Migración completada  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 6. Recargar app (F5)        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 7. ¡Funciona! 🎉            │
└─────────────────────────────┘
```

---

## 🎯 RESUMEN RÁPIDO

1. Abre Supabase SQL Editor
2. Pega `agregar_organization_id.sql`
3. Haz clic en RUN ▶️
4. Espera "✅ MIGRACIÓN COMPLETADA"
5. Recarga la app (F5)
6. **¡Los datos aparecen!** 🎉

---

**Este es el paso que faltaba para que el sistema multi-organización funcione.** 🔧

---
---
---

# 🚨 ARREGLO ANTERIOR: Problema con Invitaciones Públicas

### Error: "❌ Error creando team_member"
→ **No ejecutaste el SQL del Paso 1**  
→ Ve arriba y ejecuta `fix_team_members_insert.sql` ↑

### Página en blanco
→ Abre consola (F12) y busca errores rojos  
→ Compártelos para ayudarte

### "No se pudo cargar la invitación"
→ La invitación ya fue usada o expiró  
→ Crea una nueva invitación

---

## 🎉 Qué cambió:

**ANTES:**
- ❌ Usaba RPC function que podía fallar
- ❌ Pantalla en blanco si fallaba
- ❌ Difícil de debugear

**AHORA:**
- ✅ Inserción directa en `team_members`
- ✅ Logs claros en cada paso
- ✅ Navega al dashboard aunque falle
- ✅ Fácil de debugear

---

**¿Listo? Empieza por el Paso 1 ↑**

Si todo sale bien, en 5 minutos estará funcionando! 🚀
