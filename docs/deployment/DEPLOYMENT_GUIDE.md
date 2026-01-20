# 🚀 Guía de Despliegue - Crece Más

Esta guía te llevará paso a paso para desplegar Crece Más en producción.

---

## ✅ Checklist Pre-Despliegue

Antes de desplegar, asegúrate de completar estos pasos:

- [ ] ✅ Base de datos configurada en Supabase
- [ ] ✅ RLS habilitado en todas las tablas
- [ ] ✅ Variables de entorno listas
- [ ] ✅ Build local funcionando correctamente
- [ ] ✅ Tests pasando (opcional pero recomendado)
- [ ] ✅ Documentación actualizada

---

## 🔍 Paso 0: Verificar Build Local

Antes de desplegar, verifica que el build funcione localmente:

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Construir para producción
npm run build

# Probar el build localmente (opcional)
# Necesitas instalar serve: npm install -g serve
serve -s build
```

Si el build tiene errores, corrígelos antes de continuar.

---

## 🌐 Opción 1: Desplegar en Vercel (Recomendado)

Vercel es la plataforma recomendada por su simplicidad y soporte excelente para React.

### Paso 1: Preparar el Proyecto

1. **Asegúrate de que tu código esté en Git:**
   ```bash
   git status
   git add .
   git commit -m "Preparar para despliegue"
   ```

2. **Crea un repositorio en GitHub** (si no lo tienes):
   - Ve a https://github.com/new
   - Crea un nuevo repositorio
   - Sigue las instrucciones para subir tu código

### Paso 2: Conectar con Vercel

1. **Crear cuenta en Vercel:**
   - Ve a https://vercel.com
   - Inicia sesión con GitHub (recomendado)

2. **Importar proyecto:**
   - Haz clic en "Add New..." → "Project"
   - Selecciona tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto React

3. **Configurar variables de entorno:**
   
   En la pantalla de configuración, agrega estas variables de entorno:
   
   ```
   REACT_APP_SUPABASE_URL=tu_url_de_supabase
   REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   REACT_APP_DEBUG=false
   REACT_APP_LOG_LEVEL=error
   ```
   
   **⚠️ IMPORTANTE:** Asegúrate de usar los valores de producción de Supabase.

4. **Configuración del proyecto:**
   - **Framework Preset:** Create React App
   - **Root Directory:** `./` (raíz del proyecto)
   - **Build Command:** `npm run build` (automático)
   - **Output Directory:** `build` (automático)

5. **Desplegar:**
   - Haz clic en "Deploy"
   - Espera a que termine el despliegue (2-5 minutos)
   - ¡Listo! Tu app estará disponible en `https://tu-proyecto.vercel.app`

### Paso 3: Configuración Adicional

1. **Dominio personalizado (opcional):**
   - En el dashboard de Vercel, ve a Settings → Domains
   - Agrega tu dominio personalizado
   - Sigue las instrucciones para configurar DNS

2. **Variables de entorno por ambiente:**
   - Puedes configurar variables diferentes para:
     - Production
     - Preview
     - Development
   - Ve a Settings → Environment Variables

3. **Verificar headers de seguridad:**
   - Vercel usa automáticamente el archivo `vercel.json`
   - Los headers de seguridad están configurados
   - Puedes verificar con: `curl -I https://tu-proyecto.vercel.app`

### Paso 4: Despliegues Automáticos

Vercel despliega automáticamente:
- ✅ Cada push a `main` → Production
- ✅ Cada pull request → Preview deployment
- ✅ Branch → Preview deployment

---

## 🌐 Opción 2: Desplegar en Netlify

### Paso 1: Preparar el Proyecto

Igual que con Vercel, asegúrate de que tu código esté en Git.

### Paso 2: Conectar con Netlify

1. **Crear cuenta en Netlify:**
   - Ve a https://netlify.com
   - Inicia sesión con GitHub

2. **Nuevo sitio desde Git:**
   - Haz clic en "Add new site" → "Import an existing project"
   - Selecciona tu repositorio de GitHub
   - Netlify detectará automáticamente la configuración desde `netlify.toml`

3. **Configurar variables de entorno:**
   
   En la sección "Environment variables", agrega:
   
   ```
   REACT_APP_SUPABASE_URL=tu_url_de_supabase
   REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   REACT_APP_DEBUG=false
   REACT_APP_LOG_LEVEL=error
   ```

4. **Desplegar:**
   - Haz clic en "Deploy site"
   - Espera a que termine (2-5 minutos)
   - Tu app estará disponible en `https://tu-proyecto.netlify.app`

### Paso 3: Configuración Adicional

1. **Dominio personalizado:**
   - Ve a Site Settings → Domain Management
   - Agrega tu dominio personalizado

2. **Formularios (si los necesitas):**
   - Netlify tiene soporte integrado para formularios
   - Actívalo en Site Settings → Forms

---

## 🔧 Opción 3: Desplegar Manualmente

Si prefieres desplegar en tu propio servidor:

### Paso 1: Construir el Proyecto

```bash
npm install
npm run build
```

### Paso 2: Subir Archivos

1. **Copia la carpeta `build/`** a tu servidor
2. **Configura tu servidor web** (Nginx, Apache, etc.)

