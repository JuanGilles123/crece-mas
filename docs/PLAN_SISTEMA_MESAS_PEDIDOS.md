# 🍽️ Plan: Sistema de Mesas y Pedidos para Restaurantes

## 📋 Resumen Ejecutivo

Sistema completo de gestión de mesas y pedidos para negocios de comida (restaurantes, cafeterías, comida rápida). Permite tomar pedidos por mesa, enviarlos a cocina (chefs), y procesarlos como ventas al finalizar.

## 🎯 Requisitos Principales

### Condiciones de Activación
- ✅ Solo para negocios tipo `business_type = 'food'`
- ✅ Solo para suscripciones premium (Professional, Enterprise, Custom)
- ✅ Se habilita desde **Configuración de Facturación**
- ✅ Dos opciones independientes:
  - **Mesas**: Habilitar/deshabilitar sistema de mesas
  - **Pedidos**: Habilitar/deshabilitar sistema de pedidos

### Flujo de Trabajo

1. **Configuración Inicial**
   - Owner habilita "Mesas" y "Pedidos" en Configuración
   - Crea mesas disponibles (ej: Mesa 1, Mesa 2, Mesa 3...)
   - Define capacidad de cada mesa

2. **Tomar Pedido**
   - Usuario selecciona una mesa disponible
   - Agrega productos al pedido (con toppings si aplica)
   - El pedido se guarda en estado "pendiente"
   - Si hay chefs asignados, el pedido les llega automáticamente

3. **Gestión en Cocina (Chefs)**
   - Chefs ven pedidos pendientes en tiempo real
   - Pueden marcar pedidos como "en preparación"
   - Pueden marcar pedidos como "listo"

4. **Finalizar Pedido (Venta)**
   - Usuario revisa el pedido completo
   - Selecciona la mesa
   - Ve todos los items pedidos
   - Procede con el pago (efectivo, tarjeta, mixto)
   - Se genera la venta normal del sistema
   - La mesa queda disponible nuevamente

## 🗄️ Estructura de Base de Datos

### Tabla: `mesas`
```sql
CREATE TABLE mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  numero VARCHAR(10) NOT NULL, -- "Mesa 1", "Mesa 2", etc.
  capacidad INTEGER NOT NULL DEFAULT 4, -- Número de personas
  estado VARCHAR(20) DEFAULT 'disponible', -- 'disponible', 'ocupada', 'reservada', 'mantenimiento'
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, numero)
);
```

### Tabla: `pedidos`
```sql
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
  numero_pedido VARCHAR(20) NOT NULL, -- "PED-001", "PED-002", etc.
  estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'en_preparacion', 'listo', 'completado', 'cancelado'
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notas TEXT, -- Notas especiales del cliente
  chef_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Chef asignado
  mesero_id UUID NOT NULL REFERENCES auth.users(id), -- Usuario que tomó el pedido
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completado_at TIMESTAMP WITH TIME ZONE, -- Cuando se convierte en venta
  
  UNIQUE(organization_id, numero_pedido)
);
```

