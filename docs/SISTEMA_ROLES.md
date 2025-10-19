# 👥 Sistema de Roles y Gestión de Equipos - Crece+

## 📋 Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Roles Disponibles](#roles-disponibles)
- [Configuración Inicial](#configuración-inicial)
- [Flujo de Invitaciones](#flujo-de-invitaciones)
- [Gestión de Permisos](#gestión-de-permisos)
- [Uso en la Aplicación](#uso-en-la-aplicación)
- [Límites por Plan](#límites-por-plan)
- [Preguntas Frecuentes](#preguntas-frecuentes)

---

## 🎯 Descripción General

El sistema de roles y equipos de **Crece+** permite a los dueños de negocios gestionar su personal de manera eficiente, asignando permisos específicos según las responsabilidades de cada empleado.

### **Beneficios:**
- ✅ Control granular de accesos
- ✅ Gestión de múltiples empleados
- ✅ Invitaciones por email
- ✅ Auditoría de acciones por usuario
- ✅ Seguridad a nivel de base de datos (RLS)

---

## 👑 Roles Disponibles

### **1. OWNER (Propietario)**
**Descripción:** El dueño del negocio. Tiene acceso completo e irrestricto.

**Permisos:**
- ✅ Ver dashboard completo
- ✅ Realizar y gestionar ventas
- ✅ Gestionar inventario (agregar, editar, eliminar productos)
- ✅ Ver todos los reportes y estadísticas
- ✅ Configurar datos de empresa y facturación
- ✅ **Gestionar equipo** (invitar, remover, cambiar roles)
- ✅ Gestionar facturación y planes
- ✅ Acceso a todas las configuraciones

**Uso típico:** Dueño del restaurante, tienda o negocio.

---

### **2. ADMIN (Administrador)**
**Descripción:** Gerente o administrador de confianza. Acceso casi total excepto facturación.

**Permisos:**
- ✅ Ver dashboard completo
- ✅ Realizar y gestionar ventas
- ✅ Gestionar inventario completo
- ✅ Ver todos los reportes
- ✅ Configurar datos de empresa
- ✅ **Gestionar equipo** (invitar y remover empleados)
- ❌ **NO** puede gestionar facturación ni planes
- ❌ **NO** puede eliminar la organización

**Uso típico:** Gerente general, administrador de sucursal.

---

### **3. INVENTORY_MANAGER (Encargado de Inventario)**
**Descripción:** Responsable de la gestión del inventario y puede realizar ventas.

**Permisos:**
- ✅ Ver dashboard básico
- ✅ Realizar ventas
- ✅ **Gestionar inventario completo** (agregar, editar, eliminar productos)
- ✅ Importar productos por CSV/Excel
- ❌ **NO** puede ver reportes financieros detallados
- ❌ **NO** puede gestionar equipo
- ❌ **NO** puede cambiar configuraciones de empresa

**Uso típico:** Encargado de bodega, supervisor de inventario.

---

### **4. CASHIER (Cajero)**
**Descripción:** Empleado que solo opera la caja registradora.

**Permisos:**
- ✅ **Acceso SOLO al módulo de Caja**
- ✅ Realizar ventas
- ✅ Ver productos (solo lectura)
- ✅ Generar recibos
- ❌ **NO** puede editar productos
- ❌ **NO** puede ver reportes
- ❌ **NO** puede ver dashboard
- ❌ **NO** puede gestionar inventario

**Uso típico:** Cajero de restaurante, empleado de mostrador.

---

### **5. VIEWER (Visualizador)**
**Descripción:** Solo puede ver reportes y estadísticas. Sin permisos de edición.

**Permisos:**
- ✅ Ver dashboard de reportes
- ✅ Ver estadísticas de ventas
- ✅ Exportar reportes
- ❌ **NO** puede realizar ventas
- ❌ **NO** puede editar inventario
- ❌ **NO** puede ver módulo de caja
- ❌ **NO** puede gestionar equipo

**Uso típico:** Contador, auditor, socio inversionista.

---

## 🚀 Configuración Inicial

### **Paso 1: Ejecutar Script SQL**

1. Ve a **Supabase Dashboard → SQL Editor**
2. Abre el archivo `setup_roles_equipos.sql`
3. Copia todo el contenido y pégalo en el editor
4. Haz clic en **"Run"** para ejecutar

El script creará automáticamente:
- ✅ Tablas: `user_profiles`, `organizations`, `team_members`, `team_invitations`
- ✅ Funciones: `create_user_profile_and_organization`, `accept_invitation`, `get_user_permissions`
- ✅ Triggers: Creación automática de organización al registrarse
- ✅ Políticas RLS: Seguridad a nivel de base de datos
- ✅ Índices: Para optimizar consultas

### **Paso 2: Verificar la Instalación**

Verifica que las tablas fueron creadas:

```sql
-- En Supabase SQL Editor
SELECT * FROM user_profiles LIMIT 5;
SELECT * FROM organizations LIMIT 5;
SELECT * FROM team_members LIMIT 5;
SELECT * FROM team_invitations LIMIT 5;
```

### **Paso 3: Primer Usuario (Automático)**

Al registrarse, cada usuario automáticamente:
1. Se crea un perfil con rol **`owner`**
2. Se crea una organización con su nombre
3. Se agrega como miembro del equipo con permisos completos

---

## 📧 Flujo de Invitaciones

### **Cómo invitar un empleado:**

#### **1. Desde el Dashboard (Owner/Admin)**

1. Ve a **Dashboard → Equipo**
2. Haz clic en **"Invitar Miembro"**
3. Completa el formulario:
   - **Email:** email@ejemplo.com
   - **Rol:** Selecciona el rol apropiado
   - **Mensaje (opcional):** Mensaje de bienvenida personalizado
4. Haz clic en **"Enviar Invitación"**

#### **2. El invitado recibe la invitación:**

**Opción A: Usuario ya registrado en Crece+**
1. Al iniciar sesión, verá sus invitaciones pendientes
2. Puede ir a `/invitaciones` para ver detalles
3. Acepta o rechaza la invitación

**Opción B: Usuario nuevo (sin cuenta)**
1. El owner le comparte el link de invitación
2. El usuario debe registrarse primero en Crece+
3. Después de registrarse, puede aceptar la invitación
4. Será agregado al equipo automáticamente

#### **3. Aceptación de Invitación:**

Cuando el empleado acepta:
- ✅ Se agrega a `team_members` con el rol asignado
- ✅ Su perfil se actualiza con el nuevo rol
- ✅ Obtiene acceso a la organización
- ✅ La invitación se marca como "aceptada"
- ✅ Es redirigido al dashboard con los permisos correspondientes

#### **4. Expiración de Invitaciones:**

- Las invitaciones expiran en **7 días**
- El owner puede cancelar invitaciones antes de que sean aceptadas
- Las invitaciones expiradas no pueden ser aceptadas

---

## 🔐 Gestión de Permisos

### **Uso en Componentes**

El hook `useAuth` proporciona funciones para verificar permisos:

```javascript
import { useAuth } from '../context/AuthContext';

function MiComponente() {
  const { hasPermission, hasRole, userProfile, organization } = useAuth();

  // Verificar permiso específico
  if (hasPermission('inventory')) {
    // Mostrar opciones de inventario
  }

  // Verificar rol
  if (hasRole('owner', 'admin')) {
    // Mostrar opciones de administración
  }

  // Obtener datos del usuario
  console.log(userProfile.role); // 'owner', 'admin', etc.
  console.log(organization.name); // Nombre de la organización
}
```

### **Permisos por Módulo**

```javascript
// Matriz de permisos
const PERMISSIONS = {
  owner: {
    dashboard: true,
    sales: true,
    inventory: true,
    reports: true,
    settings: true,
    team: true,
    billing: true
  },
  admin: {
    dashboard: true,
    sales: true,
    inventory: true,
    reports: true,
    settings: true,
    team: true,
    billing: false // ❌ No puede gestionar facturación
  },
  inventory_manager: {
    dashboard: true,
    sales: true,
    inventory: true,
    reports: false,
    settings: false,
    team: false,
    billing: false
  },
  cashier: {
    dashboard: false,
    sales: true, // ✅ Solo caja
    inventory: false,
    reports: false,
    settings: false,
    team: false,
    billing: false
  },
  viewer: {
    dashboard: true,
    sales: false,
    inventory: false,
    reports: true, // ✅ Solo reportes
    settings: false,
    team: false,
    billing: false
  }
};
```

### **Ocultar elementos del menú según rol**

En `DashboardLayout.js` ya está implementado:

```javascript
const menuItems = [
  { 
    to: "/dashboard/caja", 
    label: "Caja", 
    visible: hasPermission('sales') // Solo visible si tiene permiso
  },
  { 
    to: "/dashboard/equipo", 
    label: "Equipo", 
    visible: hasRole('owner', 'admin') // Solo owner y admin
  }
].filter(item => item.visible);
```

---

## 💻 Uso en la Aplicación

### **Hooks Disponibles**

#### **1. useUserRole(userId)**
Obtiene el perfil y rol del usuario.

```javascript
const { data: userProfile, isLoading } = useUserRole(user.id);
// userProfile = { role: 'owner', full_name: 'Juan', ... }
```

#### **2. useUserOrganization(userId)**
Obtiene la organización del usuario.

```javascript
const { data: organization } = useUserOrganization(user.id);
// organization = { name: 'Mi Negocio', business_type: 'food', ... }
```

#### **3. useTeamMembers(organizationId)**
Lista todos los miembros del equipo.

```javascript
const { data: members, isLoading } = useTeamMembers(organization.id);
// members = [{ user_id, role, email, full_name, ... }]
```

#### **4. useInvitations(organizationId)**
Lista invitaciones pendientes.

```javascript
const { data: invitations } = useInvitations(organization.id);
// invitations = [{ email, role, status, expires_at, ... }]
```

#### **5. useMyInvitations(userEmail)**
Invitaciones del usuario actual como invitado.

```javascript
const { data: myInvites } = useMyInvitations(user.email);
```

### **Mutaciones Disponibles**

#### **Crear Invitación**
```javascript
const createInvitation = useCreateInvitation();

await createInvitation.mutateAsync({
  organizationId: org.id,
  email: 'empleado@ejemplo.com',
  role: 'cashier',
  message: '¡Bienvenido al equipo!'
});
```

#### **Aceptar Invitación**
```javascript
const acceptInvitation = useAcceptInvitation();

await acceptInvitation.mutateAsync(token);
```

#### **Actualizar Rol**
```javascript
const updateRole = useUpdateMemberRole();

await updateRole.mutateAsync({
  memberId: member.id,
  newRole: 'admin',
  organizationId: org.id
});
```

#### **Remover Miembro**
```javascript
const removeMember = useRemoveTeamMember();

await removeMember.mutateAsync({
  memberId: member.id,
  organizationId: org.id
});
```

---

## 📊 Límites por Plan

### **Plan FREE**
- ✅ 1 owner
- ✅ 2 miembros adicionales
- ✅ **Total: 3 usuarios**

### **Plan BASIC**
- ✅ 1 owner
- ✅ 9 miembros adicionales
- ✅ **Total: 10 usuarios**

### **Plan PRO**
- ✅ 1 owner
- ✅ 24 miembros adicionales
- ✅ **Total: 25 usuarios**

### **Plan ENTERPRISE**
- ✅ 1 owner
- ✅ Miembros ilimitados
- ✅ Soporte prioritario

---

## ❓ Preguntas Frecuentes

### **¿Puedo tener múltiples owners?**
No. Solo puede haber un owner por organización. Sin embargo, puedes asignar el rol de **admin** a otros usuarios que tendrán casi los mismos permisos.

### **¿Qué pasa si invito a alguien que no tiene cuenta?**
La persona debe registrarse primero en Crece+ antes de aceptar la invitación. Puedes compartirle el link de invitación y ellos lo usarán después de crear su cuenta.

### **¿Puedo cambiar el rol de un miembro después?**
Sí. Los owners y admins pueden cambiar los roles de los miembros en cualquier momento desde la página de Gestión de Equipo.

### **¿Un empleado puede pertenecer a múltiples organizaciones?**
Sí. Un usuario puede ser invitado a múltiples organizaciones y tendrá diferentes roles en cada una.

### **¿Las invitaciones expiran?**
Sí, las invitaciones expiran después de 7 días. El owner puede volver a enviar una nueva invitación si es necesario.

### **¿Cómo remuevo a un empleado?**
Ve a Dashboard → Equipo, busca al miembro y haz clic en el botón de eliminar. Esto desactivará su acceso inmediatamente.

### **¿Los empleados removidos pueden volver a unirse?**
Sí, el owner puede enviar una nueva invitación. El empleado removido no pierde su cuenta, solo pierde acceso a esa organización específica.

### **¿Qué ve un cajero al iniciar sesión?**
Un cajero solo verá el módulo de **Caja** en el menú. No tendrá acceso a inventario, reportes ni configuraciones.

---

## 🛡️ Seguridad

### **Row Level Security (RLS)**
Todas las tablas tienen políticas RLS que garantizan:
- Los usuarios solo ven datos de su organización
- Solo owners/admins pueden invitar miembros
- Solo owners/admins pueden cambiar roles
- Los datos están protegidos a nivel de base de datos

### **Auditoría**
Cada acción queda registrada:
- Quién invitó a cada miembro (`invited_by`)
- Cuándo se unió cada miembro (`joined_at`)
- Cambios de rol (pueden implementarse logs adicionales)

---

## 📚 Recursos Adicionales

### **Archivos Relacionados:**
- `setup_roles_equipos.sql` - Script de configuración de base de datos
- `src/hooks/useTeam.js` - Hooks de React Query
- `src/pages/GestionEquipo.js` - Componente de gestión
- `src/pages/Invitaciones.js` - Página de invitaciones
- `src/context/AuthContext.js` - Context con información de roles

### **Tablas de Base de Datos:**
- `user_profiles` - Perfiles de usuario
- `organizations` - Organizaciones/negocios
- `team_members` - Relación usuario-organización
- `team_invitations` - Invitaciones pendientes

---

## ✅ Checklist de Implementación

- [x] Script SQL ejecutado en Supabase
- [x] Hooks personalizados creados
- [x] AuthContext actualizado con roles
- [x] Página de gestión de equipo implementada
- [x] Página de invitaciones creada
- [x] Dashboard actualizado con control de permisos
- [x] Menú dinámico según rol
- [x] Sistema de invitaciones funcional
- [x] Políticas RLS configuradas
- [x] Documentación completa

---

¡El sistema de roles está completo y listo para usar! 🎉
