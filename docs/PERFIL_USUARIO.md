# Sección de Perfil de Usuario - Guía Completa

## ✅ Funcionalidades Implementadas

### 👤 **Página de Perfil Completa**
- **Datos personales** del usuario
- **Configuración de facturación** integrada
- **Navegación por pestañas** intuitiva
- **Diseño responsive** para todos los dispositivos

### 🏢 **Configuración de Facturación**
- **Formulario completo** para datos de empresa
- **Subida de logo** con preview
- **Validación de campos** obligatorios
- **Guardado automático** en base de datos

## 🚀 **Cómo Acceder**

### Navegación
```
Dashboard → Perfil (👤)
```

### URL Directa
```
/dashboard/perfil
```

## 📋 **Secciones del Perfil**

### 1. **Datos Personales**
- **Nombre completo** del usuario
- **Email** de la cuenta
- **ID único** del usuario
- **Fecha de registro**

### 2. **Configuración de Facturación** ⭐
- **Nombre de la empresa** (obligatorio)
- **Dirección** (obligatorio)
- **Teléfono** (obligatorio)
- **NIT** (obligatorio)
- **Email de contacto** (opcional)
- **Ciudad** (opcional)
- **Departamento** (opcional)
- **Código postal** (opcional)
- **Logo de la empresa** (opcional)

### 3. **Configuración General**
- **Preferencias** de la aplicación
- **Notificaciones**
- **Seguridad** (próximamente)

## 🎯 **Configuración de Datos de Empresa**

### Campos Obligatorios
1. **Nombre de la Empresa**
   - Ejemplo: "Mi Empresa S.A.S."
   - Se muestra en el encabezado del recibo

2. **Dirección**
   - Ejemplo: "Calle 123 #45-67, Medellín"
   - Dirección completa del establecimiento

3. **Teléfono**
   - Ejemplo: "+57 300 123 4567"
   - Número de contacto

4. **NIT**
   - Ejemplo: "900.123.456-7"
   - Número de identificación tributaria

### Campos Opcionales
- **Email**: Para contacto adicional
- **Ciudad y Departamento**: Para ubicación específica
- **Código Postal**: Para envíos
- **Logo**: Imagen de la empresa (máx. 2MB)

### Subida de Logo
- **Formatos permitidos**: PNG, JPG, JPEG, GIF, WebP
- **Tamaño máximo**: 2MB
- **Preview automático** después de subir
- **Se oculta automáticamente** si hay error

## 🔧 **Flujo de Configuración**

### 1. Acceder al Perfil
```
Dashboard → Perfil → Configuración de Facturación
```

### 2. Completar Datos
- Llenar campos obligatorios
- Subir logo (opcional)
- Guardar configuración

### 3. Validación
- **Campos requeridos** marcados con *
- **Mensajes de error** claros
- **Confirmación** de guardado exitoso

### 4. Uso en Recibos
- Los datos se cargan automáticamente
- Logo aparece en el encabezado
- Información completa en PDF y WhatsApp

## 📱 **Diseño Responsive**

### Desktop
- **Sidebar de navegación** a la izquierda
- **Contenido principal** a la derecha
- **Grid de 2 columnas** para datos

### Tablet
- **Navegación horizontal** en la parte superior
- **Contenido apilado** verticalmente
- **Grid adaptativo** para datos

### Móvil
- **Navegación compacta** con scroll horizontal
- **Contenido optimizado** para pantallas pequeñas
- **Botones grandes** para fácil interacción

## 🔒 **Seguridad y Privacidad**

### Datos del Usuario
- **Solo el usuario** puede ver sus datos
- **RLS habilitado** en base de datos
- **Logos públicos** para mostrar en recibos
- **Datos privados** protegidos

### Storage
- **Logos**: Bucket público para visualización
- **Datos**: Tabla privada por usuario
- **Límites de tamaño** configurados
- **Validación de tipos** de archivo

## 🚨 **Solución de Problemas**

### Error: "Campos requeridos"
- **Causa**: Faltan datos obligatorios
- **Solución**: Completar todos los campos marcados con *

### Logo no se sube
- **Causa**: Archivo muy grande o formato incorrecto
- **Solución**: Verificar tamaño (máx. 2MB) y formato

### Datos no se guardan
- **Causa**: Error de conexión o permisos
- **Solución**: Verificar conexión y recargar página

### Recibo no muestra datos
- **Causa**: Datos no configurados
- **Solución**: Completar configuración en perfil

## 📊 **Estructura de Base de Datos**

### Tabla: datos_empresa
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- nombre_empresa (text, required)
- direccion (text, required)
- telefono (text, required)
- nit (text, required)
- logo_url (text, optional)
- email (text, optional)
- ciudad (text, optional)
- departamento (text, optional)
- codigo_postal (text, optional)
- created_at (timestamp)
- updated_at (timestamp)
```

### Storage: logos
```
logos/
├── {user_id}/
│   ├── logo_user_123_1640995200000.png
│   └── ...
```

## 🎉 **Beneficios del Sistema**

- ✅ **Configuración centralizada** de datos de empresa
- ✅ **Interfaz intuitiva** con navegación por pestañas
- ✅ **Validación automática** de campos obligatorios
- ✅ **Subida de logo** con preview
- ✅ **Diseño responsive** para todos los dispositivos
- ✅ **Integración completa** con sistema de recibos
- ✅ **Seguridad garantizada** con RLS
- ✅ **Experiencia de usuario** optimizada

## 🔄 **Flujo Completo**

1. **Usuario accede** al perfil
2. **Navega** a configuración de facturación
3. **Completa** datos obligatorios
4. **Sube logo** (opcional)
5. **Guarda** configuración
6. **Realiza venta** en caja
7. **Genera recibo** con datos reales
8. **Comparte o imprime** recibo profesional

El sistema ahora está completamente integrado y permite a los usuarios configurar todos los datos de su empresa desde una interfaz amigable y profesional.
