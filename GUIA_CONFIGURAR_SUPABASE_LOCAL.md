# 🔧 Configurar Supabase en Local - Guía Paso a Paso

## ⚠️ Importante: Dos lugares diferentes

### 1. **Supabase Dashboard** (para obtener credenciales)
- Donde obtienes las credenciales de tu base de datos
- URL: https://supabase.com/dashboard

### 2. **Vercel Dashboard** (para producción)
- Donde despliegas la aplicación
- No es necesario para desarrollo local

---

## 📋 Pasos para Configurar Local

### Paso 1: Ir a Supabase Dashboard

1. **Abre tu navegador**
2. **Ve a:** https://supabase.com/dashboard
3. **Inicia sesión** con tu cuenta de Supabase

---

### Paso 2: Seleccionar tu Proyecto

1. En el dashboard, verás una lista de proyectos
2. **Haz clic en tu proyecto** (o crea uno nuevo si no tienes)

---

### Paso 3: Ir a Settings → API

**⚠️ IMPORTANTE:** En Supabase, no en Vercel

1. **En el menú lateral izquierdo** (dentro de Supabase), busca **"Settings"** ⚙️
2. **Haz clic en "Settings"**
3. **En el submenú que aparece**, busca **"API"**
4. **Haz clic en "API"**

---

### Paso 4: Copiar las Credenciales

En la página de API verás dos secciones:

#### **1. Project URL:**
```
https://xxxxxxxxxx.supabase.co
```
➡️ **Copia esta URL completa**

#### **2. Project API keys:**
- Busca la sección **"anon public"** 
- Haz clic en **"Reveal"** si está oculta
- **Copia toda la clave** (es muy larga, empieza con `eyJ...`)

---

### Paso 5: Editar `.env.local` en tu Proyecto

1. **Abre el archivo `.env.local`** en la raíz de tu proyecto:
   ```
   c:\Users\Jonathan\Documents\Crecemas\crece-mas\.env.local
   ```

2. **Reemplaza estos valores:**

   **ANTES (valores de ejemplo):**
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   **DESPUÉS (tus valores reales):**
   ```env
   REACT_APP_SUPABASE_URL=https://tu-proyecto-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (tu clave completa)
   ```

3. **Guarda el archivo** (Ctrl+S)

---

### Paso 6: Reiniciar el Servidor

1. **Detén el servidor actual:**
   - En la terminal donde está corriendo `npm start`
   - Presiona **Ctrl+C**

2. **Reinicia el servidor:**
   ```bash
   npm start
   ```

3. **Espera a que compile** (30-60 segundos)

---

## 🔍 Verificación

Después de reiniciar:

1. **Abre el navegador** en `http://localhost:3000`
2. **Abre DevTools** (F12) → Console
3. **Verifica:**
   - ✅ No hay errores de "Variables de entorno"
   - ✅ No hay errores de conexión a Supabase
   - ✅ La página carga correctamente

---

## 📸 Ubicación Visual en Supabase

```
https://supabase.com/dashboard
└── Tu Proyecto (haz clic)
    └── Menú lateral izquierdo
        └── Settings ⚙️ ← AQUÍ
            └── API ← Y LUEGO AQUÍ
                ├── Project URL ← Copia esto
                └── Project API keys
                    └── anon public ← Copia esto
```

---

## ⚠️ Errores Comunes

### "No veo Settings en Supabase"
- Asegúrate de estar logueado
- Asegúrate de tener un proyecto creado
- Haz clic en tu proyecto primero

### "No veo API en Settings"
- Puede estar en un submenú
- Busca "API" o "Configuration"
- Si no aparece, prueba "General" → "API"

### "Las credenciales no funcionan"
- Verifica que copiaste la URL completa (con `https://`)
- Verifica que copiaste toda la clave (son muy largas)
- Verifica que NO hay espacios antes/después del `=`
- Reinicia el servidor después de cambiar `.env.local`

---

## 🆘 Si Aún No Funciona

1. **Verifica que estás en Supabase, no en Vercel**
2. **Comparte una captura de pantalla** de tu dashboard de Supabase
3. **O dime qué opciones ves** en el menú lateral de Supabase
