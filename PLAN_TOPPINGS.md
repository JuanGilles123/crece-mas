# 🍔 PLAN DE IMPLEMENTACIÓN: SISTEMA DE TOPPINGS

## 📋 RESUMEN
Sistema de toppings (ingredientes adicionales) para negocios de comida, disponible solo para suscripciones premium y cuando el tipo de negocio sea "food".

---

## 🎯 REQUISITOS

### Condiciones de Activación
1. ✅ **Suscripción Premium**: Solo planes `professional`, `enterprise` o `custom`
2. ✅ **Tipo de Negocio**: Solo si `business_type === 'food'`
3. ✅ **Configuración**: El propietario debe configurar el tipo de negocio desde Configuración

### Funcionalidades
1. **Gestión de Toppings**:
   - Crear, editar, eliminar toppings
   - Cada topping tiene: nombre, precio, stock
   - Los toppings se incluyen en el inventario

2. **En Ventas (Caja)**:
   - Al agregar un producto al carrito, preguntar si lleva toppings
   - Mostrar lista de toppings disponibles
   - Permitir selección múltiple
   - Sumar precio de toppings al precio del producto
   - Actualizar stock de toppings al completar venta

3. **Permisos**:
   - Solo usuarios con permisos de inventario pueden gestionar toppings
   - Los empleados pueden seleccionar toppings en ventas

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Nueva Tabla: `toppings`
```sql
CREATE TABLE toppings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT toppings_organization_fkey FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_toppings_organization ON toppings(organization_id);
CREATE INDEX idx_toppings_activo ON toppings(organization_id, activo) WHERE activo = true;

-- RLS Policies
ALTER TABLE toppings ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden ver toppings de su organización
CREATE POLICY "Users can view toppings from their organization"
  ON toppings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Policy: Solo owners/admins pueden modificar toppings
CREATE POLICY "Owners and admins can manage toppings"
  ON toppings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND organization_id = toppings.organization_id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND organization_id = toppings.organization_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );
```

### Modificación de Tabla: `ventas`
Los items ya están en formato JSON, solo necesitamos extender la estructura:

**Estructura actual de items:**
```json
[
  {
    "id": "producto-id",
    "nombre": "Hamburguesa",
    "precio_venta": 15000,
    "qty": 1
  }
]
```

**Nueva estructura con toppings:**
```json
[
  {
    "id": "producto-id",
    "nombre": "Hamburguesa",
    "precio_venta": 15000,
    "qty": 1,
    "toppings": [
      {
        "id": "topping-id-1",
        "nombre": "Queso",
        "precio": 2000,
        "cantidad": 1
      },
      {
        "id": "topping-id-2",
        "nombre": "Tocino",
        "precio": 3000,
        "cantidad": 1
      }
    ],
    "precio_total": 20000  // precio_venta + sum(toppings.precio)
  }
]
```

---

## 🔧 CAMBIOS EN EL CÓDIGO

### 1. **Feature Flag en `subscriptionFeatures.js`**
```javascript
// Agregar en cada plan:
features: {
  // ... features existentes
  toppings: false,  // Para free
  toppings: true,   // Para professional, enterprise, custom
}
```

### 2. **Configuración de Tipo de Negocio**
- **Archivo**: `src/components/ConfiguracionFacturacion.js`
- **Cambio**: Agregar selector de `business_type` si no existe
- **Opciones**: `food`, `clothing`, `retail`, `other`
- **Validación**: Solo propietario puede cambiar

### 3. **Hook `useToppings`**
- **Archivo**: `src/hooks/useToppings.js` (nuevo)
- **Funciones**:
  - `useToppings(organizationId)` - Obtener toppings
  - `useCrearTopping()` - Crear topping
  - `useActualizarTopping()` - Actualizar topping
  - `useEliminarTopping()` - Eliminar topping
  - `useActualizarStockTopping()` - Actualizar stock

### 4. **Componente de Gestión de Toppings**
- **Archivo**: `src/components/GestionToppings.js` (nuevo)
- **Ubicación**: Sección en `Inventario.js` (solo visible si cumple condiciones)
- **Funcionalidades**:
  - Lista de toppings
  - Modal para crear/editar
  - Eliminar con confirmación
  - Filtros y búsqueda

### 5. **Modificación de `Caja.js`**
- **Al agregar producto al carrito**:
  - Si `business_type === 'food'` y tiene suscripción premium:
    - Mostrar modal preguntando si lleva toppings
    - Si sí, mostrar lista de toppings disponibles
    - Permitir selección múltiple
    - Calcular precio total (producto + toppings)
  
- **Estructura del carrito**:
  ```javascript
  {
    id: producto.id,
    nombre: producto.nombre,
    precio_venta: producto.precio_venta,
    qty: 1,
    toppings: [
      { id: topping.id, nombre: topping.nombre, precio: topping.precio, cantidad: 1 }
    ],
    precio_total: producto.precio_venta + sum(toppings.precio)
  }
  ```

- **Al confirmar venta**:
  - Actualizar stock de toppings seleccionados
  - Guardar estructura completa en `items` de la venta

### 6. **Helper para Verificar Acceso a Toppings**
- **Archivo**: `src/utils/toppingsUtils.js` (nuevo)
- **Función**: `canUseToppings(organization, subscription)`
  - Verifica `business_type === 'food'`
  - Verifica suscripción premium
  - Retorna `{ canUse: boolean, reason?: string }`

