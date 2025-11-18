# 🍔 Setup de Tabla de Toppings

Este documento explica cómo crear la tabla de toppings en Supabase.

## 📋 Requisitos

- Proyecto de Supabase configurado
- Acceso a tu proyecto de Supabase

## 🚀 Opción 1: Usando Supabase CLI (Recomendado)

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Vincular tu proyecto (si no lo has hecho)

```bash
supabase link --project-ref [TU_PROJECT_REF]
```

Puedes encontrar tu `PROJECT_REF` en:
- Supabase Dashboard → Settings → General → Reference ID

### 3. Ejecutar el script

```bash
npm run setup-toppings
```

O directamente:

```bash
./setup-toppings.sh
```

## 🚀 Opción 2: Manualmente en Supabase Dashboard

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Abre **SQL Editor** (en el menú lateral)
4. Copia el contenido completo de `docs/CREATE_TOPPINGS_TABLE.sql`
5. Pega el SQL en el editor
6. Haz clic en **Run** o presiona `Ctrl+Enter` (Windows/Linux) o `Cmd+Enter` (Mac)

## 🚀 Opción 3: Usando psql directamente

Si tienes acceso directo a la base de datos:

```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" -f docs/CREATE_TOPPINGS_TABLE.sql
```

## 🔍 Ver Políticas Actuales (RECOMENDADO)

**⚠️ IMPORTANTE:** Antes de crear nuevas políticas, es recomendable ver las políticas existentes para no dañar nada.

### Ver políticas de storage actuales:

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Abre **SQL Editor**
4. Copia y pega el contenido de `docs/VER_POLITICAS_STORAGE.sql`
5. Ejecuta el SQL para ver las políticas actuales del bucket `productos`

### Ver políticas de la tabla toppings:

1. En el mismo **SQL Editor**
2. Copia y pega el contenido de `docs/VER_POLITICAS_TABLA_TOPPINGS.sql`
3. Ejecuta el SQL para ver las políticas actuales de la tabla `toppings`

## 🔐 Configurar Políticas de Storage (IMPORTANTE)

**⚠️ CRÍTICO:** Después de crear la tabla, debes configurar las políticas de storage para permitir subir imágenes de toppings.

### Opción A: Desde Dashboard (RECOMENDADO - Más Fácil)

Si tienes políticas existentes y no tienes permisos de owner en SQL, usa el Dashboard:

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Storage** → Click en bucket **`productos`** → Pestaña **Policies**
4. Sigue las instrucciones detalladas en `docs/CONFIGURAR_POLITICAS_STORAGE_DASHBOARD.md`

Este método es más visual y no requiere permisos especiales de SQL.

### Opción B: Desde SQL Editor (Requiere permisos de owner)

Si tienes permisos de owner y prefieres usar SQL:

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Abre **SQL Editor** (desde el Dashboard, no desde conexión externa)
4. Copia y pega el contenido de `docs/AGREGAR_POLITICAS_TOPPINGS_V2.sql`
5. Ejecuta el SQL

**Nota:** 
- Si obtienes el error "must be owner of relation objects", verifica:
  - Que eres el owner del proyecto (Settings → General)
  - Que estás ejecutando desde el SQL Editor del Dashboard (no desde conexión externa)
  - Si el error persiste, usa la Opción A (Dashboard) o consulta `docs/SOLUCION_PERMISOS_STORAGE.md`

### Opción B: Si no tienes políticas de storage

Si no tienes políticas configuradas, puedes usar el SQL completo:

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Abre **SQL Editor**
4. Copia y pega el contenido de `docs/SETUP_STORAGE_POLICIES.sql`
5. Ejecuta el SQL

O desde la terminal:

```bash
# Si tienes Supabase CLI vinculado
# Opción A (recomendado si ya tienes políticas):
supabase db execute -f docs/AGREGAR_POLITICAS_TOPPINGS.sql

# Opción B (solo si no tienes políticas):
supabase db execute -f docs/SETUP_STORAGE_POLICIES.sql
```

### Verificar bucket existe:

1. Ve a **Storage** en Supabase Dashboard
2. Verifica que existe el bucket `productos`
3. Si no existe, créalo:
   - Click en **New bucket**
   - Nombre: `productos`
   - **Public**: `false` (privado, requiere autenticación)
   - Click en **Create bucket**

## ✅ Verificación

Después de ejecutar ambos SQLs, verifica que:

1. ✅ La tabla `toppings` existe
2. ✅ Las políticas RLS de la tabla están configuradas (4 políticas)
3. ✅ Los índices fueron creados
4. ✅ El trigger `update_toppings_timestamp` existe
5. ✅ Las políticas de storage están configuradas (4 políticas)
6. ✅ El bucket `productos` existe y es privado

Puedes verificar en Supabase Dashboard:
- **Table Editor** → Busca la tabla `toppings`
- **Authentication** → Policies → Filtra por tabla `toppings`
- **Storage** → Buckets → `productos` → Policies

## 🔐 Permisos Configurados

- **SELECT (Ver)**: Cualquier usuario de la organización puede ver toppings
- **INSERT (Crear)**: Solo owners y admins
- **UPDATE (Actualizar)**: Solo owners y admins
- **DELETE (Eliminar)**: Solo owners y admins

Esto permite que:
- ✅ Cualquier empleado pueda ver y usar toppings en ventas
- ✅ Solo administradores pueden gestionar (crear/editar/eliminar) toppings

## 🐛 Solución de Problemas

### Error: "relation already exists"
Si la tabla ya existe, el script intentará recrear las políticas. Si hay errores, elimina la tabla manualmente primero:

```sql
DROP TABLE IF EXISTS toppings CASCADE;
```

Luego ejecuta el script nuevamente.

### Error: "permission denied"
Asegúrate de estar usando la cuenta correcta con permisos de administrador en Supabase.

## 📝 Notas

- El SQL incluye `DROP POLICY IF EXISTS` para poder recrear las políticas si es necesario
- Las imágenes de toppings se almacenan en el bucket `productos` con la ruta `toppings/{organization_id}/`
- Los toppings solo aparecen si el negocio es de tipo "food" y tiene suscripción premium

