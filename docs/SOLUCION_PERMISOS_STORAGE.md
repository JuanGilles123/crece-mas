# 🔐 Solución: Error "must be owner of relation objects"

Si obtienes este error al intentar crear políticas de storage desde SQL, aquí están las soluciones:

## ✅ Solución 1: Verificar que eres Owner del Proyecto

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **General**
4. Verifica que tu email aparece como **Owner** del proyecto
5. Si no eres owner, contacta al owner para que ejecute el SQL o te dé permisos

## ✅ Solución 2: Usar SQL Editor desde Dashboard (No conexión externa)

Asegúrate de ejecutar el SQL desde el **SQL Editor del Dashboard**, no desde:
- ❌ Una conexión externa (psql, DBeaver, etc.)
- ❌ Supabase CLI (a menos que uses service_role)
- ✅ **SÍ desde**: Supabase Dashboard → SQL Editor

## ✅ Solución 3: Usar Service Role Key (Solo para desarrollo)

Si estás en desarrollo y tienes acceso al Service Role Key:

1. Ve a **Settings** → **API**
2. Copia el **Service Role Key** (⚠️ NUNCA lo expongas en el frontend)
3. Usa este key para crear un cliente Supabase con permisos de administrador
4. Ejecuta el SQL desde ese cliente

**⚠️ ADVERTENCIA:** El Service Role Key tiene permisos completos. Solo úsalo en scripts de backend o migraciones, nunca en el frontend.

## ✅ Solución 4: Usar Dashboard (Más Fácil)

Si ninguna de las anteriores funciona, usa el Dashboard:

1. Ve a **Storage** → Bucket `productos` → **Policies**
2. Sigue las instrucciones en `CONFIGURAR_POLITICAS_STORAGE_DASHBOARD.md`

Este método no requiere permisos especiales de SQL.

## 🔍 Verificar Permisos Actuales

Para verificar qué permisos tienes, ejecuta esto en el SQL Editor:

```sql
-- Ver tu rol actual
SELECT current_user, session_user;

-- Ver si puedes crear políticas en storage
SELECT has_schema_privilege('storage', 'USAGE');
SELECT has_table_privilege('storage.objects', 'ALL');
```

## 📝 Nota sobre Políticas de Storage

Las políticas de storage en Supabase requieren permisos especiales porque:
- La tabla `storage.objects` es una vista del sistema
- Solo el owner del proyecto o usuarios con permisos de administrador pueden crear políticas
- Esto es por seguridad, para evitar que usuarios normales modifiquen políticas de storage

