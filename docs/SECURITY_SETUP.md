# 🔒 Guía de Configuración de Seguridad - Crece Más

Esta guía describe las mejores prácticas de seguridad para configurar y desplegar Crece Más en producción.

---

## 📋 Checklist de Seguridad Pre-Despliegue

### ✅ Variables de Entorno

1. **Crear archivo `.env.local`** (nunca commitear este archivo)
   ```env
   REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
   REACT_APP_DEBUG=false
   REACT_APP_LOG_LEVEL=error
   ```

2. **Verificar que todas las variables estén configuradas**
   - La aplicación validará automáticamente las variables críticas al iniciar
   - Si faltan variables, verás un error claro en desarrollo

3. **Variables de entorno en producción**
   - **Vercel:** Configurar en Settings → Environment Variables
   - **Netlify:** Configurar en Site Settings → Environment Variables
   - **Nunca** incluir variables en el código fuente

---

## 🔐 Configuración de Supabase

### Row Level Security (RLS)

✅ Verificar que RLS está habilitado en todas las tablas:
- `productos`
- `ventas`
- `datos_empresa`

✅ Verificar políticas RLS:
- Cada usuario solo puede ver/editar sus propios datos
- Las políticas deben usar `auth.uid() = user_id`

### Storage Buckets

✅ Verificar que los buckets tienen las políticas correctas:
- `productos`: Privado, solo acceso del usuario propietario
- `logos`: Público para lectura, privado para escritura
- `recibos`: Privado, solo acceso del usuario propietario

### Rate Limiting

✅ Configurar rate limiting en Supabase:
1. Ir a Authentication → Settings
2. Habilitar "Rate Limiting"
3. Configurar límites apropiados:
   - Login: 5 intentos por minuto
   - Registro: 3 intentos por minuto
   - Password reset: 3 intentos por hora

---

## 🌐 Headers de Seguridad HTTP

### Vercel

El archivo `public/_headers` se usa automáticamente. Verificar que incluye:
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security

### Netlify

El archivo `public/_headers` también se usa automáticamente en Netlify.

### Otros Servidores

Configurar manualmente según la documentación del servidor. Los headers necesarios están en `public/_headers`.

---

## 🔍 Monitoreo y Logging

### Logging en Producción

- **Desarrollo:** Todos los logs están habilitados para debugging
- **Producción:** Solo errores críticos se logean
- **Información sensible:** Automáticamente sanitizada en logs

### Sistema de Logging

Usar el sistema de logging centralizado:
```javascript
import logger from '../utils/logger';

// En lugar de console.log
logger.debug('Información de debug'); // Solo en desarrollo
logger.info('Información general'); // Solo en desarrollo
logger.warn('Advertencia'); // Siempre visible
logger.error('Error crítico'); // Siempre visible
```

### Monitoreo Recomendado

1. **Sentry** - Para tracking de errores
2. **LogRocket** - Para sesiones de usuario
3. **Supabase Dashboard** - Para monitoreo de base de datos

---

## 🛡️ Validación de Inputs

### Frontend

✅ Usar Zod para validación de formularios:
```javascript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres')
});
```

### Backend (Supabase)

✅ Las políticas RLS actúan como validación adicional
✅ Usar constraints de base de datos para validación
✅ Validar tipos de datos en funciones de base de datos

---

## 🔒 Manejo de Errores

### Usar el Sistema Centralizado

```javascript
import { getErrorMessage, handleError } from '../utils/errorHandler';

try {
  // código
} catch (error) {
  // Mostrar mensaje amigable al usuario
  const friendlyMessage = getErrorMessage(error);
  setError(friendlyMessage);
  
  // O usar handleError para logging automático
  handleError(error);
}
```

### Reglas de Manejo de Errores

1. **Nunca** exponer mensajes de error técnicos al usuario
2. **Siempre** logear errores técnicos en el backend/consola
3. **Usar** mensajes genéricos y amigables
4. **Categorizar** errores según tipo

---

## 🔐 Autenticación

### Configuración Segura

1. **Habilitar confirmación de email**
   - Settings → Authentication → Enable email confirmations

2. **Configurar políticas de contraseña**
   - Mínimo 8 caracteres
   - Requerir mayúsculas, minúsculas y números
   - Opcional: Símbolos especiales

3. **Rate Limiting**
   - Configurar límites apropiados (ver arriba)

4. **Sesiones**
   - Timeout apropiado (recomendado: 24 horas)
   - Refresh tokens habilitados

### Best Practices

- ✅ Nunca almacenar contraseñas en texto plano (Supabase lo maneja)
- ✅ Usar HTTPS siempre en producción
- ✅ Implementar logout automático después de inactividad
- ✅ Considerar 2FA para usuarios administradores

---

## 📦 Dependencias

### Auditoría Regular

Ejecutar regularmente:
```bash
npm audit
npm audit fix
```

### Actualizar Dependencias

1. Revisar cambios en dependencias
2. Probar en desarrollo antes de producción
3. Mantener dependencias actualizadas

---

## 🚀 Despliegue

### Checklist Pre-Despliegue

- [ ] Variables de entorno configuradas
- [ ] RLS habilitado en todas las tablas
- [ ] Headers de seguridad configurados
- [ ] Rate limiting configurado
- [ ] Logging configurado para producción
- [ ] HTTPS habilitado
- [ ] Backup de base de datos configurado
- [ ] Monitoreo configurado
- [ ] Tests ejecutados y pasando

### Post-Despliegue

- [ ] Verificar que HTTPS funciona
- [ ] Verificar headers de seguridad
- [ ] Probar flujo de autenticación completo
- [ ] Verificar que RLS funciona correctamente
- [ ] Monitorear logs de errores

---

## 🔄 Respuesta a Incidentes

### Si se Detecta una Vulnerabilidad

1. **Inmediato:**
   - Documentar la vulnerabilidad
   - Evaluar el riesgo
   - Implementar parche temporal si es necesario

2. **Corto Plazo:**
   - Desarrollar solución permanente
   - Probar solución en desarrollo
   - Desplegar solución

3. **Seguimiento:**
   - Actualizar documentación
   - Notificar usuarios si es necesario
   - Revisar y mejorar procesos

---

## 📚 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Guide](https://supabase.com/docs/guides/platform/security)
- [React Security](https://reactjs.org/docs/security.html)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Última actualización:** 2024  
**Versión:** 1.0.0
