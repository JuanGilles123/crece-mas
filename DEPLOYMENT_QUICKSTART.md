# 🚀 Guía Rápida de Despliegue - Crece Más

## ✅ Build Completado

El proyecto se ha construido exitosamente. Ahora puedes desplegarlo.

---

## 🌐 Opción 1: Desplegar en Vercel (Más Fácil)

### Paso 1: Subir a GitHub (si aún no lo has hecho)

```bash
git add .
git commit -m "Preparar para despliegue"
git push origin main
```

### Paso 2: Conectar con Vercel

1. Ve a https://vercel.com y crea una cuenta (usa GitHub)
2. Haz clic en "Add New..." → "Project"
3. Selecciona tu repositorio `crece-mas`
4. Vercel detectará automáticamente la configuración

### Paso 3: Configurar Variables de Entorno

En la sección "Environment Variables", agrega:

```
REACT_APP_SUPABASE_URL=tu_url_de_supabase
REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=error
```

### Paso 4: Desplegar

1. Haz clic en "Deploy"
2. Espera 2-5 minutos
3. ¡Listo! Tu app estará en `https://tu-proyecto.vercel.app`

---

## 🌐 Opción 2: Desplegar en Netlify

### Paso 1: Subir a GitHub

```bash
git add .
git commit -m "Preparar para despliegue"
git push origin main
```

### Paso 2: Conectar con Netlify

1. Ve a https://netlify.com y crea una cuenta
2. "Add new site" → "Import an existing project"
3. Selecciona tu repositorio

### Paso 3: Configurar

Netlify detectará automáticamente la configuración desde `netlify.toml`

**Variables de entorno:**
- Ve a Site Settings → Environment Variables
- Agrega las mismas variables que en Vercel

### Paso 4: Desplegar

Haz clic en "Deploy site" y espera.

---

## ⚙️ Variables de Entorno Necesarias

```env
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=error
```

**⚠️ IMPORTANTE:**
- Reemplaza los valores con tus credenciales reales de Supabase
- Nunca compartas estas claves públicamente
- Usa las credenciales de tu proyecto de producción en Supabase

---

## ✅ Verificación Post-Despliegue

1. **Visita tu URL de producción**
   - La app debe cargar sin errores

2. **Verifica autenticación:**
   - Intenta registrarte
   - Intenta iniciar sesión

3. **Verifica funcionalidad:**
   - Crea un producto
   - Realiza una venta
   - Genera un recibo

4. **Verifica headers de seguridad:**
   ```bash
   curl -I https://tu-proyecto.vercel.app
   ```
   - Debe incluir `X-Frame-Options`, `X-Content-Type-Options`, etc.

---

## 📚 Documentación Completa

Para más detalles, consulta:
- [Guía Completa de Despliegue](docs/deployment/DEPLOYMENT_GUIDE.md)
- [Guía de Seguridad](docs/SECURITY_SETUP.md)
- [Configuración de Supabase](docs/SETUP_BASE_DATOS.md)

---

## 🆘 Problemas Comunes

### Build fallido en Vercel/Netlify

1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs del build en el dashboard
3. Prueba el build localmente: `npm run build`

### Errores de CORS

1. Ve a Supabase Dashboard → Authentication → URL Configuration
2. Agrega tu URL de producción a "Site URL"
3. Agrega tu URL de producción a "Redirect URLs"

### Variables de entorno no funcionan

1. Verifica que tengan el prefijo `REACT_APP_`
2. No uses espacios alrededor del `=`
3. Reinicia el deployment después de agregar variables

---

**¡Feliz despliegue! 🎉**
