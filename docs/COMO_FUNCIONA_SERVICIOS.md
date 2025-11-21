# 🎯 Cómo Funciona el Sistema de Servicios y Adicionales

## 📋 Conceptos Clave

### 1. **Tipo de Negocio** (Configuración de Facturación)
El tipo de negocio se define en **Configuración de Facturación** y puede ser:
- `food` - Negocio de comida (restaurantes, cafeterías)
- `service` - Negocio de servicios (barberías, salones de belleza, etc.)
- `other` - Otros tipos de negocio

### 2. **Productos vs Servicios**
Cuando el negocio es tipo **`service`**, al agregar un producto puedes elegir:

#### 📦 **Producto Físico**
- Tiene stock (ej: champú, tijeras, productos de venta)
- Se gestiona como inventario normal
- Ejemplo: "Champú Profesional" - stock: 50 unidades

#### 💇‍♂️ **Servicio**
- NO tiene stock (es intangible)
- Se vende como servicio
- Ejemplo: "Corte de Cabello" - sin stock

### 3. **Toppings/Adicionales**
Los toppings/adicionales son **extras** que se pueden agregar a cualquier producto o servicio durante la venta:

#### Para Negocios de Comida (`food`):
- **Toppings** con stock (ej: Queso, Tocino, Lechuga)
- Se muestran como "Toppings"
- Ejemplo: Hamburguesa + Queso + Tocino

#### Para Negocios de Servicios (`service`):
- **Adicionales** sin stock (ej: Barba, Cejas, Mascarilla)
- Se muestran como "Adicionales"
- Ejemplo: Corte de Cabello + Barba + Cejas

## 🔄 Flujo de Trabajo para una Barbería

### Paso 1: Configurar Tipo de Negocio
1. Ir a **Configuración de Facturación**
2. Seleccionar tipo de negocio: **"Servicios"** 💇‍♂️
3. Guardar

### Paso 2: Crear Servicios Base
1. Ir a **Inventario**
2. Click en **"Agregar Producto"**
3. Seleccionar **"💇‍♂️ Servicio"**
4. Crear servicios como:
   - "Corte de Cabello" - $15.000
   - "Corte + Barba" - $20.000
   - "Afeitado" - $10.000

### Paso 3: Crear Adicionales (Toppings)
1. En **Inventario**, ir a la sección **"Gestión de Adicionales"**
2. Crear adicionales como:
   - "Barba" - $5.000 (sin stock)
   - "Cejas" - $3.000 (sin stock)
   - "Mascarilla Facial" - $8.000 (sin stock)

### Paso 4: Realizar Ventas
1. En **Caja**, seleccionar un servicio (ej: "Corte de Cabello")
2. El sistema pregunta: **"¿Desea agregar adicionales?"**
3. Seleccionar adicionales (ej: Barba + Cejas)
4. El precio total será: $15.000 (Corte) + $5.000 (Barba) + $3.000 (Cejas) = **$23.000**

## 📊 Ejemplo Completo: Venta en Barbería

### Producto/Servicio Base:
- **Corte de Cabello** - $15.000 (tipo: servicio, sin stock)

### Adicionales Seleccionados:
- **Barba** - $5.000 x 1
- **Cejas** - $3.000 x 1

### Total en Factura:
```
Corte de Cabello              $15.000
  + Barba (1x)                $ 5.000
  + Cejas (1x)                $ 3.000
─────────────────────────────────────
TOTAL                         $23.000
```

## ⚙️ Diferencias Técnicas

| Característica | Producto Físico | Servicio | Adicional (Topping) |
|---------------|----------------|----------|---------------------|
| Tiene Stock | ✅ Sí | ❌ No | ✅ Sí (comida) / ❌ No (servicios) |
| Se muestra en Inventario | ✅ Sí | ✅ Sí | ✅ Sí (sección separada) |
| Se puede vender solo | ✅ Sí | ✅ Sí | ❌ No (solo como extra) |
| Actualiza stock al vender | ✅ Sí | ❌ No | ✅ Sí (solo si tiene stock) |

## 🎨 Interfaz de Usuario

### Al Agregar Producto (negocio tipo `service`):
```
┌─────────────────────────────────────┐
│  📦 Producto Físico  │  💇‍♂️ Servicio  │
└─────────────────────────────────────┘
```

### Al Agregar al Carrito:
- Si es **servicio** → Muestra: "¿Desea agregar adicionales?"
- Si es **producto físico** → Muestra: "¿Lleva toppings?" (si es negocio de comida)

## ✅ Checklist de Configuración

- [ ] Configurar tipo de negocio en **Configuración de Facturación**
- [ ] Ejecutar migración SQL: `docs/ADD_TIPO_TO_PRODUCTOS.sql`
- [ ] Ejecutar migración SQL: `docs/ADD_TIPO_TO_TOPPINGS.sql`
- [ ] Crear servicios base en Inventario
- [ ] Crear adicionales en la sección de Gestión de Adicionales
- [ ] Probar una venta con servicio + adicionales

