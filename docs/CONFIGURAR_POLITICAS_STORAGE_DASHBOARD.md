# 🔐 Configurar Políticas de Storage desde Dashboard

Como el SQL requiere permisos de owner, la forma más fácil es usar el Dashboard de Supabase.

## 📋 Pasos para Configurar Políticas

### 1. Ir a Storage Policies

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Storage** en el menú lateral
4. Click en el bucket **`productos`**
5. Ve a la pestaña **Policies**

### 2. Crear Política: Subir Imágenes de Toppings

1. Click en **New Policy**
2. Selecciona **Create a policy from scratch** o **For full customization**
3. Configura:
   - **Policy name**: `Users can upload topping images`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **USING expression**: (dejar vacío)
   - **WITH CHECK expression**: Copia y pega esto:

```sql
bucket_id = 'productos' AND
(storage.foldername(name))[1] = 'toppings' AND
(storage.foldername(name))[2] IN (
  SELECT organization_id::text FROM user_profiles WHERE user_id = auth.uid()
  UNION
  SELECT organization_id::text FROM team_members WHERE user_id = auth.uid() AND status = 'active'
)
```

4. Click en **Review** y luego **Save policy**

### 3. Crear Política: Leer Imágenes de Toppings

1. Click en **New Policy**
2. Configura:
   - **Policy name**: `Users can read topping images`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
   - **USING expression**: Copia y pega esto:

```sql
bucket_id = 'productos' AND
(storage.foldername(name))[1] = 'toppings' AND
(storage.foldername(name))[2] IN (
  SELECT organization_id::text FROM user_profiles WHERE user_id = auth.uid()
  UNION
  SELECT organization_id::text FROM team_members WHERE user_id = auth.uid() AND status = 'active'
)
```

   - **WITH CHECK expression**: (dejar vacío)
3. Click en **Review** y luego **Save policy**

### 4. Crear Política: Actualizar Imágenes de Toppings (Solo Owners/Admins)

1. Click en **New Policy**
2. Configura:
   - **Policy name**: `Owners and admins can update topping images`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **USING expression**: Copia y pega esto:

```sql
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
3. Click en **Review** y luego **Save policy**

### 5. Crear Política: Eliminar Imágenes de Toppings (Solo Owners/Admins)

1. Click en **New Policy**
2. Configura:
   - **Policy name**: `Owners and admins can delete topping images`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**: Copia y pega esto:

```sql
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
3. Click en **Review** y luego **Save policy**

## ✅ Verificación

Después de crear las 4 políticas, verifica que:

1. ✅ Las políticas aparecen en la lista de políticas del bucket `productos`
2. ✅ Puedes intentar subir una imagen de topping desde la aplicación
3. ✅ No deberías ver el error "new row violates row-level security policy"

## 🔍 Ver Políticas Creadas

Para verificar que las políticas se crearon correctamente:

1. En el Dashboard, ve a **Storage** → **`productos`** → **Policies**
2. Deberías ver las 4 nuevas políticas:
   - `Users can upload topping images` (INSERT)
   - `Users can read topping images` (SELECT)
   - `Owners and admins can update topping images` (UPDATE)
   - `Owners and admins can delete topping images` (DELETE)

## 📝 Notas

- Estas políticas se agregan a las existentes, no las reemplazan
- Las políticas existentes para `{organization_id}/` seguirán funcionando
- Las nuevas políticas solo aplican para `toppings/{organization_id}/`

