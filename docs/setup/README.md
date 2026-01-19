# 📚 Documentación de Configuración

Esta carpeta contiene toda la documentación necesaria para configurar y usar el sistema Crece Más.

## 📋 Índice de Documentación

### 🗄️ **Base de Datos**
- [**SETUP_BASE_DATOS.md**](./SETUP_BASE_DATOS.md) - Configuración inicial de la base de datos
- [**CONFIGURACION_RECIBOS.md**](./CONFIGURACION_RECIBOS.md) - Configuración del sistema de recibos

### 📊 **Importación de Datos**
- [**IMPORTACION_CSV.md**](./IMPORTACION_CSV.md) - Guía para importar productos desde CSV
- [**IMPORTACION_IMAGENES.md**](./IMPORTACION_IMAGENES.md) - Gestión de imágenes de productos

### 👤 **Gestión de Usuarios**
- [**PERFIL_USUARIO.md**](./PERFIL_USUARIO.md) - Configuración de perfiles de usuario
- [**RECIBOS_MEJORADOS.md**](./RECIBOS_MEJORADOS.md) - Mejoras en el sistema de recibos

## 🚀 Guía de Inicio Rápido

### **1. Configuración Inicial**
1. Ejecutar `database/setup/setup_completo.sql` en Supabase
2. Configurar variables de entorno
3. Iniciar el proyecto con `npm start`

### **2. Primera Configuración**
1. Crear cuenta de usuario
2. Configurar datos de empresa en Perfil
3. Subir logo de la empresa
4. Agregar productos al inventario

### **3. Uso Básico**
1. **Caja**: Realizar ventas y generar recibos
2. **Inventario**: Gestionar productos y stock
3. **Resumen**: Ver reportes de ventas
4. **Perfil**: Configurar datos de empresa

## 🔧 Solución de Problemas

### **Errores Comunes**
- **Error 406**: Tabla no existe → Ejecutar scripts de setup
- **Bucket not found**: Storage no configurado → Verificar políticas RLS
- **Error de autenticación**: Verificar configuración de Supabase

### **Scripts de Diagnóstico**
- `database/diagnostics/diagnostico.sql` - Diagnóstico general
- `database/diagnostics/diagnostico_productos.sql` - Verificar productos
- `database/diagnostics/diagnostico_ventas.sql` - Verificar ventas

### **Scripts de Corrección**
- `database/fixes/solucion_emergencia.sql` - Solución rápida
- `database/fixes/limpiar_politicas.sql` - Limpiar políticas RLS
- `database/fixes/fix_storage_policies.sql` - Corregir storage

## 📞 Soporte

Si necesitas ayuda adicional:
1. Revisar la documentación específica
2. Ejecutar scripts de diagnóstico
3. Crear un issue en GitHub
4. Contactar al equipo de desarrollo
