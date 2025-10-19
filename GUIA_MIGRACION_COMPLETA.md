# 🚀 MIGRACIÓN COMPLETA - GUÍA PASO A PASO

Esta guía te llevará a través de la migración completa del sistema multi-organización.

---

## 📋 RESUMEN DE LO QUE HAREMOS

1. ✅ Agregar columnas de facturación a la tabla `organizations`
2. ✅ Actualizar rutas de imágenes en la base de datos (user_id → organization_id)
3. ✅ Copiar archivos físicos en Supabase Storage
4. ✅ Verificar que todo funcione correctamente
5. ✅ Limpiar políticas duplicadas

---

## 🎯 PASO 1: AGREGAR COLUMNAS DE FACTURACIÓN

### Objetivo
Agregar campos de facturación a cada organización para que puedan generar recibos/facturas personalizados.

### Instrucciones

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Abre el archivo: `agregar_info_facturacion_organizacion.sql`
4. Copia todo el contenido
5. Pégalo en el SQL Editor
6. Haz clic en **Run** (ejecutar)

### Resultado Esperado
```
✅ COLUMNAS DE FACTURACIÓN
- razon_social
- nit
- direccion
- telefono
- email
- ciudad
- regimen_tributario
- responsable_iva
- logo_url
- mensaje_factura
```

### Verificación
```sql
SELECT 
  name as organizacion,
  razon_social,
  nit,
  email
FROM organizations;
```

---

## 🎯 PASO 2: MIGRAR RUTAS DE IMÁGENES EN BASE DE DATOS

### Objetivo
Actualizar las rutas de imágenes en la tabla `productos` para que apunten a la carpeta de la organización en lugar de la carpeta del usuario.

**ANTES:** `productos/123e4567-e89b-12d3-a456-426614174000/imagen.jpg` (user_id)  
**DESPUÉS:** `productos/987fcdeb-51a2-43f1-9876-fedcba987654/imagen.jpg` (organization_id)

### Instrucciones

1. Abre **Supabase Dashboard** > **SQL Editor**
2. Abre el archivo: `migracion_completa_imagenes.sql`
3. Copia todo el contenido
4. Pégalo en el SQL Editor
5. Haz clic en **Run**

### Resultado Esperado
```
✅ MIGRACIÓN DE RUTAS COMPLETADA
============================================
Productos migrados: 3
Rutas correctas: 3
Rutas incorrectas: 0

📋 SIGUIENTE PASO:
1. Ejecutar: node migrate-storage-images.js
2. El script copiará los archivos físicos
3. Verificar imágenes en la aplicación
```

### Qué hace este script
- ✅ Crea un backup temporal de las rutas actuales
- ✅ Actualiza todas las rutas en la tabla `productos`
- ✅ Verifica que no haya inconsistencias
- ✅ Muestra lista de archivos que necesitan copiarse

---

## 🎯 PASO 3: COPIAR ARCHIVOS FÍSICOS EN STORAGE

### Objetivo
Copiar los archivos de imagen desde `productos/{user_id}/` a `productos/{organization_id}/` en Supabase Storage.

### Pre-requisitos
- Node.js instalado
- Service Role Key de Supabase

### Instrucciones

#### 3.1 Obtener Service Role Key

1. Abre **Supabase Dashboard**
2. Ve a **Settings** > **API**
3. En la sección **Project API keys**, busca `service_role`
4. Haz clic en el ícono del ojo para revelar la clave
5. Cópiala (⚠️ **NUNCA** la compartas ni la subas a Git)

#### 3.2 Configurar el Script

1. Abre el archivo: `migrate-storage-images.js`
2. Reemplaza estos valores:
   ```javascript
   const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
   const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```

#### 3.3 Ejecutar el Script

```bash
# Instalar dependencias (si no están instaladas)
npm install @supabase/supabase-js

# Ejecutar migración
node migrate-storage-images.js
```

### Resultado Esperado
```
🚀 INICIANDO MIGRACIÓN DE ARCHIVOS
============================================

📋 Obteniendo lista de productos...
✅ Encontrados 3 productos con imágenes

[1/3] Procesando: Producto 1
   Origen: 123e4567-e89b-12d3-a456-426614174000/1759951119513_imagen.jpg
   Destino: 987fcdeb-51a2-43f1-9876-fedcba987654/1759951119513_imagen.jpg
   ✅ Archivo copiado exitosamente

...

============================================
📊 RESUMEN DE MIGRACIÓN
============================================
Total productos:    3
✅ Exitosos:        3
⚠️  Omitidos:        0
❌ Errores:         0
============================================

🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!
```

---

## 🎯 PASO 4: VERIFICAR LA MIGRACIÓN

### Objetivo
Confirmar que las imágenes se muestran correctamente en la aplicación.

### Instrucciones

#### 4.1 Verificar en la Base de Datos

