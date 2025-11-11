# 👥 SISTEMA DE SUSCRIPCIONES MULTI-USUARIO

## 🎯 CONCEPTO CLAVE

**La suscripción está asociada a la ORGANIZACIÓN, NO al usuario individual.**

Esto significa que:
- ✅ **Todos los miembros** de una organización tienen acceso a las mismas funciones
- ✅ El **plan se comparte** entre todos los usuarios del equipo
- ✅ Los **límites son por organización**, no por usuario
- ✅ El **owner paga** y todos los miembros se benefician

---

## 📊 CÓMO FUNCIONA

### Estructura de Datos

```
organizations (tabla)
├── id
├── name
├── owner_id
└── subscription_id ─┐
                     │
subscriptions (tabla)│
├── id ←─────────────┘
├── organization_id
├── plan_id
└── status

team_members (tabla)
├── organization_id (FK)
├── user_id (FK)
└── role
```

### Flujo de Acceso

1. **Usuario inicia sesión** → AuthContext carga memberships
2. **Selecciona organización** → Se carga `organization` en contexto
3. **useSubscription** consulta suscripción de la organización
4. **Todos los componentes** usan `useSubscription()` para verificar acceso
5. **Todos los miembros** obtienen los mismos permisos basados en el plan

---

## 🔐 VERIFICACIÓN DE ACCESO

### Hook useSubscription

```javascript
import { useSubscription } from '../hooks/useSubscription';

const MiComponente = () => {
  const { 
    planName,           // "Gratis", "Profesional", "Empresarial"
    hasFeature,         // hasFeature('importCSV')
    canPerformAction,   // canPerformAction('createProduct')
    checkLimit,         // checkLimit('maxProducts')
    isVIP               // true para desarrolladores
  } = useSubscription();

  // Verificar feature
  if (!hasFeature('importCSV')) {
    return <UpgradePrompt feature="importCSV" />;
  }

  // Verificar límite
  const canCreate = await canPerformAction('createProduct');
  if (!canCreate.allowed) {
    toast.error(canCreate.message);
    return;
  }
};
```

---

## 👨‍👩‍👧‍👦 EJEMPLO PRÁCTICO

### Escenario: Negocio con Plan Profesional

**Organización**: "Mi Negocio S.A.S"  
**Plan**: Profesional ($60,000 COP/mes)  
**Owner**: juanjosegilarbelaez@gmail.com

#### Miembros del Equipo:

1. **Juan José** (Owner)
   - Email: juanjosegilarbelaez@gmail.com
   - Rol: Owner
   - Acceso: ✅ Completo (Profesional)

2. **María** (Admin)
   - Email: maria@minegocio.com
   - Rol: Admin
   - Acceso: ✅ Completo (Profesional)

3. **Carlos** (Vendedor)
   - Email: carlos@minegocio.com
   - Rol: Vendedor
   - Acceso: ✅ Completo (Profesional)

**TODOS tienen las mismas funciones del plan Profesional**:
- ✅ Productos ilimitados
- ✅ Ventas ilimitadas
- ✅ Importar CSV
- ✅ Subir imágenes de productos
- ✅ Gestión de equipo
- ✅ Configuración de facturación

---

## 📱 INTERFAZ DE USUARIO

### Banner de Suscripción (en Perfil)

Todos los usuarios ven en su perfil un banner que muestra:

#### Plan Gratis:
```
┌──────────────────────────────────────────────┐
│ 📦  Plan de tu Organización                  │
│     Tu organización está en el plan gratuito.│
│     Actualiza para desbloquear más funciones.│
│                               [Ver Plan]      │
└──────────────────────────────────────────────┘
```

#### Plan Profesional/Empresarial:
```
┌──────────────────────────────────────────────┐
│ 👑  Plan de tu Organización                  │
│     Tu organización tiene acceso completo    │
│     con el plan Profesional. ¡Disfruta de    │
│     todas las funciones!                     │
│                               [Ver Plan]      │
└──────────────────────────────────────────────┘
```

#### VIP Developer:
```
┌──────────────────────────────────────────────┐
│ ✨  🌟 VIP Developer Access                   │
│     Tienes acceso ilimitado a todas las      │
│     funciones de la plataforma como          │
│     desarrollador VIP.                       │
└──────────────────────────────────────────────┘
```

---

## 🔄 CAMBIO DE PLAN

### ¿Quién puede cambiar el plan?

Solo el **Owner** de la organización puede:
- Ver la página de precios
- Seleccionar un nuevo plan
- Procesar el pago
- Cancelar la suscripción

### Efecto en los miembros:

Cuando el owner actualiza el plan:
1. **Actualización instantánea**: La suscripción se actualiza en la BD
2. **Recarga automática**: `useSubscription` detecta el cambio
3. **Nuevas funciones**: Todos los miembros obtienen acceso inmediatamente
4. **Sin re-login**: No es necesario cerrar sesión

---

## 🚫 LÍMITES COMPARTIDOS

Los límites son **por organización**, NO por usuario.

### Ejemplo: Plan Gratis

**Límites**:
- 20 productos máximo
- 50 ventas/mes
- 1 usuario

Si la organización tiene:
- 15 productos creados por Juan
- 5 productos creados por María
- **Total: 20/20** → Límite alcanzado

Ningún miembro puede crear más productos hasta:
- Borrar productos existentes, o
- Actualizar a plan Profesional

---

## 📊 LOGS Y DEBUG

### Console Logs del Sistema

Al cargar la aplicación, verás en consola:

