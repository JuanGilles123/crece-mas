# 🔑 Guía Rápida: Obtener Credenciales de Supabase

## 🎯 Objetivo

Obtener dos valores:
1. **REACT_APP_SUPABASE_URL** 
2. **REACT_APP_SUPABASE_ANON_KEY**

---

## ⚡ Pasos Rápidos

### 1️⃣ Accede a Supabase

- Ve a: https://supabase.com/dashboard
- Inicia sesión o crea una cuenta

### 2️⃣ Crea o Selecciona tu Proyecto

**Si no tienes proyecto:**
- Click en "New Project"
- Completa el formulario
- Espera 2-3 minutos

**Si ya tienes proyecto:**
- Selecciona tu proyecto del dashboard

### 3️⃣ Ve a Settings → API

1. En el menú lateral izquierdo, busca **"Settings"** ⚙️
2. Haz clic en **Settings**
3. En el submenú, haz clic en **"API"**

### 4️⃣ Copia las Credenciales

**Project URL:**
```
https://xxxxxxxxxx.supabase.co
```
➡️ Copia esta URL → Esta es tu `REACT_APP_SUPABASE_URL`

**anon public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
➡️ Haz clic en "Reveal" si está oculta
➡️ Copia toda la clave → Esta es tu `REACT_APP_SUPABASE_ANON_KEY`

### 5️⃣ Configura en tu Proyecto

1. Abre `.env.local` en la raíz del proyecto
2. Reemplaza los valores:

```env
REACT_APP_SUPABASE_URL=https://tu-proyecto-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

### 6️⃣ Reconstruye y Prueba

```bash
npm run build
npm run serve
```

---

## 📍 Ubicación Exacta

```
Supabase Dashboard
└── Tu Proyecto
    └── Settings ⚙️ (menú lateral)
        └── API ← AQUÍ
            ├── Project URL ← REACT_APP_SUPABASE_URL
            └── anon public ← REACT_APP_SUPABASE_ANON_KEY
```

---

## ⚠️ Importante

- ✅ Usa la **anon public key** (NO la service_role)
- ✅ Copia las claves completas (son muy largas)
- ✅ NO dejes espacios alrededor del `=`
- ✅ Después de cambiar `.env.local`, ejecuta `npm run build`

---

## 🆘 Si No Funciona

1. **Verifica que copiaste las claves completas**
2. **Verifica que NO hay espacios** antes o después del `=`
3. **Verifica que usas la anon key**, no service_role
4. **Reconstruye el build**: `npm run build`

---

**¿Necesitas más detalles?** Ver la [Guía Completa](docs/setup/OBTENER_CREDENCIALES_SUPABASE.md)
