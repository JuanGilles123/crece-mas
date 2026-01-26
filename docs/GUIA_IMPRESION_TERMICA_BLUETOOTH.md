# Guía de Impresión Térmica Bluetooth

## Estado Actual

Actualmente, la aplicación usa `window.print()` para imprimir recibos, lo cual funciona con impresoras estándar conectadas al sistema. Para impresoras térmicas Bluetooth, necesitas una solución diferente.

## Opciones Disponibles

### Opción 1: Web Bluetooth API (Recomendada para Web)

**Ventajas:**
- No requiere instalación adicional
- Funciona directamente desde el navegador
- Compatible con impresoras ESC/POS

**Requisitos:**
- Navegador: Chrome/Edge (versión 56+) o Opera
- HTTPS obligatorio (o localhost para desarrollo)
- Permisos de Bluetooth del usuario
- Impresora compatible con ESC/POS

**Limitaciones:**
- No funciona en Safari/Firefox
- Requiere interacción del usuario para conectar
- Solo funciona en dispositivos con Bluetooth

### Opción 2: Aplicación Híbrida (PWA + Capacitor/Cordova)

**Ventajas:**
- Funciona en iOS y Android
- Acceso completo a APIs nativas
- Mejor rendimiento

**Requisitos:**
- Convertir la app a PWA
- Usar Capacitor o Cordova
- Plugins nativos para Bluetooth

### Opción 3: Servicio Intermedio (Servidor Local)

**Ventajas:**
- Funciona desde cualquier navegador
- No requiere cambios en la app web
- Soporta múltiples impresoras

**Requisitos:**
- Servidor local (Node.js, Python, etc.)
- Aplicación de escritorio que maneje Bluetooth
- Comunicación entre web y servidor local

## Implementación Completada ✅

La funcionalidad de impresión Bluetooth ya está implementada en la aplicación.

### Archivos Creados/Modificados:

1. **`src/utils/thermalPrinter.js`**: Servicio completo para impresión térmica Bluetooth
2. **`src/components/business/ReciboVenta.js`**: Agregado botón de impresión Bluetooth

### Cómo Usar:

1. Abre el recibo de una venta
2. Haz clic en el botón **"Bluetooth"** (icono de Bluetooth)
3. Selecciona tu impresora térmica de la lista
4. El recibo se imprimirá automáticamente

## Configuración Necesaria

### 1. Verificar Compatibilidad del Navegador

```javascript
if (!navigator.bluetooth) {
  alert('Tu navegador no soporta Bluetooth. Usa Chrome o Edge.');
}
```

### 2. Solicitar Permisos

El navegador pedirá permisos automáticamente cuando se intente conectar.

### 3. Conectar Impresora

El usuario debe:
1. Activar Bluetooth en su dispositivo
2. Activar la impresora y ponerla en modo de emparejamiento
3. Hacer clic en "Imprimir Bluetooth"
4. Seleccionar la impresora de la lista

### 4. Formato del Recibo

Las impresoras térmicas requieren comandos ESC/POS específicos:
- Ancho: 58mm o 80mm (más común)
- Fuente: Monospace
- Sin colores (solo texto)
- Formato específico para recibos

## Funcionalidades Implementadas

### ✅ Servicio de Impresión (`thermalPrinter.js`)

- **Conexión Bluetooth**: Detecta y conecta automáticamente con impresoras térmicas
- **Formato ESC/POS**: Genera comandos compatibles con impresoras térmicas estándar
- **Formato de Recibo**: Incluye:
  - Encabezado con datos de la empresa
  - Información del recibo (ID, fecha, cajero, cliente)
  - Lista de productos con toppings y variaciones
  - Totales (subtotal, descuentos, IVA, total)
  - Método de pago y cambio
  - Mensaje de agradecimiento
- **Manejo de Errores**: Mensajes claros para diferentes tipos de errores
- **Soporte Múltiples UUIDs**: Compatible con diferentes modelos de impresoras

### ✅ Integración en ReciboVenta

- Botón "Bluetooth" visible solo si el navegador soporta Bluetooth
- Estado de carga durante la impresión
- Validaciones de datos de empresa y HTTPS
- Mensajes de error informativos

## Alternativa: Usar Librería Especializada

### react-thermal-printer

```bash
npm install react-thermal-printer
```

Esta librería simplifica el proceso y maneja automáticamente:
- Conexión Bluetooth
- Formato ESC/POS
- Manejo de errores
- Reconexión automática

## Consideraciones Importantes

1. **HTTPS Obligatorio**: Web Bluetooth solo funciona en HTTPS (excepto localhost)
2. **Permisos del Usuario**: El usuario debe aceptar la conexión Bluetooth
3. **Emparejamiento**: La impresora debe estar en modo de emparejamiento
4. **Formato del Recibo**: Debe estar optimizado para 58mm o 80mm
5. **Fallback**: Mantener la opción de `window.print()` como alternativa

## Próximos Pasos

1. Decidir qué opción implementar (recomendado: Web Bluetooth API)
2. Instalar las dependencias necesarias
3. Crear el componente/servicio de impresión Bluetooth
4. Integrar con el componente ReciboVenta existente
5. Probar con una impresora térmica real

## Nota

Si prefieres que implemente esta funcionalidad directamente en el código, puedo:
1. Crear un componente de impresión Bluetooth
2. Integrarlo con ReciboVenta.js
3. Agregar un botón "Imprimir Bluetooth" junto al botón de impresión actual
4. Manejar errores y fallbacks apropiadamente

¿Quieres que proceda con la implementación?
