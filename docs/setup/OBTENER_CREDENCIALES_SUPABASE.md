# 🔑 Cómo Obtener las Credenciales de Supabase

Esta guía te ayudará paso a paso a obtener las credenciales necesarias para configurar tu proyecto.

---

## 📋 Credenciales Necesarias

Necesitas obtener estas dos credenciales:

1. **REACT_APP_SUPABASE_URL** - La URL de tu proyecto Supabase
2. **REACT_APP_SUPABASE_ANON_KEY** - La clave anónima pública

---

## 🚀 Paso 1: Crear/Crear Acceso a tu Proyecto Supabase

### Si ya tienes un proyecto:

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en **"Sign In"** (Iniciar Sesión)
3. Inicia sesión con tu cuenta

### Si no tienes un proyecto:

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en **"Start your project"** o **"Get Started"**
3. Crea una cuenta (puedes usar GitHub, Google, o email)
4. Una vez dentro, haz clic en **"New Project"**
5. Completa el formulario:
   - **Name**: Nombre de tu proyecto (ej: "crece-mas")
   - **Database Password**: Crea una contraseña segura (¡guárdala!)
   - **Region**: Elige la región más cercana
   - **Pricing Plan**: Free tier está bien para empezar
6. Haz clic en **"Create new project"**
7. Espera 2-3 minutos a que se cree el proyecto

---

## 🔑 Paso 2: Obtener las Credenciales

### Opción A: Desde el Dashboard Principal

1. Una vez en tu proyecto, verás un dashboard
2. En el menú lateral izquierdo, busca **"Settings"** (Configuración)
3. Haz clic en **Settings**
4. En el submenú, haz clic en **"API"**

### Opción B: Navegación Directa

1. Ve directamente a: `https://supabase.com/dashboard/project/[TU-PROJECT-ID]/settings/api`
2. (Reemplaza `[TU-PROJECT-ID]` con el ID de tu proyecto)

---

## 📝 Paso 3: Copiar las Credenciales

En la página de API verás dos secciones principales:

### 1. Project URL

```
https://xxxxxxxxxxxxxxxxx.supabase.co
```

Esta es tu **REACT_APP_SUPABASE_URL**

- Haz clic en el ícono de copiar 📋 al lado de la URL
- O simplemente selecciona y copia (Ctrl+C / Cmd+C)

### 2. anon public key

Bajo la sección **"Project API keys"**, verás:

```
anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Esta es tu **REACT_APP_SUPABASE_ANON_KEY**

- Haz clic en el ícono de **"Reveal"** o **"Show"** si está oculta
- Haz clic en el ícono de copiar 📋
- O selecciona y copia toda la clave

---

## 📋 Paso 4: Configurar en tu Proyecto

1. Abre el archivo `.env.local` en la raíz de tu proyecto
2. Reemplaza los valores:

```env
REACT_APP_SUPABASE_URL=https://tu-proyecto-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo real:**

```env
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.xyz123abc456
```

---

## ⚠️ Importante: Seguridad

### ✅ Haz esto:

- ✅ Usa la **anon key** (clave pública) - es segura para el frontend
- ✅ La anon key está diseñada para usarse en aplicaciones cliente
- ✅ Está protegida por Row Level Security (RLS) en tu base de datos

### ❌ NO hagas esto:

- ❌ **NUNCA** uses la **service_role key** (clave de servicio) en el frontend
- ❌ **NUNCA** compartas tu **service_role key** públicamente
- ❌ **NUNCA** comitees el archivo `.env.local` a Git

---

## 🔍 Verificar que Funcionan

Después de configurar las variables:

1. **Guarda** el archivo `.env.local`
2. **Reconstruye** el build:
   ```bash
   npm run build
   ```
3. **Inicia** el servidor:
   ```bash
   npm run serve
   ```
4. **Abre** http://localhost:3000
5. **Verifica** que la aplicación carga sin errores

---

## 🆘 Problemas Comunes

### Error: "Invalid API key"

- ✅ Verifica que copiaste la clave completa (son muy largas)
- ✅ Verifica que NO hay espacios antes o después
- ✅ Verifica que usas la **anon key**, no la service_role key
- ✅ Reconstruye el build: `npm run build`

### Error: "Invalid URL"

- ✅ Verifica que la URL empieza con `https://`
- ✅ Verifica que la URL termina con `.supabase.co`
- ✅ No incluyas una barra `/` al final de la URL

### No encuentro la página de API

1. Asegúrate de estar en tu proyecto (verifica el nombre del proyecto arriba)
2. Ve a Settings (Configuración) en el menú lateral
3. Haz clic en "API" en el submenú

---

## 📸 Ubicación Visual (Referencia)

```
Supabase Dashboard
├── [Tu Proyecto]
│   ├── Dashboard
│   ├── Table Editor
│   ├── SQL Editor
│   ├── Authentication
│   ├── Storage
│   └── Settings ⬅️ AQUÍ
│       ├── General
│       ├── API ⬅️ AQUÍ ESTÁN TUS CREDENCIALES
│       ├── Database
│       ├── Auth
│       └── ...
```

---

## ✅ Checklist Final

- [ ] Tengo cuenta en Supabase
- [ ] Tengo un proyecto creado
- [ ] Accedí a Settings → API
- [ ] Copié el Project URL
- [ ] Copié el anon public key
- [ ] Configuré `.env.local` con los valores correctos
- [ ] Reconstruí el build: `npm run build`
- [ ] La aplicación carga correctamente

---

## 🔗 Enlaces Útiles

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Documentación de API Keys](https://supabase.com/docs/guides/platform/security)
- [Cómo funciona RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**¿Necesitas más ayuda?** Si después de seguir estos pasos aún tienes problemas, verifica:
1. Que el archivo `.env.local` existe en la raíz del proyecto
2. Que las variables tienen el prefijo `REACT_APP_`
3. Que reconstruiste el build después de cambiar las variables

---

**Última actualización:** 2024