---

## 🎨 INTERFAZ DE USUARIO

### 1. **Sección de Toppings en Inventario**
- Solo visible si:
  - `business_type === 'food'`
  - Tiene suscripción premium
  - Tiene permisos de inventario
- Botón "Gestionar Toppings" que abre modal
- Lista de toppings con: nombre, precio, stock, acciones

### 2. **Modal de Selección de Toppings (Caja)**
- Aparece después de agregar producto al carrito
- Pregunta: "¿Este producto lleva toppings?"
- Si sí:
  - Lista de toppings disponibles (solo con stock > 0)
  - Checkboxes para selección múltiple
  - Precio de cada topping visible
  - Total calculado en tiempo real
  - Botones: "Agregar sin toppings", "Agregar con toppings"

### 3. **Visualización en Carrito**
- Si un item tiene toppings, mostrar:
  ```
  Hamburguesa                    $15,000
    + Queso ($2,000)
    + Tocino ($3,000)
  Subtotal: $20,000
  ```

---

## 🔐 PERMISOS Y SEGURIDAD

### Permisos Requeridos
- **Gestionar Toppings**: `inventoryBasic` o `inventoryAdvanced`
- **Seleccionar en Ventas**: `quickSale` o `advancedSale`

### Validaciones
1. Solo organizaciones con `business_type = 'food'` pueden usar toppings
2. Solo suscripciones premium tienen acceso
3. Stock de toppings se valida antes de agregar al carrito
4. Stock se actualiza al completar venta

---

## 📝 FLUJO DE USO

### Configuración Inicial (Propietario)
1. Ir a Configuración → Facturación
2. Seleccionar tipo de negocio: "Comida"
3. Guardar cambios
4. Ir a Inventario → Sección "Toppings"
5. Crear toppings (ej: Queso, Tocino, Lechuga, etc.)

### Uso en Ventas (Cajero)
1. Agregar producto al carrito
2. Sistema pregunta: "¿Lleva toppings?"
3. Si sí:
   - Seleccionar toppings deseados
   - Ver precio total actualizado
   - Confirmar
4. Producto se agrega al carrito con toppings
5. Al completar venta, stock de toppings se actualiza

---

## 🧪 CASOS DE PRUEBA

1. ✅ Negocio tipo "food" con premium → Puede usar toppings
2. ✅ Negocio tipo "food" sin premium → No puede usar toppings
3. ✅ Negocio tipo "retail" con premium → No puede usar toppings
4. ✅ Agregar producto con toppings → Stock se actualiza correctamente
5. ✅ Topping sin stock → No aparece en lista de selección
6. ✅ Venta con toppings → Se guarda correctamente en items
7. ✅ Empleado sin permisos → No puede gestionar toppings pero sí usarlos en ventas

---

## 📦 ARCHIVOS A CREAR/MODIFICAR

### Nuevos Archivos
- `src/hooks/useToppings.js`
- `src/components/GestionToppings.js`
- `src/components/ToppingsSelector.js` (modal para seleccionar)
- `src/utils/toppingsUtils.js`
- `supabase/migrations/XXXX_create_toppings_table.sql`

### Archivos a Modificar
- `src/constants/subscriptionFeatures.js` - Agregar feature `toppings`
- `src/components/ConfiguracionFacturacion.js` - Agregar selector de tipo de negocio
- `src/pages/Inventario.js` - Agregar sección de toppings
- `src/pages/Caja.js` - Modificar flujo de agregar productos
- `src/hooks/useVentas.js` - Actualizar para manejar stock de toppings

---

## ⚠️ CONSIDERACIONES IMPORTANTES

1. **Migración de Datos**: Las ventas existentes no tienen toppings, esto es normal
2. **Compatibilidad**: El sistema debe funcionar sin toppings si no están configurados
3. **Performance**: Los toppings se cargan una vez al iniciar Caja, no en cada producto
4. **UX**: El modal de toppings debe ser rápido y no interrumpir el flujo de venta
5. **Stock**: Validar stock antes de permitir selección
6. **Precios**: Los precios de toppings se suman al precio base del producto

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

1. ✅ Crear plan (este documento)
2. ⏳ Agregar feature flag en subscriptionFeatures
3. ⏳ Agregar selector de tipo de negocio en Configuración
4. ⏳ Crear migración SQL para tabla toppings
5. ⏳ Crear hook useToppings
6. ⏳ Crear componente GestionToppings
7. ⏳ Integrar en Inventario.js
8. ⏳ Crear componente ToppingsSelector
9. ⏳ Modificar Caja.js para usar toppings
10. ⏳ Actualizar lógica de ventas para manejar stock
11. ⏳ Pruebas y ajustes

---

## 📊 MÉTRICAS DE ÉXITO

- ✅ Toppings solo disponibles para negocios de comida con premium
- ✅ Stock de toppings se actualiza correctamente
- ✅ Precios se calculan correctamente
- ✅ Interfaz intuitiva y rápida
- ✅ Sin errores en consola
- ✅ Performance aceptable (< 100ms para cargar toppings)

---

**Estado**: 📝 Planificación completada - Listo para implementación


