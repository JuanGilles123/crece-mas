# 🚀 Guía Rápida: Crear Políticas de Storage para Toppings

## ⚠️ IMPORTANTE

Si obtienes el error "must be owner of relation objects" en el SQL Editor, **debes usar la interfaz visual del Dashboard de Storage**. Esta es la única forma si no eres owner del proyecto.

**⚠️ CRÍTICO:** Al copiar el SQL, copia SOLO el contenido, SIN los bloques de código markdown (```sql).

## 📋 Pasos (5 minutos)

### 1. Ir a Storage Policies

1. Ve a: https://supabase.com/dashboard/project/ywilkhfkuwhsjvojocso/storage/buckets/productos/policies
2. O manualmente:
   - Dashboard → **Storage** (menú lateral)
   - Click en el bucket **`productos`**
   - Click en la pestaña **Policies**

### 2. Crear Política 1: Subir Imágenes de Toppings

1. Click en **New Policy**
2. Selecciona **For full customization**
3. Configura:
   - **Policy name**: `Users can upload topping images`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **USING expression**: (dejar vacío)
   - **WITH CHECK expression**: Copia y pega SOLO esto (SIN ```sql ni ```):

```
bucket_id = 'productos' AND
(storage.foldername(name))[1] = 'toppings' AND
(storage.foldername(name))[2] IN (
  SELECT organization_id::text FROM user_profiles WHERE user_id = auth.uid()
  UNION
  SELECT organization_id::text FROM team_members WHERE user_id = auth.uid() AND status = 'active'
)
```

4. Click en **Review** → **Save policy**

### 3. Crear Política 2: Leer Imágenes de Toppings

1. Click en **New Policy**
2. **For full customization**
3. Configura:
   - **Policy name**: `Users can read topping images`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
   - **USING expression**: Copia y pega SOLO esto (SIN ```sql ni ```):

```
bucket_id = 'productos' AND
(storage.foldername(name))[1] = 'toppings' AND
(storage.foldername(name))[2] IN (
  SELECT organization_id::text FROM user_profiles WHERE user_id = auth.uid()
  UNION
  SELECT organization_id::text FROM team_members WHERE user_id = auth.uid() AND status = 'active'
)
```

   - **WITH CHECK expression**: (dejar vacío)
4. Click en **Review** → **Save policy**

### 4. Crear Política 3: Actualizar Imágenes de Toppings (Solo Owners/Admins)

1. Click en **New Policy**
2. **For full customization**
3. Configura:
   - **Policy name**: `Owners and admins can update topping images`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **USING expression**: Copia y pega SOLO esto (SIN ```sql ni ```):

```
bucket_id = 'productos' AND
(storage.foldername(name))[1] = 'toppings' AND
(storage.foldername(name))[2] IN (
  SELECT organization_id::text FROM user_profiles 
  WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  UNION
  SELECT organization_id::text FROM team_members 
  WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
)
```

   - **WITH CHECK expression**: (dejar vacío)
4. Click en **Review** → **Save policy**

### 5. Crear Política 4: Eliminar Imágenes de Toppings (Solo Owners/Admins)

1. Click en **New Policy**
2. **For full customization**
3. Configura:
   - **Policy name**: `Owners and admins can delete topping images`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**: Copia y pega SOLO esto (SIN ```sql ni ```):

```
bucket_id = 'productos' AND
(storage.foldername(name))[1] = 'toppings' AND
(storage.foldername(name))[2] IN (
  SELECT organization_id::text FROM user_profiles 
  WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  UNION
  SELECT organization_id::text FROM team_members 
  WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
)
```

   - **WITH CHECK expression**: (dejar vacío)
4. Click en **Review** → **Save policy**

## ✅ Verificación

Después de crear las 4 políticas:

1. Ve a **Storage** → **`productos`** → **Policies**
2. Deberías ver las 4 nuevas políticas en la lista
3. Intenta subir una imagen de topping desde la aplicación
4. No deberías ver el error "new row violates row-level security policy"

## 🔗 Link Directo

https://supabase.com/dashboard/project/ywilkhfkuwhsjvojocso/storage/buckets/productos/policies

## 📝 Notas

- Estas políticas se agregan a las existentes, no las reemplazan
- Las políticas existentes para `{organization_id}/` seguirán funcionando
- Las nuevas políticas solo aplican para `toppings/{organization_id}/`

## 🆘 Si tienes problemas

Abre el archivo `EXPRESIONES_SQL_POLITICAS.txt` que tiene todas las expresiones SQL listas para copiar sin formato markdown.
