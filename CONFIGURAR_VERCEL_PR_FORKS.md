# 🔧 Configurar Vercel para Aprobar PRs desde Forks

## 📍 Dónde Aprobar la Autorización en Vercel

### **Paso 1: Acceder al Dashboard de Vercel**

1. **Ve a:**
   ```
   https://vercel.com/dashboard
   ```

2. **Inicia sesión** con la cuenta que tiene el proyecto conectado

---

### **Paso 2: Seleccionar el Proyecto**

1. **Busca el proyecto `crece-mas`** (o el nombre que tenga)
2. **Haz clic en el proyecto** para abrir su dashboard

---

### **Paso 3: Ir a Configuración de Git**

1. **Haz clic en "Settings"** (Configuración) en la barra superior
2. **En el menú lateral izquierdo, busca y haz clic en "Git"**

   ```
   Settings
   ├── General
   ├── Domains
   ├── Git          ← AQUÍ
   ├── Environment Variables
   ├── Build & Development Settings
   └── ...
   ```

---

### **Paso 4: Configurar Fork PR Deployments**

1. **En la sección "Git", busca:**
   - "Fork Pull Request Deployments" 
   - O "Pull Request Deployments from Forks"
   - O "Deploy Pull Requests from Forks"

2. **Habilita la opción:**
   - ✅ Activa el toggle o checkbox que dice algo como:
     - "Deploy Pull Requests from Forks"
     - "Allow deployments from forked repositories"
     - "Enable fork deployments"

3. **Guarda los cambios** (si hay un botón "Save")

---

## 🔍 Ubicación Exacta en la UI de Vercel

### **Navegación Visual:**

```
Vercel Dashboard
└── Proyecto: crece-mas
    └── Settings (pestaña superior)
        └── Git (menú lateral izquierdo)
            └── Scroll hacia abajo
                └── "Fork Pull Request Deployments"
                    └── [Toggle ON/OFF]  ← Activar aquí
```

---

## ⚙️ Configuración Alternativa (si no aparece)

### **Opción A: Desde Project Settings → Git**

Si no encuentras la opción exacta:

1. **Ve a Settings → Git**
2. **Busca la sección "Pull Request Deployments"**
3. **Habilita "Deploy pull requests"** si está desactivado
4. **Debajo, busca opciones específicas de forks**

---

### **Opción A: Desde GitHub Integration**

1. **En Vercel Dashboard → Settings → Git**
2. **Ve a la sección de integración con GitHub**
3. **Busca "Install Vercel for GitHub"** o similar
4. **Asegúrate de que la instalación incluya acceso a forks**

---

## 🎯 Configuración Recomendada

Para permitir PRs desde forks, la configuración ideal es:

```
✅ Deploy Pull Requests: ENABLED
✅ Fork Pull Request Deployments: ENABLED
✅ Build Pull Request Previews: ENABLED
```

---

## 🔄 Después de Habilitar

1. **Vuelve al PR en GitHub:**
   ```
   https://github.com/JuanGilles123/crece-mas/pulls
   ```

2. **Re-ejecuta el check de Vercel:**
   - Haz clic en los tres puntos (⋯) junto al check fallido
   - Selecciona "Re-run" o "Re-run jobs"
   - O simplemente espera unos minutos, Vercel puede reintentar automáticamente

3. **El check debería pasar ahora:**
   - ✅ Vercel creará un preview deployment
   - ✅ El check se marcará como "passed"

---

## 📝 Pasos Resumidos

1. ✅ **Vercel Dashboard** → `https://vercel.com/dashboard`
2. ✅ **Seleccionar proyecto** `crece-mas`
3. ✅ **Settings** (pestaña superior)
4. ✅ **Git** (menú lateral izquierdo)
5. ✅ **Habilitar "Fork Pull Request Deployments"**
6. ✅ **Guardar cambios**
7. ✅ **Volver a GitHub y re-ejecutar el check**

---

## 🆘 Si No Tienes Acceso

Si **NO eres el dueño del proyecto en Vercel**:

1. **Necesitas que el dueño** (`JuanGilles123` o quien tenga acceso de admin) haga esta configuración

2. **Puedes pedirle:**
   - Que vaya a Settings → Git
   - Que habilite "Fork Pull Request Deployments"
   - O que te agregue como miembro del equipo en Vercel

3. **Comenta en el PR:**
   ```markdown
   El check de Vercel necesita autorización. 
   ¿Alguien con acceso de admin en Vercel puede habilitar 
   "Fork Pull Request Deployments" en Settings → Git?
   ```

---

## ✅ Verificación

Después de configurar, verifica:

- ✅ El toggle está activado (ON)
- ✅ Los cambios están guardados
- ✅ En GitHub, el check de Vercel se actualiza (puede tardar 1-2 minutos)

---

## 📸 Ubicación Visual (descripción)

**En Vercel Dashboard:**
- Barra superior: `Project Name | Settings | Deployments | ...`
- Menú lateral izquierdo (dentro de Settings):
  - General
  - Domains  
  - **Git** ← Aquí
  - Environment Variables
  - Build & Development Settings
  - ...

**Dentro de la sección Git:**
- Verás la conexión con GitHub
- Scroll hacia abajo
- Sección "Pull Request Deployments"
- Toggle: "Deploy pull requests from forks" o similar

---

## 💡 Nota Importante

- Esta configuración permite que Vercel despliegue previews de PRs desde forks
- Una vez mergeado a `main`, Vercel desplegará automáticamente (esto funciona siempre)
- El preview es útil para ver los cambios antes de mergear
