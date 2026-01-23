# 🚀 Plan de Mejora: Sistema de Pedidos Adaptable

## 📋 Objetivos

1. **Hacer pedidos funcionales con o sin mesas**
2. **Agregar tipos de pedido** (dine-in, takeout, delivery, etc.)
3. **Mejorar ubicación y accesibilidad** (integrar en Caja)
4. **Adaptar a diferentes tipos de negocio** (restaurantes, cafeterías, comida rápida, servicios)

## 🎯 Tipos de Pedido

### 1. **Dine-In (Comer en el local)**
- Requiere mesa (si mesas habilitadas)
- O puede ser "Mostrador" / "Barra" (sin mesa específica)
- Se sirve en el local

### 2. **Takeout (Para llevar)**
- No requiere mesa
- Cliente recoge en el local
- Puede tener hora estimada de recogida

### 3. **Delivery (Domicilio)**
- No requiere mesa
- Requiere dirección de entrega
- Puede tener costo de envío
- Puede tener hora estimada de entrega

### 4. **Express (Rápido)**
- Para pedidos urgentes
- Prioridad alta en cocina
- Sin mesa

## 🔧 Variables Adicionales por Tipo de Negocio

### Para Restaurantes/Cafeterías:
- **Mesa** (opcional si mesas habilitadas)
- **Número de personas**
- **Hora estimada de entrega/recogida**
- **Dirección** (para delivery)
- **Costo de envío** (para delivery)
- **Notas especiales**

### Para Servicios (Barbería, Spa, etc.):
- **Cliente asignado**
- **Hora de cita**
- **Duración estimada**
- **Servicio adicional** (adicionales sin stock)

### Para Comida Rápida:
- **Ventana/Drive-thru**
- **Hora estimada**
- **Número de orden**

## 📍 Ubicación Mejorada

### Opción 1: Integrar en Caja (Recomendado)
- Botón "Nuevo Pedido" en Caja
- Modal o sección para crear pedido
- Permite elegir tipo de pedido
- Al finalizar, se convierte en venta

### Opción 2: Mantener página separada pero mejorada
- Accesible desde Caja con botón rápido
- Más flexible para diferentes tipos de pedido

## 🗄️ Cambios en Base de Datos

### Tabla `pedidos` - Nuevos campos:
```sql
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS tipo_pedido VARCHAR(20) DEFAULT 'dine_in' 
  CHECK (tipo_pedido IN ('dine_in', 'takeout', 'delivery', 'express')),
ADD COLUMN IF NOT EXISTS cliente_nombre VARCHAR(255),
ADD COLUMN IF NOT EXISTS cliente_telefono VARCHAR(20),
ADD COLUMN IF NOT EXISTS direccion_entrega TEXT,
ADD COLUMN IF NOT EXISTS costo_envio DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hora_estimada TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS numero_personas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS prioridad VARCHAR(10) DEFAULT 'normal' 
  CHECK (prioridad IN ('normal', 'alta', 'urgente'));
```

## 🎨 Interfaz Mejorada

### Flujo de Creación de Pedido:

1. **Seleccionar Tipo de Pedido**
   - Botones grandes: Dine-In, Takeout, Delivery, Express
   - Iconos claros

2. **Según Tipo, Mostrar Campos Específicos:**
   - **Dine-In**: Selector de mesa (si mesas habilitadas) o "Mostrador"
   - **Takeout**: Hora estimada de recogida
   - **Delivery**: Dirección, teléfono, costo de envío, hora estimada
   - **Express**: Prioridad alta

3. **Agregar Productos** (igual que ahora)

4. **Guardar Pedido** → Va a Panel de Cocina

5. **Finalizar Pedido** → Se convierte en venta en Caja

## 🔄 Flujo Completo Mejorado

### Escenario 1: Restaurante con Mesas
1. Cliente llega → Seleccionar "Dine-In"
2. Seleccionar mesa
3. Agregar productos
4. Guardar pedido → Cocina
5. Finalizar → Venta

### Escenario 2: Comida Rápida (Sin Mesas)
1. Cliente llama → Seleccionar "Takeout"
2. Agregar productos
3. Guardar pedido → Cocina
4. Cliente recoge → Finalizar → Venta

### Escenario 3: Delivery
1. Cliente llama → Seleccionar "Delivery"
2. Ingresar dirección y teléfono
3. Agregar productos
4. Calcular costo de envío
5. Guardar pedido → Cocina
6. Entregar → Finalizar → Venta

## 📱 Acceso Mejorado

### Desde Caja:
- Botón "Nuevo Pedido" prominente
- Lista de pedidos pendientes
- Finalizar pedido directamente

### Desde Menú:
- Mantener "Tomar Pedido" pero mejorado
- "Panel Cocina" para chefs

## ✅ Beneficios

1. **Más flexible**: Funciona con o sin mesas
2. **Más práctico**: Integrado en flujo de trabajo
3. **Más adaptable**: Diferentes tipos de negocio
4. **Mejor UX**: Campos según necesidad
5. **Más completo**: Variables adicionales según contexto
