# 📝 Configurar Credenciales de Supabase - Paso a Paso MUY SIMPLE

## 🎯 ¿Qué necesitas hacer?

**Simplemente:** Copiar 2 valores de Supabase y pegarlos en un archivo en tu computadora.

---

## 📍 PASO 1: Ir a Supabase

1. **Abre tu navegador** (Chrome, Edge, Firefox, etc.)
2. **Ve a esta URL:**
   ```
   https://supabase.com/dashboard
   ```
3. **Si no tienes cuenta:**
   - Haz clic en "Sign In" o "Sign Up"
   - Crea una cuenta (es gratis)
4. **Si ya tienes cuenta:**
   - Inicia sesión

---

## 📍 PASO 2: Entrar a tu Proyecto

**Si ya tienes un proyecto:**
- En la pantalla principal verás tus proyectos
- **Haz clic en el proyecto** que quieres usar

**Si NO tienes proyecto:**
1. Haz clic en el botón **"New Project"** (o "Nuevo Proyecto")
2. Completa el formulario:
   - **Name:** Ponle un nombre (ej: "crece-mas")
   - **Database Password:** Crea una contraseña (guárdala)
   - **Region:** Elige la más cercana (ej: "South America")
   - **Pricing Plan:** Selecciona "Free" (gratis)
3. Haz clic en **"Create new project"**
4. Espera 2-3 minutos mientras se crea

---

## 📍 PASO 3: Buscar "Settings" (Configuración)

Una vez dentro de tu proyecto, verás un **menú en el lado izquierdo** de la pantalla.

Busca la opción que dice **"Settings"** o **"Configuración"** (tiene un ícono de engranaje ⚙️)

**Haz clic en "Settings"**

---

## 📍 PASO 4: Buscar "API"

Después de hacer clic en Settings, verás un **submenú** con varias opciones:

- General
- API ← **ESTA ES LA QUE NECESITAS**
- Database
- Auth
- Storage
- etc.

**Haz clic en "API"**

---

## 📍 PASO 5: Copiar los 2 Valores

En la página de API verás varias secciones. Busca estas dos:

### **1. Project URL (URL del Proyecto)**

Verás algo como:
```
https://abcdefghijklmnop.supabase.co
```

**Acción:** Haz clic con el botón derecho y **"Copiar"** (o selecciona todo y Ctrl+C)

---

### **2. Project API keys → anon public**

En la sección "Project API keys", busca la que dice **"anon public"**

Verás algo como:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODI3ODkwMCwiZXhwIjoxOTUzODU0OTAwfQ...
```

**Si está oculta:**
- Haz clic en el botón **"Reveal"** o **"Mostrar"**
- Ahora verás la clave completa

**Acción:** Haz clic con el botón derecho y **"Copiar"** (o selecciona todo y Ctrl+C)

---

## 📍 PASO 6: Pegar en tu Archivo Local

### 6.1. Abrir el archivo `.env.local`

1. **Abre tu editor de código** (VS Code, o el que uses)
2. **Abre la carpeta del proyecto:**
   ```
   c:\Users\Jonathan\Documents\Crecemas\crece-mas
   ```
3. **Busca el archivo `.env.local`** en la raíz del proyecto
   - Si no lo ves, puede estar oculto
   - En VS Code, presiona `Ctrl+Shift+P` y busca "Reveal in Explorer"

### 6.2. Editar el archivo

Abre `.env.local` y verás algo así:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 6.3. Reemplazar los valores

**CAMBIA ESTO:**
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
```

**POR ESTO** (pega la URL que copiaste de Supabase):
```env
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

**Y CAMBIA ESTO:**
```env
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**POR ESTO** (pega la clave que copiaste de Supabase):
```env
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6.4. Guardar

- Presiona **Ctrl+S** para guardar
- Cierra el archivo

---

## 📍 PASO 7: Reiniciar el Servidor

1. **Ve a la terminal** donde está corriendo `npm start`
2. **Detén el servidor:** Presiona **Ctrl+C**
3. **Reinicia el servidor:**
   ```bash
   npm start
   ```
4. **Espera** a que compile (verás "Compiled successfully!")

---

## ✅ Verificar que Funcionó

1. **Abre el navegador** en `http://localhost:3000`
2. **Abre la consola** (F12 → pestaña Console)
3. **Verifica:**
   - ✅ No hay errores rojos sobre "Variables de entorno"
   - ✅ No hay errores sobre "Supabase"
   - ✅ La página carga (ya no está en blanco)

---

## 🆘 Problemas Comunes

### "No veo el archivo .env.local"

**Solución:**
1. Puede estar oculto
2. En VS Code, ve a View → Show Hidden Files
3. O crea uno nuevo: Archivo → Nuevo → `.env.local`

### "No sé dónde está mi proyecto en Supabase"

**Solución:**
1. Ve a https://supabase.com/dashboard
2. En la pantalla principal verás una lista de proyectos
3. Si no ves ninguno, haz clic en "New Project" para crear uno

### "No encuentro 'API' en Settings"

**Solución:**
1. Asegúrate de estar dentro de un proyecto (no en el dashboard principal)
2. Busca en el menú lateral izquierdo
3. Puede estar en "Configuration" → "API"
4. O busca "API" en la barra de búsqueda del menú

### "Copié la clave pero sigue sin funcionar"

**Solución:**
1. Verifica que copiaste **toda** la clave (son muy largas)
2. Verifica que NO hay espacios antes o después del `=`
3. Verifica que usas la clave **"anon public"**, no "service_role"
4. Guarda el archivo (Ctrl+S)
5. Reinicia el servidor (Ctrl+C y luego `npm start`)

---

## 📸 Ejemplo Visual de lo que Debes Ver

### En Supabase Dashboard:

```
┌─────────────────────────────────┐
│  Supabase Dashboard             │
├─────────────────────────────────┤
│  [Proyecto 1] ← Haz clic aquí   │
│  [Proyecto 2]                   │
└─────────────────────────────────┘
```

### Dentro del Proyecto:

```
┌──────┬──────────────────────────┐
│      │  Nombre del Proyecto     │
│ S    │                          │
│ e    │  [Menú lateral:]         │
│ t    │  • Overview              │
│ t    │  • Table Editor          │
│ i    │  • Authentication        │
│ n    │  • Storage               │
│ g    │  • ⚙️ Settings ← AQUÍ    │
│ s    │    - General             │
│      │    - 🔑 API ← Y AQUÍ     │
│      │    - Database            │
└──────┴──────────────────────────┘
```

### En la página API:

```
┌─────────────────────────────────────┐
│  API Configuration                  │
├─────────────────────────────────────┤
│                                     │
│  Project URL:                       │
│  https://xxx.supabase.co            │
│  [Copy] ← Copia esto               │
│                                     │
│  Project API keys:                  │
│                                     │
│  anon public                        │
│  eyJhbGciOiJIUzI1NiIs...           │
│  [Reveal] [Copy] ← Copia esto      │
│                                     │
└─────────────────────────────────────┘
```

### En tu archivo .env.local (después de editarlo):

```env
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=info
```

---

## 💡 Resumen Ultra Rápido

1. ✅ Ve a https://supabase.com/dashboard
2. ✅ Entra a tu proyecto (o créalo)
3. ✅ Menú izquierdo → Settings → API
4. ✅ Copia "Project URL"
5. ✅ Copia "anon public" key
6. ✅ Pega ambos en `.env.local`
7. ✅ Guarda y reinicia servidor

---

**¿Necesitas ayuda con algún paso específico?** Dime en qué paso estás y te ayudo.