### Tabla: `pedido_items`
```sql
CREATE TABLE pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  precio_total DECIMAL(10, 2) NOT NULL,
  toppings JSONB, -- Array de toppings seleccionados
  notas_item TEXT, -- Notas específicas del item
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla: `organizations` (nuevas columnas)
```sql
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS mesas_habilitadas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pedidos_habilitados BOOLEAN DEFAULT false;
```

### Tabla: `team_members` (nuevo rol)
- Agregar rol `'chef'` a los roles existentes
- Los chefs pueden ver y gestionar pedidos

## 🎨 Interfaz de Usuario

### 1. **Configuración de Facturación** (Nuevas opciones)
```
┌─────────────────────────────────────┐
│  ☑️ Habilitar Sistema de Mesas      │
│  ☑️ Habilitar Sistema de Pedidos    │
└─────────────────────────────────────┘
```

### 2. **Gestión de Mesas** (Nueva página/sección)
- Lista de mesas con estado visual
- Crear/editar/eliminar mesas
- Vista de mesas ocupadas/disponibles
- Solo visible si `mesas_habilitadas = true`

### 3. **Tomar Pedido** (Nueva página o modal desde Caja)
- Selector de mesa (solo mesas disponibles)
- Agregar productos (igual que caja actual)
- Ver pedido actual
- Guardar pedido (sin procesar pago aún)
- Estado: "Pendiente"

### 4. **Panel de Cocina** (Nueva página para Chefs)
- Lista de pedidos pendientes
- Ver detalles del pedido (mesa, items, notas)
- Botones: "En Preparación", "Listo"
- Actualización en tiempo real

### 5. **Finalizar Pedido** (Integrado en Caja)
- Ver pedidos pendientes por mesa
- Seleccionar pedido
- Revisar items
- Proceder con pago normal
- Al completar: mesa queda disponible, pedido marcado como "completado"

## 🔐 Permisos y Roles

### Roles y Acciones
- **Owner/Admin**: 
  - Gestionar mesas
  - Tomar pedidos
  - Finalizar pedidos (venta)
  - Ver todos los pedidos
  
- **Chef**:
  - Ver pedidos pendientes
  - Cambiar estado de pedidos (en preparación, listo)
  - Ver detalles de pedidos
  
- **Mesero/Staff**:
  - Tomar pedidos
  - Ver pedidos de sus mesas
  - Finalizar pedidos (venta)

## 📱 Componentes a Crear

### Nuevos Componentes
1. `GestionMesas.js` - Gestión de mesas (CRUD)
2. `TomarPedido.js` - Interfaz para tomar pedidos
3. `PanelCocina.js` - Vista de chefs para gestionar pedidos
4. `SelectorMesa.js` - Selector de mesa al tomar pedido
5. `ListaPedidos.js` - Lista de pedidos pendientes
6. `PedidoCard.js` - Tarjeta individual de pedido

### Hooks a Crear
1. `useMesas.js` - CRUD de mesas
2. `usePedidos.js` - CRUD de pedidos
3. `usePedidoItems.js` - Gestión de items de pedido

### Páginas a Modificar/Crear
1. `ConfiguracionFacturacion.js` - Agregar toggles para mesas y pedidos
2. `Caja.js` - Integrar finalización de pedidos
3. `PanelCocina.js` (nueva) - Vista para chefs
4. `GestionMesas.js` (nueva página o sección en Inventario)

## 🔄 Flujo Completo Detallado

### Escenario: Cliente llega al restaurante

1. **Mesero toma pedido:**
   - Abre "Tomar Pedido"
   - Selecciona "Mesa 3" (disponible)
   - Agrega productos:
     - 2x Hamburguesa con Queso + Tocino
     - 1x Coca Cola
     - 1x Papas Fritas
   - Agrega nota: "Sin cebolla en las hamburguesas"
   - Click "Guardar Pedido"
   - Estado: Mesa 3 → "Ocupada", Pedido → "Pendiente"

2. **Chef recibe pedido:**
   - Abre "Panel de Cocina"
   - Ve nuevo pedido: "Mesa 3 - PED-001"
   - Click "Ver Detalles"
   - Ve: 2x Hamburguesa con Queso + Tocino (sin cebolla)
   - Click "En Preparación"
   - Estado: Pedido → "En Preparación"

3. **Chef termina preparación:**
   - Click "Listo"
   - Estado: Pedido → "Listo"
   - Notificación al mesero (opcional)

4. **Mesero finaliza pedido:**
   - Va a "Caja"
   - Ve pedidos pendientes
   - Selecciona "Mesa 3 - PED-001"
   - Revisa items y total
   - Click "Continuar con Pago"
   - Selecciona método de pago (efectivo/tarjeta/mixto)
   - Completa la venta
   - Estado: Mesa 3 → "Disponible", Pedido → "Completado"
   - Se genera venta normal en el sistema

## 🎯 Feature Flags

### En `subscriptionFeatures.js`
```javascript
{
  free: {
    // ...
    mesas: false,
    pedidos: false
  },
  professional: {
    // ...
    mesas: true,
    pedidos: true
  },
  enterprise: {
    // ...
    mesas: true,
    pedidos: true
  }
}
```

## 📊 Estados de Mesa

- **disponible**: Mesa libre, lista para usar
- **ocupada**: Mesa con pedido activo
- **reservada**: Mesa reservada (futuro)
- **mantenimiento**: Mesa fuera de servicio

## 📊 Estados de Pedido

- **pendiente**: Pedido recién tomado, esperando en cocina
- **en_preparacion**: Chef está preparando el pedido
- **listo**: Pedido listo para servir
- **completado**: Pedido convertido en venta
- **cancelado**: Pedido cancelado

## 🔔 Notificaciones (Futuro)

- Notificación a chefs cuando hay nuevo pedido
- Notificación a meseros cuando pedido está listo
- Actualización en tiempo real usando Supabase Realtime

## 📝 Consideraciones Técnicas

1. **Números de Pedido**: Generar automáticamente (PED-001, PED-002...)
2. **Actualización de Stock**: Al finalizar pedido (convertir en venta)
3. **Historial**: Todos los pedidos quedan registrados
4. **Reportes**: Análisis de pedidos por mesa, por chef, por hora
5. **Integración con Caja**: Reutilizar lógica de pago existente

## 🚀 Orden de Implementación

1. ✅ Plan y diseño (este documento)
2. ⏳ Migraciones SQL (tablas, RLS, índices)
3. ⏳ Feature flags y configuración
4. ⏳ Gestión de mesas (CRUD)
5. ⏳ Sistema de pedidos (crear, listar)
6. ⏳ Panel de cocina (chefs)
7. ⏳ Integración con Caja (finalizar pedido)
8. ⏳ UI/UX y mejoras visuales
9. ⏳ Testing y ajustes

## ❓ Preguntas Pendientes

1. ¿Los pedidos pueden tener múltiples chefs asignados?
2. ¿Se pueden transferir pedidos entre mesas?
3. ¿Los pedidos tienen tiempo límite?
4. ¿Se pueden modificar pedidos después de guardarlos?
5. ¿Los chefs pueden ver todos los pedidos o solo los asignados?
6. ¿Se necesita impresión de tickets para cocina?

