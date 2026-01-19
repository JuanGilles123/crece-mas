# 🔐 Ejecutar Políticas de Storage desde Consola

Este script ejecuta las políticas de storage usando el Service Role Key desde la terminal.

## ⚠️ IMPORTANTE: Seguridad

El **Service Role Key** tiene permisos completos de administrador. **NUNCA**:
- ❌ Lo expongas en el frontend
- ❌ Lo subas a repositorios públicos
- ❌ Lo compartas públicamente
- ✅ Úsalo solo en scripts de backend/migraciones
- ✅ Guárdalo en variables de entorno locales

## 📋 Requisitos

1. Tener Node.js instalado
2. Tener el Service Role Key de tu proyecto Supabase
3. Tener las variables de entorno configuradas

## 🚀 Uso

### Paso 1: Obtener Service Role Key

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia el **Service Role Key** (⚠️ NO el anon key)
5. **NO lo compartas ni lo expongas**

### Paso 2: Configurar Variables de Entorno

```bash
# Opción A: Exportar en la terminal (temporal, solo para esta sesión)
export SUPABASE_URL="https://tu-proyecto.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key-aqui"

# Opción B: Crear archivo .env.local (más seguro)
# Crea un archivo .env.local en la raíz del proyecto:
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

**⚠️ IMPORTANTE:** Agrega `.env.local` a `.gitignore` para no subirlo al repositorio.

### Paso 3: Ejecutar el Script

```bash
# Opción 1: Usando npm
npm run setup-storage-policies

# Opción 2: Directamente con node
node ejecutar-politicas-storage.js
```

## 🔍 Verificación

Después de ejecutar el script, verifica:

1. Ve a **Supabase Dashboard** → **Storage** → **`productos`** → **Policies**
2. Deberías ver las 4 nuevas políticas:
   - `Users can upload topping images` (INSERT)
   - `Users can read topping images` (SELECT)
   - `Owners and admins can update topping images` (UPDATE)
   - `Owners and admins can delete topping images` (DELETE)

## 🐛 Solución de Problemas

### Error: "Faltan variables de entorno"
- Verifica que hayas exportado `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- Usa `echo $SUPABASE_URL` para verificar

### Error: "No se encontró el archivo SQL"
- Verifica que el archivo `docs/AGREGAR_POLITICAS_TOPPINGS_V2.sql` existe
- Ejecuta desde la raíz del proyecto

### Error: "Error de conexión"
- Verifica que `SUPABASE_URL` sea correcto
- Verifica que `SUPABASE_SERVICE_ROLE_KEY` sea el Service Role Key (no el anon key)
- El Service Role Key es más largo que el anon key

### Error: "Supabase no permite ejecutar SQL arbitrario"
- Supabase no tiene un endpoint REST para ejecutar SQL arbitrario
- Usa una de las alternativas:
  1. **Supabase CLI**: `supabase db execute -f docs/AGREGAR_POLITICAS_TOPPINGS_V2.sql`
  2. **Dashboard**: Ejecuta el SQL manualmente en SQL Editor
  3. **psql**: Conecta directamente a la base de datos

## 📝 Notas

- Este script intenta ejecutar el SQL usando la API de Supabase
- Si la API no soporta ejecutar SQL arbitrario, el script te dará alternativas
- Las políticas se crean sin afectar las políticas existentes
- Puedes ejecutar el script múltiples veces sin problemas (usa `DROP POLICY IF EXISTS`)

