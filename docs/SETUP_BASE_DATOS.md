# Configuración de Base de Datos - Recibos y Facturación

## 🚨 **PROBLEMA IDENTIFICADO**

Los errores en la consola indican que faltan las siguientes configuraciones en Supabase:

1. **Tabla `datos_empresa`** no existe (Error 406)
2. **Bucket `recibos`** no existe (Error "Bucket not found")
3. **Bucket `logos`** no existe (Error RLS)
4. **Columna `pago_cliente`** falta en tabla `ventas`

## ✅ **SOLUCIÓN**

### **Paso 1: Ejecutar Script SQL**

1. **Abrir Supabase Dashboard**
   - Ve a tu proyecto en [supabase.com](https://supabase.com)
   - Navega a **SQL Editor**

2. **Ejecutar Script Completo**
   - Copia todo el contenido del archivo `setup_completo.sql`
   - Pégalo en el SQL Editor
   - Haz clic en **Run** para ejecutar

### **Paso 2: Verificar Configuración**

Después de ejecutar el script, deberías ver:

#### **Tablas Creadas:**
- ✅ `datos_empresa` - Para datos de facturación
- ✅ `ventas` - Actualizada con columna `pago_cliente`

#### **Buckets de Storage:**
- ✅ `recibos` - Para PDFs de recibos (privado)
- ✅ `logos` - Para logos de empresa (público)

#### **Políticas RLS:**
- ✅ Usuarios solo pueden acceder a sus propios datos
- ✅ Logos son públicos para mostrar en recibos
- ✅ Recibos son privados por usuario

## 🔧 **Qué Hace el Script**

### **1. Tabla `datos_empresa`**
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key a auth.users)
- nombre_empresa (TEXT, required)
- direccion (TEXT, required)
- telefono (TEXT, required)
- nit (TEXT, required)
- logo_url (TEXT, optional)
- email (TEXT, optional)
- ciudad (TEXT, optional)
- departamento (TEXT, optional)
- codigo_postal (TEXT, optional)
- created_at, updated_at (timestamps)
```

### **2. Columna `pago_cliente`**
- Se agrega a la tabla `ventas` existente
- Almacena el monto entregado por el cliente
- Se usa para calcular el cambio

### **3. Bucket `recibos`**
- **Tipo**: Privado
- **Límite**: 10MB por archivo
- **Formato**: Solo PDF
- **Estructura**: `recibos/{user_id}/archivo.pdf`

### **4. Bucket `logos`**
- **Tipo**: Público
- **Límite**: 2MB por archivo
- **Formatos**: PNG, JPG, JPEG, GIF, WebP
- **Estructura**: `logos/{user_id}/archivo.jpg`

### **5. Políticas de Seguridad (RLS)**
- **Datos de empresa**: Solo el propietario puede ver/editar
- **Recibos**: Solo el propietario puede subir/ver/eliminar
- **Logos**: Solo el propietario puede subir/eliminar, todos pueden ver

## 🚀 **Después de la Configuración**

### **Funcionalidades Habilitadas:**
1. ✅ **Configuración de Facturación** en Perfil
2. ✅ **Subida de Logo** de empresa
3. ✅ **Generación de PDFs** de recibos
4. ✅ **Almacenamiento** de recibos en cloud
5. ✅ **Cálculo de Cambio** en ventas
6. ✅ **Datos de Empresa** en recibos

### **Flujo Completo:**
1. **Usuario configura** datos de empresa en Perfil
2. **Usuario sube logo** de su empresa
3. **Usuario realiza venta** en Caja
4. **Sistema genera recibo** con datos reales
5. **Sistema guarda PDF** en storage
6. **Usuario puede compartir** o imprimir

## 🔍 **Verificación**

### **Comprobar en Supabase Dashboard:**

#### **1. Tablas**
- Ve a **Table Editor**
- Verifica que existe `datos_empresa`
- Verifica que `ventas` tiene columna `pago_cliente`

#### **2. Storage**
- Ve a **Storage**
- Verifica que existen buckets `recibos` y `logos`

#### **3. Políticas RLS**
- Ve a **Authentication > Policies**
- Verifica que existen políticas para `datos_empresa`
- Ve a **Storage > Policies**
- Verifica que existen políticas para ambos buckets

## 🐛 **Solución de Problemas**

### **Error 406 en datos_empresa**
- **Causa**: Tabla no existe
- **Solución**: Ejecutar script SQL completo

### **Error "Bucket not found"**
- **Causa**: Buckets no existen
- **Solución**: Ejecutar script SQL completo

### **Error RLS en logos**
- **Causa**: Políticas no configuradas
- **Solución**: Ejecutar script SQL completo

### **Error al subir archivos**
- **Causa**: Permisos incorrectos
- **Solución**: Verificar políticas RLS

## 📝 **Notas Importantes**

1. **Ejecutar una sola vez**: El script es idempotente
2. **No eliminar**: Las políticas son necesarias para seguridad
3. **Backup**: Hacer backup antes de ejecutar en producción
4. **Permisos**: Verificar que el usuario tiene permisos de administrador

## 🎯 **Resultado Final**

Después de ejecutar este script, el sistema de recibos funcionará completamente:

- ✅ Configuración de datos de empresa
- ✅ Subida y gestión de logos
- ✅ Generación de PDFs optimizados
- ✅ Almacenamiento seguro en cloud
- ✅ Recibos profesionales con datos reales
- ✅ Cálculo automático de cambio
- ✅ Compartir por WhatsApp
- ✅ Imprimir recibos

¡El sistema estará listo para usar en producción!
