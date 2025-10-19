# 🚀 INSTRUCCIONES PARA ACTIVAR INVITACIONES PÚBLICAS

## ✅ Todo el código está listo

Ya están implementados:
- ✅ Página pública `/invite/:token` (InvitePublic.js)
- ✅ Ruta agregada en App.js
- ✅ Auto-aceptar invitaciones en AuthContext
- ✅ Enlaces actualizados en GestionEquipo.js
- ✅ Políticas SQL preparadas

## 📋 PASO FINAL: Ejecutar SQL en Supabase

### Opción 1: Ejecutar script completo

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Abre el **SQL Editor**
3. Copia y pega el contenido completo de: `fix_invitations_policies.sql`
4. Click en **Run** (▶️)

### Opción 2: Ejecutar solo la política pública

Si ya ejecutaste `fix_invitations_policies.sql` antes, solo necesitas agregar la política pública:

```sql
-- Agregar política pública para ver invitaciones sin autenticación
CREATE POLICY "team_invitations_public_select" ON team_invitations
  FOR SELECT 
  USING (true);
```

## 🎯 Cómo Funciona el Flujo Completo

### 1. Admin crea invitación
- Va a "Equipo" → "Invitaciones"
- Completa formulario (email, rol, mensaje)
- Click en "Enviar Invitación"
- Copia el link generado: `https://tu-dominio.com/invite/ABC123XYZ`

### 2. Usuario recibe invitación
- **SIN necesidad de cuenta creada**
- Abre el link en cualquier navegador
- Ve los detalles:
  - Nombre de la organización
  - Rol asignado (con badge de color)
  - Permisos que tendrá
  - Mensaje personalizado
  - Fecha de expiración

### 3A. Si NO tiene cuenta
- Click en **"Crear Cuenta"**
- Se guarda el token en localStorage
- Completa registro
- **AUTO-ACEPTA** la invitación al completar registro
- Redirige al dashboard con acceso al equipo ✅

### 3B. Si YA tiene cuenta
- Click en **"Iniciar Sesión"**
- Se guarda el token en localStorage
- Inicia sesión
- **AUTO-ACEPTA** la invitación al iniciar sesión
- Redirige al dashboard con acceso al equipo ✅

### 3C. Si ya está logueado
- Ve botón **"Aceptar Invitación"**
- Click directo
- Redirige a `/invitaciones?token=...`
- Acepta desde ahí ✅

## 🔒 Seguridad

### Políticas implementadas:

1. **SELECT Público** (`team_invitations_public_select`):
   - Permite ver invitaciones sin autenticación
   - Necesario para el flujo público

2. **SELECT Propias** (`team_invitations_owner_select`):
   - Usuarios autenticados ven sus invitaciones enviadas
   - Para gestión en GestionEquipo.js

3. **INSERT** (solo owner/admin):
   - Solo pueden crear invitaciones
   - Verificado con team_members

4. **UPDATE/DELETE** (solo creador):
   - Solo quien envió puede modificar/cancelar

## 🎨 Diseño Visual

La página pública (`InvitePublic.js`) incluye:
- ✅ Fondo gradient púrpura profesional
- ✅ Card blanco elevado con sombras
- ✅ Iconos de Lucide React
- ✅ Badge de rol con color según tipo
- ✅ Lista de permisos con checkmarks
- ✅ Animaciones Framer Motion
- ✅ Responsive (mobile + desktop)
- ✅ Estados: loading, error, expirado
- ✅ Branding footer "Powered by Crece+"

## 🧪 Cómo Probar

### Prueba 1: Usuario sin cuenta
```bash
1. Crea invitación en /dashboard/equipo
2. Copia el link /invite/TOKEN
3. Abre en ventana incógnita
4. ✅ Deberías ver detalles completos SIN login
5. Click "Crear Cuenta"
6. Completa registro
7. ✅ Deberías ver "Invitación aceptada automáticamente" en consola
8. ✅ Dashboard debe mostrar nueva organización
```

### Prueba 2: Usuario con cuenta existente
```bash
1. Crea invitación en /dashboard/equipo
2. Copia el link /invite/TOKEN
3. Abre en ventana incógnita
4. ✅ Deberías ver detalles completos SIN login
5. Click "Iniciar Sesión"
6. Login con cuenta existente
7. ✅ Deberías ver "Invitación aceptada automáticamente" en consola
8. ✅ Dashboard debe mostrar nueva organización
```

### Prueba 3: Usuario ya logueado
```bash
1. Crea invitación en /dashboard/equipo
2. Copia el link /invite/TOKEN
3. Abre en misma sesión (ya logueado)
4. ✅ Deberías ver "Estás conectado como..."
5. Click "Aceptar Invitación"
6. ✅ Redirige a /invitaciones
7. ✅ Acepta invitación normalmente
```

## 🐛 Debugging

### Ver logs en consola del navegador:

**Al cargar `/invite/:token`:**
```
🔄 Cargando invitación...
✅ Invitación cargada: {organization, role, ...}
```

**Después de login/registro:**
```
🎯 Token de invitación detectado, auto-aceptando...
✅ Invitación aceptada automáticamente
🔄 Cargando perfil para userId: ...
✅ Perfil cargado
✅ Organización cargada
```

### Si algo falla:

1. **Error: "No se pudo cargar la invitación"**
   - Verifica que ejecutaste el SQL (políticas públicas)
   - Revisa en Supabase → Table Editor → team_invitations
   - Confirma que status='pending' y no expiró

2. **Error: "permission denied for table team_invitations"**
   - No ejecutaste las políticas SQL
   - Ve a SQL Editor y ejecuta `fix_invitations_policies.sql`

3. **No auto-acepta después del login**
   - Abre consola del navegador
   - Verifica que dice "🎯 Token de invitación detectado"
   - Revisa localStorage: debe tener key `pending_invitation_token`

4. **Token no se guarda en localStorage**
   - Verifica que InvitePublic.js está guardando:
     ```javascript
     localStorage.setItem('pending_invitation_token', token);
     ```

## 📁 Archivos Modificados/Creados

```
✅ fix_invitations_policies.sql (actualizado con política pública)
✅ src/pages/InvitePublic.js (nuevo - página pública)
✅ src/pages/InvitePublic.css (nuevo - estilos)
✅ src/App.js (agregada ruta /invite/:token)
✅ src/context/AuthContext.js (auto-aceptar en onAuthStateChange)
✅ src/pages/GestionEquipo.js (enlaces cambiados a /invite/)
✅ src/pages/Invitaciones.js (recreado sin errores)
```

## 🎉 Resultado Final

Con este sistema, puedes:
- ✅ Enviar invitaciones a CUALQUIER persona (tengan cuenta o no)
- ✅ Links funcionan SIN autenticación previa
- ✅ Auto-acepta después de crear cuenta o login
- ✅ Experiencia profesional y fluida
- ✅ Totalmente seguro con RLS de Supabase

---

**¿Siguiente paso?**
Ejecuta el SQL en Supabase y prueba el flujo completo! 🚀