```javascript
// Usuario VIP
🌟 VIP User detected - Full access granted

// Usuario con suscripción activa
✅ Organization subscription loaded: Profesional (professional)
   All members of "Mi Negocio S.A.S" have Profesional access

// Usuario sin suscripción
No active subscription found, using free plan
```

Esto confirma que el sistema está funcionando correctamente.

---

## 🎨 BADGES VISUALES

### En Inventario

Todos los miembros ven el mismo badge en Inventario:

- **VIP**: Badge dorado con Crown y Sparkles
- **Gratis**: Badge violeta mostrando "15 / 20 productos"
- **Profesional+**: Badge verde con "Acceso Completo"

---

## ⚙️ CONFIGURACIÓN TÉCNICA

### Base de Datos

```sql
-- Suscripción está en organizations
ALTER TABLE organizations 
ADD COLUMN subscription_id UUID REFERENCES subscriptions(id);

-- Todos los miembros tienen FK a organization
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT
);
```

### RLS Policies

```sql
-- Los miembros pueden ver datos de su organización
CREATE POLICY "Members can view org data"
ON productos FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM team_members 
    WHERE user_id = auth.uid()
  )
);
```

---

## 🔍 VERIFICACIÓN

### Cómo confirmar que funciona:

1. **Crear organización** con plan Profesional
2. **Invitar miembros** al equipo
3. **Iniciar sesión** con cuenta de miembro (no owner)
4. **Verificar acceso**:
   - ✅ Puede crear productos ilimitados
   - ✅ Puede importar CSV
   - ✅ Puede subir imágenes
   - ✅ Ve el mismo badge de plan

5. **Verificar consola**:
   ```
   ✅ Organization subscription loaded: Profesional
      All members of "Mi Negocio" have Profesional access
   ```

---

## 💡 PREGUNTAS FRECUENTES

### ¿Cada usuario necesita su propia suscripción?
❌ **NO**. La suscripción es de la organización, no del usuario.

### ¿Un vendedor tiene acceso completo si la org es Pro?
✅ **SÍ**. Todos los miembros tienen las mismas funciones del plan.

### ¿Los límites son por usuario o por organización?
📦 **Por organización**. Si la org tiene 20 productos, es el límite total para todos.

### ¿Qué pasa si el owner cancela el plan?
⬇️ **Downgrade a Gratis**. Todos los miembros pierden acceso a funciones Pro.

### ¿Puedo tener diferentes planes en diferentes organizaciones?
✅ **SÍ**. Si perteneces a múltiples orgs, cada una tiene su propio plan.

### ¿Cómo sé qué plan tiene mi organización?
📊 **Perfil → Datos Personales** → Ver banner de suscripción.

---

## 🎯 CASOS DE USO

### Caso 1: Tienda con 3 empleados

**Setup**:
- Owner: Gerente (paga la suscripción)
- Admin: Contador
- Vendedor: Empleado de mostrador

**Plan**: Profesional ($60k/mes)

**Beneficios**:
- El gerente paga $60k/mes
- Los 3 empleados pueden usar todas las funciones
- Productos ilimitados compartidos
- Ventas ilimitadas compartidas

### Caso 2: Freelancer con asistente

**Setup**:
- Owner: Freelancer
- Admin: Asistente virtual

**Plan**: Gratis (para probar)

**Límites**:
- 20 productos totales (entre los dos)
- 50 ventas/mes totales
- No pueden importar CSV
- No pueden subir imágenes

**Upgrade**:
- Freelancer actualiza a Profesional
- Asistente automáticamente obtiene acceso completo
- Sin necesidad de configurar nada adicional

---

## 🔒 SEGURIDAD

### Aislamiento de Datos

Cada organización tiene datos completamente aislados:

```javascript
// RLS asegura que solo vean datos de su org
WHERE organization_id IN (
  SELECT organization_id 
  FROM team_members 
  WHERE user_id = auth.uid()
)
```

### Permisos por Rol

- **Owner**: Gestiona suscripción, invita miembros, elimina organización
- **Admin**: Todas las funciones operativas
- **Vendedor**: Ventas, productos, reportes

Pero **TODOS** tienen acceso a las funciones del plan (Pro/Empresarial).

---

## 📈 ESCALABILIDAD

### Plan Empresarial

- Permite múltiples organizaciones para un owner
- Cada organización tiene su propio equipo
- Límites más altos o ilimitados

### Ejemplo:
```
Owner: juan@email.com (Plan Empresarial)
├── Organización 1: "Tienda A"
│   ├── 5 miembros
│   └── Acceso Empresarial
├── Organización 2: "Tienda B"
│   ├── 3 miembros
│   └── Acceso Empresarial
└── Organización 3: "Tienda C"
    ├── 2 miembros
    └── Acceso Empresarial
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Tabla `subscriptions` vinculada a `organizations`
- [x] Hook `useSubscription` carga plan de organización
- [x] Todos los componentes usan `useSubscription`
- [x] RLS policies filtran por organization_id
- [x] Banner visual muestra plan en Perfil
- [x] Logs en consola confirman carga de plan
- [x] Limits compartidos entre miembros
- [x] Features habilitadas para todos los miembros

---

## 🎉 CONCLUSIÓN

El sistema está diseñado para **colaboración en equipo**:

- ✅ Una suscripción = Todo el equipo con acceso
- ✅ Fácil de entender para los usuarios
- ✅ Escalable con múltiples organizaciones
- ✅ Límites claros y compartidos
- ✅ Sin confusión sobre permisos

**¡Todos los miembros de una organización Pro pueden hacer TODAS las funciones Pro!** 🚀