Ejecuta este SQL para ver el estado:
```sql
-- Ver productos con imágenes
SELECT 
  nombre,
  organization_id,
  imagen,
  split_part(imagen, '/', 1)::uuid = organization_id as ruta_correcta
FROM productos
WHERE imagen IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

Deberías ver `ruta_correcta = true` en todas las filas.

#### 4.2 Verificar en la Aplicación

1. Abre la aplicación
2. Ve a **Inventario**
3. Las imágenes de los productos deberían cargar correctamente
4. No deberías ver errores 400 en la consola

#### 4.3 Verificar con Usuario Invitado

1. Invita a un usuario a tu organización (rol: Admin o Member)
2. Inicia sesión con ese usuario
3. Ve a **Inventario**
4. Debería poder ver las imágenes de los productos

### Solución de Problemas

**Si las imágenes no cargan:**

```sql
-- Diagnóstico: Ver archivos en Storage
SELECT name 
FROM storage.objects 
WHERE bucket_id = 'productos' 
ORDER BY created_at DESC 
LIMIT 20;
```

**Si ves errores 400:**
- Verifica que las políticas de Storage estén activas
- Confirma que los archivos existen en las nuevas rutas
- Revisa la consola del navegador para ver el error exacto

---

## 🎯 PASO 5: LIMPIAR POLÍTICAS DUPLICADAS

### Objetivo
Eliminar políticas RLS duplicadas que puedan causar problemas de rendimiento.

### Instrucciones

1. Abre **Supabase Dashboard** > **SQL Editor**
2. Abre el archivo: `limpiar_politicas_organizations.sql`
3. Copia todo el contenido
4. Pégalo en el SQL Editor
5. Haz clic en **Run**

### Resultado Esperado
```
✅ POLÍTICAS LIMPIADAS
- Políticas duplicadas eliminadas
- Solo quedan políticas necesarias
- Rendimiento optimizado
```

---

## 🎯 PASO 6: PRUEBAS FINALES

### Checklist de Funcionalidad

#### Como Owner
- [ ] Ver todos los productos con imágenes
- [ ] Agregar nuevo producto con imagen
- [ ] Editar producto y cambiar imagen
- [ ] Eliminar producto
- [ ] Configurar información de facturación
- [ ] Generar recibo con datos de la organización

#### Como Admin
- [ ] Ver todos los productos con imágenes
- [ ] Agregar nuevo producto con imagen
- [ ] Editar producto y cambiar imagen
- [ ] NO puede configurar información de facturación
- [ ] Generar recibo con datos de la organización

#### Como Member
- [ ] Ver todos los productos con imágenes
- [ ] NO puede agregar productos
- [ ] NO puede editar productos
- [ ] NO puede configurar información de facturación
- [ ] Generar recibo con datos de la organización

### Pruebas de Rendimiento

- [ ] El inventario carga rápido (20 productos iniciales)
- [ ] El scroll es suave con infinite scroll
- [ ] Las imágenes cargan sin demora
- [ ] No hay errores en la consola

---

## 📊 ARCHIVOS INVOLUCRADOS

### Scripts SQL
- `agregar_info_facturacion_organizacion.sql` - Columnas de facturación
- `migracion_completa_imagenes.sql` - Actualizar rutas en BD
- `fix_storage_productos_policies.sql` - Políticas de Storage (ya ejecutado)
- `limpiar_politicas_organizations.sql` - Limpiar duplicados

### Scripts Node.js
- `migrate-storage-images.js` - Copiar archivos físicos

### Componentes React
- `ConfiguracionFacturacion.js` - Ya creado y listo para usar

---

## 🆘 SOPORTE

### Si algo sale mal

1. **Base de datos:** Todas las migraciones crean backups automáticos
2. **Storage:** Los archivos antiguos NO se eliminan (solo se copian)
3. **Código:** Los cambios en el código ya están aplicados

### Contacto
Si tienes problemas durante la migración, revisa:
- Console del navegador (F12)
- Supabase Dashboard > Logs
- Errores en terminal al ejecutar scripts

---

## ✅ RESUMEN

### Lo que ya está hecho
- ✅ Código actualizado (useProductos, Inventario, Caja, etc.)
- ✅ Políticas de Storage creadas
- ✅ Componente ConfiguracionFacturacion creado
- ✅ Scripts de migración preparados

### Lo que falta hacer
1. Ejecutar SQL de facturación
2. Ejecutar SQL de migración de rutas
3. Ejecutar script Node.js para copiar archivos
4. Verificar que todo funcione
5. Limpiar políticas duplicadas

### Tiempo estimado
- SQL de facturación: 1 minuto
- SQL de migración: 2 minutos
- Script Node.js: 5-10 minutos (depende de cantidad de imágenes)
- Verificación: 5 minutos
- **Total: ~15-20 minutos**

---

## 🎉 DESPUÉS DE LA MIGRACIÓN

Tu sistema tendrá:
- ✅ Multi-organización completo
- ✅ Imágenes funcionando para todos los miembros
- ✅ Facturación personalizada por organización
- ✅ Rendimiento optimizado (infinite scroll)
- ✅ Permisos por rol (Owner, Admin, Member)
- ✅ Stock sincronizado en tiempo real

**¡Todo listo para producción!** 🚀
