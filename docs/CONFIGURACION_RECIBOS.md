# Configuración del Sistema de Recibos

## Funcionalidades Implementadas

### ✅ Recibo de Venta Mejorado
- **Diseño profesional** con logo del establecimiento
- **Opción de incluir/excluir IVA** (19%)
- **Tabla de productos** con columnas organizadas
- **Cálculo automático** de subtotal, IVA y total
- **Información completa** del establecimiento (nombre, dirección, teléfono, NIT)

### ✅ Generación de PDF
- **PDF optimizado** con alta calidad
- **Guardado automático** en Supabase Storage
- **Descarga local** del archivo PDF
- **Nombres únicos** por fecha y ID de venta

### ✅ Funcionalidades de Compartir
- **WhatsApp Web** con texto formateado
- **Impresión directa** optimizada
- **Botón de nueva venta** para continuar

## Configuración Requerida

### 1. Base de Datos
Ejecutar los siguientes scripts SQL en Supabase:

```sql
-- 1. Agregar campo pago_cliente a ventas
-- Archivo: supabase_ventas_pago_cliente.sql

-- 2. Configurar storage para recibos
-- Archivo: supabase_storage_recibos.sql
```

### 2. Dependencias Instaladas
```bash
npm install lucide-react jspdf html2canvas
```

### 3. Configuración del Establecimiento
Editar en `src/components/ReciboVenta.js`:

```javascript
const establecimiento = {
  nombre: "Tu Empresa S.A.S.",
  direccion: "Tu Dirección Completa",
  telefono: "+57 300 123 4567",
  nit: "900.123.456-7",
  logo: "/logo.png", // Colocar logo en carpeta public
};
```

## Uso del Sistema

### Flujo de Venta
1. **Agregar productos** al carrito en la sección de caja
2. **Seleccionar método de pago**
3. **Confirmar venta** - se pedirá monto si es efectivo
4. **Se mostrará el recibo** automáticamente
5. **Opciones disponibles**:
   - ✅ Incluir/excluir IVA
   - 📤 Compartir por WhatsApp
   - 🖨️ Imprimir recibo
   - 📄 Generar PDF (se guarda en storage)
   - 🆕 Nueva venta

### Características del PDF
- **Alta resolución** (escala 2x)
- **Formato A4** optimizado
- **Múltiples páginas** si es necesario
- **Guardado en storage** del usuario
- **Descarga automática** local

### Estructura de Archivos
```
recibos/
├── {user_id}/
│   ├── recibo_123_2024-01-15.pdf
│   ├── recibo_124_2024-01-15.pdf
│   └── ...
```

## Personalización

### Logo del Establecimiento
1. Colocar archivo de logo en `public/logo.png`
2. Ajustar tamaño en CSS si es necesario
3. El logo se oculta automáticamente si no existe

### Estilos del Recibo
- Editar `src/components/ReciboVenta.css`
- Optimizado para impresión
- Responsive para móviles

### Texto de Compartir
- Personalizable en función `compartir()`
- Incluye datos del establecimiento
- Formato optimizado para WhatsApp

## Solución de Problemas

### Error de Storage
- Verificar que el bucket 'recibos' existe
- Comprobar políticas de RLS
- Revisar permisos del usuario

### PDF no se genera
- Verificar que html2canvas y jsPDF están instalados
- Comprobar que el elemento reciboRef existe
- Revisar consola para errores

### Logo no aparece
- Verificar ruta del archivo en public/
- Comprobar formato de imagen
- El logo se oculta automáticamente si hay error

## Seguridad

- **RLS habilitado** en storage
- **Usuarios solo ven** sus propios recibos
- **Límite de 10MB** por archivo PDF
- **Solo archivos PDF** permitidos
