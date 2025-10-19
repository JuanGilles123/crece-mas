# 🚨 GUÍA DE SOLUCIÓN RÁPIDA

## ⚠️ PROBLEMA: "Ya ejecuté el script pero no veo nada"

### ✅ SOLUCIÓN PASO A PASO:

---

## 📝 **PASO 1: Ejecutar Diagnóstico**

1. Ve a **Supabase Dashboard → SQL Editor**
2. Abre `diagnostico_roles.sql`
3. **BUSCA esta línea (casi al final):**
   ```sql
   WHERE au.email = 'tu-email@ejemplo.com'; -- ⚠️ CAMBIA ESTO
   ```
4. **CÁMBIALA por tu email real:**
   ```sql
   WHERE au.email = 'tuemail@real.com';
   ```
5. Ejecuta todo el script
6. **MIRA los resultados** en la sección "TU USUARIO ACTUAL"

---

## 🔍 **PASO 2: Interpretar Resultados**

### **Caso A: Dice "❌ No existe en user_profiles"**
➡️ **EJECUTA:** `migracion_usuarios_existentes.sql`

### **Caso B: Dice "⚠️ Sin organización asignada"**
➡️ **EJECUTA:** `migracion_usuarios_existentes.sql`

### **Caso C: Dice "⚠️ No está en team_members"**
➡️ **EJECUTA:** `migracion_usuarios_existentes.sql`

### **Caso D: Dice "✅ Todo correcto"**
➡️ **SALTA al PASO 4** (limpiar caché)

---

## 🔄 **PASO 3: Ejecutar Migración**

1. Ve a **Supabase Dashboard → SQL Editor**
2. Abre `migracion_usuarios_existentes.sql`
3. Ejecuta TODO el script
4. **Espera estos mensajes:**
   ```
   ✅ Migración completada exitosamente!
   📊 Total de usuarios migrados: X
   🏢 Total de organizaciones creadas: X
   ```
5. Si ves errores, **cópialos** y compártelos

---

## 🧹 **PASO 4: Limpiar Caché y Reiniciar**

### **EN TU APLICACIÓN:**

1. **Cierra sesión** en Crece+
2. **Limpia caché del navegador:**
   - **Chrome/Edge:** Ctrl+Shift+Delete (Windows) o Cmd+Shift+Delete (Mac)
   - Selecciona: "Cookies" y "Caché"
   - Rango: "Todo el tiempo"
   - Haz clic en "Borrar datos"
3. **Cierra el navegador completamente**
4. **Abre el navegador nuevamente**
5. **Inicia sesión** en Crece+

---

## 🎯 **PASO 5: Verificar que Funciona**

### **Deberías ver:**

#### **1. En el Sidebar (menú lateral izquierdo):**
```
┌─────────────────────┐
│  [Logo Crece+]      │
│  Nombre Negocio     │ ← Nombre de tu organización
├─────────────────────┤
│  📊 Dashboard       │
│  💰 Caja           │
│  📦 Inventario     │
│  📈 Resumen        │
│  👥 Equipo         │ ← ⚠️ DEBE APARECER AQUÍ
│  👤 Perfil         │
├─────────────────────┤
│ 👑 Propietario     │ ← Tu rol
└─────────────────────┘
```

#### **2. Al hacer clic en "Equipo":**
- Verás una página con tu información
- Botón "Invitar Miembro" visible
- Estadísticas de tu equipo

---

## ❌ **TROUBLESHOOTING: Aún no funciona**

### **Problema 1: No aparece "Equipo" en el menú**

**Verifica tu rol:**
```sql
SELECT 
  au.email,
  up.role,
  o.name as organization_name
FROM auth.users au
JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN organizations o ON up.organization_id = o.id
WHERE au.email = 'TU-EMAIL-AQUI';
```

**Debe decir:** `role: owner`

**Si dice otra cosa o NULL:**
```sql
UPDATE user_profiles
SET role = 'owner'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'TU-EMAIL-AQUI');
```

