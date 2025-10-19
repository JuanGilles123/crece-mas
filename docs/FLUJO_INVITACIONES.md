# 📨 CÓMO FUNCIONA EL SISTEMA DE INVITACIONES

## 🎯 Flujo Completo de Invitaciones

### Para el ADMINISTRADOR (quien invita):

1. **Ir a Dashboard → Equipo**
2. Click en **"Invitar Miembro"**
3. Llenar el formulario:
   - Email del empleado
   - Rol (Admin, Cajero, Encargado, etc.)
   - Mensaje opcional
4. Click en **"Enviar Invitación"**
5. Se genera un **link de invitación** que puedes copiar
6. **IMPORTANTE**: Comparte ese link con el empleado por WhatsApp, email, etc.

---

### Para el EMPLEADO (quien recibe la invitación):

#### OPCIÓN 1: Si ya tiene cuenta en Crece+

1. Inicia sesión normalmente
2. Ve a la URL: `tu-dominio.com/invitaciones` 
3. Verás todas las invitaciones pendientes
4. Click en **"Aceptar Invitación"**
5. ¡Listo! Ya eres parte del equipo

#### OPCIÓN 2: Si NO tiene cuenta en Crece+

1. Click en el **link de invitación** que recibió
2. Te redirige a la página de **Registro**
3. Crea tu cuenta con el **mismo email** que recibió la invitación
4. Después de registrarte, ve a `/invitaciones`
5. Verás la invitación y podrás aceptarla

---

## 🔗 Formato del Link de Invitación

```
https://tu-dominio.com/invitaciones?token=ABC123XYZ
```

O simplemente:
```
https://tu-dominio.com/invitaciones
```

El empleado iniciará sesión con el email invitado y verá automáticamente la invitación.

---

## ⚠️ Problemas Comunes

### "No aparece la invitación"

**Solución:**
1. Verifica que el empleado inicie sesión con el **email exacto** que usaste para invitar
2. Asegúrate que el empleado vaya a `/invitaciones` después de iniciar sesión
3. La invitación debe estar en estado **"pending"** (no expirada)

### "Quiero enviar el link por WhatsApp"

**Solución:**
1. Después de crear la invitación, copia el token
2. Comparte este mensaje:

```
¡Hola! Te he invitado a unirte a nuestro equipo en Crece+

📝 Pasos para aceptar:
1. Entra a: https://crece-mas.vercel.app/invitaciones
2. Si no tienes cuenta, regístrate con este email: [email-invitado]
3. Inicia sesión
4. Acepta la invitación

🔑 Token (si te lo pide): [copiar-token-aquí]
```

---

## 🚀 Mejora Futura Recomendada

**Email Automático:**
En el futuro, puedes configurar que Supabase envíe automáticamente un email con el link de invitación usando:
- Supabase Email Templates
- SendGrid / Mailgun integration
- El email incluirá un botón directo para aceptar

**Por ahora:** Comparte el link manualmente por WhatsApp, Telegram, SMS, etc.

---

## 📊 Estados de Invitación

| Estado | Descripción |
|--------|-------------|
| `pending` | Esperando que el usuario acepte |
| `accepted` | Aceptada - Usuario ya es parte del equipo |
| `rejected` | Rechazada por el usuario |
| `expired` | Expiró después de 7 días |

---

## 🛠️ Para Desarrolladores

### Agregar notificación en Dashboard

Si quieres que los usuarios vean sus invitaciones pendientes automáticamente:

1. Agregar un componente `<InvitationBanner>` en el Dashboard
2. Usar `useMyInvitations()` para obtener invitaciones
3. Mostrar un badge/banner si hay invitaciones pendientes
4. Click en el banner → redirige a `/invitaciones`

**Ubicación recomendada:** Dashboard header o sidebar

---

## ✅ Checklist para Invitar

- [ ] Email del empleado es correcto
- [ ] Rol seleccionado es apropiado
- [ ] Link de invitación copiado
- [ ] Link enviado al empleado por WhatsApp/Email
- [ ] Empleado confirmó que recibió el link
- [ ] Empleado se registró o inició sesión
- [ ] Empleado visitó `/invitaciones`
- [ ] Invitación aceptada ✅

---

## 📞 Soporte

Si tienes problemas:
1. Verifica en **Equipo** que la invitación aparece como "pending"
2. Revisa que el email del empleado sea correcto
3. Pídele al empleado un screenshot de `/invitaciones`
4. Verifica que la invitación no esté expirada (> 7 días)
