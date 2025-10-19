# 🚀 PRUEBA ESTO AHORA

## Paso 1: Ejecutar SQL en Supabase ⚡

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Click en **SQL Editor** (menú izquierdo)
4. Click en **New Query**
5. Copia y pega el contenido de: `fix_invitations_policies.sql`
6. Click en **Run** (botón verde ▶️)
7. Deberías ver: "✅ POLÍTICAS ARREGLADAS"

## Paso 2: Probar el flujo completo 🧪

### Prueba A: Con tu cuenta actual

1. Abre la app: http://localhost:3000
2. Ve a **Dashboard** → **Equipo** (menú izquierdo)
3. Click en pestaña **"Invitaciones"**
4. Llena el formulario:
   - Email: un email que NO uses actualmente
   - Rol: **Administrador**
   - Mensaje: "Prueba de invitación"
5. Click **"Enviar Invitación"**
6. ¡Listo! La invitación aparece abajo
7. Click en el botón **"Copiar Link"** 📋

### Prueba B: Aceptar invitación SIN cuenta

1. **Cierra sesión** (importante)
2. Abre una **ventana de incógnito** (Ctrl+Shift+N)
3. Pega el link que copiaste
4. **¡WOW!** 🎉 Deberías ver una página púrpura hermosa con:
   - 📧 Icono de mail
   - 🏢 Nombre de tu organización
   - Badge azul "Administrador"
   - Lista de permisos
   - Botones: [Crear Cuenta] [Iniciar Sesión]

5. Click en **"Crear Cuenta"**
6. Completa el registro con el email que usaste
7. **Espera 3 segundos...**
8. 🎉 Deberías ver el dashboard de TU ORGANIZACIÓN
9. Abre la consola (F12) y deberías ver:
   ```
   ✅ Invitación aceptada automáticamente
   🔄 Rol efectivo actualizado a: admin
   ```

### Prueba C: Selector de organizaciones

1. Si tienes 2+ organizaciones, en el **sidebar** verás un nuevo botón:
   ```
   🏢 [Nombre Organización] ▼
      2 organizaciones
   ```
2. Click en ese botón
3. Aparece dropdown con todas tus organizaciones
4. La activa tiene un checkmark ✓
5. Click en otra organización
6. ¡Dashboard se actualiza con los datos de esa organización!

## ¿Qué deberías ver en la consola? 🔍

Abre DevTools (F12) → Console:

```
🎯 Token de invitación detectado, auto-aceptando...
✅ Invitación aceptada automáticamente: {...}
🔄 Recargando perfil después de aceptar invitación...
✅ Perfil cargado: {role: "owner", ...}
🔄 Usando organización de team_members: {orgId: "xxx", role: "admin"}
✅ Organización cargada: {name: "Tu Organización", ...}
🔄 Rol efectivo actualizado a: admin
✅ Permisos cargados: {...}
🔄 Recargando página completa...
```

## ¿Algo salió mal? 🐛

### Error 1: "No se pudo cargar la invitación"
**Causa:** No ejecutaste el SQL  
**Solución:** Ve al Paso 1 arriba ↑

### Error 2: "Permission denied for table team_invitations"
**Causa:** Política pública no se creó  
**Solución:** Ejecuta esto en Supabase SQL Editor:
```sql
CREATE POLICY "team_invitations_public_select" ON team_invitations
  FOR SELECT USING (true);
```

### Error 3: No auto-acepta después del registro
**Causa:** Token no se guardó en localStorage  
**Solución:** 
1. Abre consola (F12)
2. Escribe: `localStorage.getItem('pending_invitation_token')`
3. Debería mostrar el token
4. Si es `null`, el link no se abrió correctamente

### Error 4: Sigue mostrando la organización original
**Causa:** Caché del navegador  
**Solución:**
1. Cierra sesión completamente
2. Limpia localStorage: `localStorage.clear()`
3. Recarga: `window.location.reload()`
4. Inicia sesión de nuevo

## 📊 Verificar en la Base de Datos

Ve a Supabase → **Table Editor** → `team_members`:

Deberías ver **2 filas** para el usuario que aceptó la invitación:

| user_id | organization_id | role | status | joined_at |
|---------|----------------|------|--------|-----------|
| xxx | org_1 | owner | active | 2025-10-08 |
| xxx | org_2 | admin | active | 2025-10-09 ← **Nueva** |

La fila más reciente (`joined_at` más grande) es la que se muestra en el dashboard.

## 🎉 Si todo funciona:

✅ **Página pública** muestra invitación sin login  
✅ **Auto-acepta** después de crear cuenta  
✅ **Dashboard** muestra organización correcta  
✅ **Rol** es "admin" (no "owner")  
✅ **Permisos** funcionan según el rol  
✅ **Selector** aparece si tienes 2+ organizaciones  

---

## 🚀 Siguiente Nivel

Ahora puedes:

1. **Invitar a tu equipo real:**
   - Crea invitaciones con sus emails
   - Comparte los links `/invite/TOKEN`
   - Ellos no necesitan tener cuenta previa
   - Se auto-aceptan al registrarse

2. **Asignar roles específicos:**
   - **Administrador:** Todo excepto facturación
   - **Inventario:** Gestión de productos y ventas
   - **Cajero:** Solo módulo de caja
   - **Visualizador:** Solo lectura

3. **Gestionar múltiples negocios:**
   - Si eres owner de varios negocios
   - O miembro de varios equipos
   - Usa el selector para cambiar entre ellos

---

**¿Listo para probarlo? ¡Ve al Paso 1! ⬆️**