### Ejemplo con Nginx:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/crece-mas/build;
    index index.html;

    # Headers de seguridad
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Redirecciones para SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para archivos estáticos
    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Paso 3: Variables de Entorno

En un servidor propio, necesitas:
1. Configurar las variables de entorno en el sistema
2. O crear un archivo `.env.production` antes del build
3. Asegurarse de que las variables estén disponibles durante el build

---

## ⚙️ Variables de Entorno Necesarias

### Obligatorias:

```env
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima
```

### Opcionales (tienen valores por defecto):

```env
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=error
REACT_APP_APP_NAME=Crece Más
REACT_APP_APP_VERSION=1.0.0
REACT_APP_STORAGE_BUCKET_RECIBOS=recibos
REACT_APP_STORAGE_BUCKET_LOGOS=logos
REACT_APP_STORAGE_BUCKET_PRODUCTOS=productos
```

**⚠️ IMPORTANTE:** 
- Nunca comitees archivos `.env.local` o `.env.production`
- Las variables deben configurarse en la plataforma de hosting
- Los valores de desarrollo y producción pueden ser diferentes

---

## 🔐 Configuración de Supabase para Producción

### Paso 1: Verificar Configuración

1. **RLS habilitado:**
   - Ve a Supabase Dashboard → Authentication → Policies
   - Verifica que todas las tablas tengan RLS habilitado

2. **URLs permitidas:**
   - Ve a Authentication → URL Configuration
   - Agrega tu URL de producción a "Site URL"
   - Agrega tu URL de producción a "Redirect URLs"

### Paso 2: Rate Limiting

1. Ve a Authentication → Settings
2. Configura rate limiting:
   - Login: 5 intentos por minuto
   - Registro: 3 intentos por minuto
   - Password reset: 3 intentos por hora

### Paso 3: Verificar Storage Buckets

1. Ve a Storage
2. Verifica que los buckets existan:
   - `productos`
   - `logos`
   - `recibos`
3. Verifica las políticas de acceso

---

## ✅ Verificación Post-Despliegue

Después del despliegue, verifica:

1. **✅ La aplicación carga correctamente**
   - Visita tu URL de producción
   - Verifica que no haya errores en la consola

2. **✅ Headers de seguridad:**
   ```bash
   curl -I https://tu-proyecto.vercel.app
   ```
   - Debe incluir `X-Frame-Options`, `X-Content-Type-Options`, etc.

3. **✅ Autenticación funciona:**
   - Intenta registrarte
   - Intenta iniciar sesión
   - Verifica que los redirects funcionen

4. **✅ Base de datos:**
   - Verifica que puedas crear productos
   - Verifica que puedas crear ventas
   - Verifica que los datos se guarden correctamente

5. **✅ Storage:**
   - Sube una imagen de producto
   - Sube un logo de empresa
   - Verifica que se guarden correctamente

---

## 🔄 Actualizaciones y Re-despliegue

### Con Vercel/Netlify:

Los despliegues son automáticos:
- Cada push a `main` → Nuevo despliegue de producción
- Cada PR → Preview deployment

### Manual:

```bash
# Hacer cambios
git add .
git commit -m "Descripción de cambios"
git push origin main

# Vercel/Netlify desplegará automáticamente
```

---

## 🐛 Solución de Problemas

### Build Fallido

1. **Verificar variables de entorno:**
   - Asegúrate de que todas las variables estén configuradas
   - Verifica que no haya errores de sintaxis

2. **Probar build local:**
   ```bash
   npm run build
   ```
   - Si falla localmente, corregir antes de desplegar

3. **Revisar logs:**
   - En Vercel: Dashboard → Deployment → Logs
   - En Netlify: Deploys → Logs

### Errores en Producción

1. **Verificar consola del navegador:**
   - Abre DevTools → Console
   - Busca errores en rojo

2. **Verificar Network tab:**
   - Busca requests fallidos
   - Verifica CORS si aplica

3. **Verificar variables de entorno:**
   - Asegúrate de que las variables de producción estén correctas
   - Verifica que no haya espacios extra

### Variables de Entorno no Funcionan

1. **Limpiar cache:**
   - En Vercel: Settings → Environment Variables → Rebuild
   - En Netlify: Deploys → Trigger deploy

2. **Verificar prefijo:**
   - Las variables de React deben comenzar con `REACT_APP_`

3. **Verificar sintaxis:**
   - No usar espacios alrededor del `=`
   - No usar comillas a menos que sea necesario

---

## 📊 Monitoreo

### Recomendado:

1. **Vercel Analytics** (si usas Vercel)
   - Actívalo en el dashboard
   - Monitorea rendimiento

2. **Sentry** (para errores)
   - Integración fácil con React
   - Tracking de errores en producción

3. **Supabase Dashboard**
   - Monitorea uso de la base de datos
   - Revisa logs de autenticación

---

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Netlify](https://docs.netlify.com)
- [Guía de Seguridad](../SECURITY_SETUP.md)
- [Auditoría de Seguridad](../SECURITY_AUDIT.md)

---

**Última actualización:** 2024  
**Versión:** 1.0.0
