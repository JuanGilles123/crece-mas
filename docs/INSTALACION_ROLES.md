# 🚀 Guía de Instalación Rápida - Sistema de Roles

## ⚡ Instalación en 5 Minutos

### **Paso 1: Configurar Base de Datos**

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `setup_roles_equipos.sql`
4. Haz clic en **Run**
5. ✅ Espera el mensaje de éxito

### **Paso 2: Ejecutar Diagnóstico**

Ejecuta el script `diagnostico_roles.sql` en SQL Editor:

1. Abre el archivo `diagnostico_roles.sql`
2. **IMPORTANTE:** En la línea que dice `WHERE au.email = 'tu-email@ejemplo.com'`
3. **CAMBIA** `tu-email@ejemplo.com` por **TU EMAIL REAL**
4. Ejecuta el script
5. Revisa los resultados

**¿Qué verás?**
- ✅ Si dice "✅ Todo correcto" → Pasa al Paso 4 (usuarios nuevos)
- ❌ Si dice "❌ Sin migrar" → Continúa al Paso 3 (usuarios existentes)

### **Paso 3: Migrar Usuarios Existentes (SOLO si ya tenías cuenta)**

Si ya tenías una cuenta ANTES de ejecutar el script de roles:

1. Ejecuta `migracion_usuarios_existentes.sql` en SQL Editor
2. Espera el mensaje "✅ Migración completada exitosamente!"
3. Verás cuántos usuarios y organizaciones se migraron
4. **IMPORTANTE:** Cierra sesión completamente
5. **IMPORTANTE:** Limpia caché del navegador (Ctrl+Shift+Delete o Cmd+Shift+Delete)
6. Vuelve a iniciar sesión

### **Paso 4: Verificar que Funciona**

Ahora deberías poder ver:

1. **En el menú lateral izquierdo:**
   - ✅ Debe aparecer la opción **"Equipo"** (solo si eres owner/admin)
   - ✅ En la parte inferior del sidebar verás tu rol: "👑 Propietario"
   - ✅ Debajo del logo verás el nombre de tu organización

2. **Al hacer clic en "Equipo":**
   - Verás tu información como único miembro
   - Botón "Invitar Miembro" activo
   - Estadísticas del equipo

3. **Si NO ves el menú "Equipo":**
   - Ejecuta el diagnóstico nuevamente
   - Verifica que tu rol sea `owner` en la consulta
   - Asegúrate de haber cerrado sesión y limpiado caché

---

### **Paso 5: Primer Uso (Usuarios Nuevos)**

Para **usuarios que se registren DESPUÉS** de instalar el sistema:

1. **Registra un nuevo usuario** en `/registro`
2. El sistema automáticamente:
   - ✅ Crea el perfil con rol `owner`
   - ✅ Crea una organización
   - ✅ Agrega al usuario como miembro del equipo

3. **Invita a tu primer empleado:**
   - Ve a **Dashboard → Equipo**
   - Haz clic en **"Invitar Miembro"**
   - Ingresa el email y selecciona el rol
   - Envía la invitación

4. **El empleado:**
   - Se registra en Crece+ (si no tiene cuenta)
   - Va a `/invitaciones` o recibe el link directo
   - Acepta la invitación
   - Obtiene acceso según su rol

---

## 🎭 Roles Resumidos

| Rol | Acceso | Uso Típico |
|-----|--------|------------|
| 👑 **Owner** | Todo | Dueño del negocio |
| 🛡️ **Admin** | Todo menos facturación | Gerente general |
| 📦 **Inventory Manager** | Inventario + Ventas | Encargado de bodega |
| 💰 **Cashier** | Solo caja | Cajero |
| 👁️ **Viewer** | Solo reportes | Contador/Auditor |

---

## 🔧 Solución de Problemas

### **Error: "relation user_profiles does not exist"**
**Solución:** El script SQL no se ejecutó correctamente. Vuelve a ejecutarlo.

### **Error: "RLS policy violation"**
**Solución:** Las políticas RLS no están habilitadas. Ejecuta:
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
```

### **El usuario nuevo no se crea automáticamente como owner**
**Solución:** Verifica que el trigger esté creado:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### **No aparece el menú de "Equipo"**
**Solución:** Solo owners y admins ven este menú. Verifica tu rol:
```sql
SELECT role FROM user_profiles WHERE user_id = '[tu-user-id]';
```

---

## 📝 Checklist Post-Instalación

- [ ] Script SQL ejecutado sin errores
- [ ] Tablas creadas y verificadas
- [ ] Usuario de prueba registrado
- [ ] Usuario aparece como `owner` en `user_profiles`
- [ ] Organización creada automáticamente
- [ ] Menú "Equipo" visible en dashboard
- [ ] Invitación de prueba enviada
- [ ] Invitación aceptada correctamente
- [ ] Permisos funcionando según rol

---

## 🎯 Próximos Pasos

1. **Personaliza los roles** según las necesidades de tu negocio
2. **Invita a tu equipo** desde Dashboard → Equipo
3. **Configura límites** de miembros por plan en la tabla `organizations`
4. **Implementa notificaciones** por email para invitaciones (opcional)
5. **Agrega logs de auditoría** para cambios de roles (opcional)

---

## 📚 Documentación Completa

Para más detalles, consulta: **`docs/SISTEMA_ROLES.md`**

---

¡Listo para gestionar tu equipo! 🎉