---

### **Problema 2: Error "organization is undefined"**

**Ejecuta esto:**
```sql
-- Ver organizaciones
SELECT * FROM organizations;

-- Si está vacío, crear una manualmente:
INSERT INTO organizations (owner_id, name, business_type)
SELECT 
  id,
  'Mi Negocio',
  'retail'
FROM auth.users
WHERE email = 'TU-EMAIL-AQUI';

-- Actualizar perfil con la organización
UPDATE user_profiles up
SET organization_id = o.id
FROM organizations o
WHERE o.owner_id = up.user_id;
```

---

### **Problema 3: Error en consola del navegador**

**Abre la consola (F12) y busca errores:**

- **"get_user_permissions is not a function"**
  ➡️ Ejecuta nuevamente `setup_roles_equipos.sql`

- **"RLS policy violation"**
  ➡️ Ejecuta:
  ```sql
  ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
  ```

- **"Cannot read property 'role' of null"**
  ➡️ Ejecuta `migracion_usuarios_existentes.sql`

---

### **Problema 4: Limpiaste caché pero sigue sin funcionar**

**Fuerza actualización del Context:**

1. Ve a `src/context/AuthContext.js`
2. Agrega un `console.log` temporal:
   ```javascript
   useEffect(() => {
     supabase.auth.getSession().then(({ data: { session } }) => {
       setUser(session?.user ?? null);
       if (session?.user) {
         console.log('🔍 Loading profile for user:', session.user.id);
         loadUserProfile(session.user.id);
       }
       setLoading(false);
     });
     // ...
   }, []);
   ```
3. Guarda y recarga la app
4. Abre consola (F12) y verifica si aparece el log
5. Si no aparece, hay un problema con la autenticación

---

## 📞 **¿Sigue sin funcionar?**

Ejecuta este script y comparte los resultados:

```sql
-- DIAGNÓSTICO COMPLETO
SELECT 
  'Email' as campo,
  au.email as valor
FROM auth.users au
WHERE au.email = 'TU-EMAIL-AQUI'

UNION ALL

SELECT 
  'User ID' as campo,
  au.id::text as valor
FROM auth.users au
WHERE au.email = 'TU-EMAIL-AQUI'

UNION ALL

SELECT 
  'Existe en user_profiles' as campo,
  CASE WHEN up.user_id IS NOT NULL THEN 'SÍ ✅' ELSE 'NO ❌' END as valor
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE au.email = 'TU-EMAIL-AQUI'

UNION ALL

SELECT 
  'Rol' as campo,
  COALESCE(up.role, 'NULL ❌') as valor
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE au.email = 'TU-EMAIL-AQUI'

UNION ALL

SELECT 
  'Organization ID' as campo,
  COALESCE(up.organization_id::text, 'NULL ❌') as valor
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE au.email = 'TU-EMAIL-AQUI'

UNION ALL

SELECT 
  'Organization Name' as campo,
  COALESCE(o.name, 'NULL ❌') as valor
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN organizations o ON up.organization_id = o.id
WHERE au.email = 'TU-EMAIL-AQUI'

UNION ALL

SELECT 
  'En team_members' as campo,
  CASE WHEN tm.id IS NOT NULL THEN 'SÍ ✅' ELSE 'NO ❌' END as valor
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN team_members tm ON tm.user_id = au.id
WHERE au.email = 'TU-EMAIL-AQUI';
```

**Comparte esta salida para ayuda específica.**

---

## ✅ **RESUMEN DE COMANDOS**

```bash
# 1. Ejecutar en orden:
1. setup_roles_equipos.sql          # Base del sistema
2. diagnostico_roles.sql            # Verificar estado
3. migracion_usuarios_existentes.sql # Si ya tenías cuenta
4. Cerrar sesión + limpiar caché    # Reiniciar app
5. Iniciar sesión nuevamente        # Probar
```

---

¡Con estos pasos debería funcionar! 🎉
