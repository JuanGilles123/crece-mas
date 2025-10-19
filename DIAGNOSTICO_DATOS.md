# 🔍 DIAGNÓSTICO: Por qué no aparecen los datos

## 📋 PASO 1: Verificar en Consola (F12)

Abre la consola del navegador y busca estos logs:

### ¿Aparece esto?
```
🎯 Usando organización seleccionada manualmente: {orgId: "xxx", role: "admin"}
✅ Organización cargada: {name: "Nombre del negocio", ...}
🔄 Perfil actualizado: {role: "admin", organization_id: "xxx"}
```

### Si NO aparece "🔄 Perfil actualizado":
El problema está en el AuthContext, el perfil no se está actualizando.

### Si SÍ aparece:
El problema está en los componentes que consultan los datos.

---

## 📋 PASO 2: Verificar localStorage

En consola (F12), escribe:

```javascript
console.log('Selected Org:', localStorage.getItem('selected_organization_id'));
console.log('Auth User:', JSON.parse(localStorage.getItem('sb-emxqvqbhbmdgdooxzvbc-auth-token')));
```

Copia y pega aquí el resultado.

---

## 📋 PASO 3: Verificar en Base de Datos

Ve a Supabase → **Table Editor** → **team_members**

Busca tu usuario y verifica:

### ¿Cuántas filas tiene tu usuario?
- [ ] 1 fila (solo organización original)
- [ ] 2 filas (original + invitación aceptada)
- [ ] Más de 2

### Si tiene 2 filas, verifica:
```
Fila 1:
- organization_id: xxx (tu organización original)
- role: owner
- status: active

Fila 2:
- organization_id: yyy (organización a la que te invitaron)
- role: admin (o el rol asignado)
- status: active ← DEBE SER "active"
```

---

## 📋 PASO 4: Verificar datos en la otra organización

Ve a Supabase SQL Editor y ejecuta:

```sql
-- Reemplaza 'ID_DE_LA_ORG_INVITADA' con el ID real
SELECT 
  'PRODUCTOS' as tabla,
  COUNT(*) as cantidad
FROM productos 
WHERE organization_id = 'ID_DE_LA_ORG_INVITADA'

UNION ALL

SELECT 
  'VENTAS' as tabla,
  COUNT(*) as cantidad
FROM ventas 
WHERE organization_id = 'ID_DE_LA_ORG_INVITADA';
```

### ¿Hay datos?
- Si **0 productos** y **0 ventas**: Es normal que aparezca vacío
- Si **hay datos**: El problema es que no se están consultando correctamente

---

## 📋 PASO 5: Prueba Manual

En consola (F12), ejecuta:

```javascript
// Obtener el contexto actual
const authContext = document.querySelector('[data-auth-context]');

// O verifica directamente
fetch('https://emxqvqbhbmdgdooxzvbc.supabase.co/rest/v1/productos?select=*', {
  headers: {
    'apikey': 'TU_ANON_KEY',
    'Authorization': 'Bearer ' + localStorage.getItem('sb-emxqvqbhbmdgdooxzvbc-auth-token')
  }
}).then(r => r.json()).then(data => console.log('Productos:', data));
```

---

## 🎯 SOLUCIÓN SEGÚN EL PROBLEMA

### Si el problema es: "No hay datos en esa organización"

**Es normal.** La organización está vacía. Para probar:

1. Cambia a esa organización con el selector
2. Ve a **Productos** → **Agregar Producto**
3. Crea un producto de prueba
4. Verifica que aparece

### Si el problema es: "Los datos no se consultan correctamente"

Necesito ver el código de tus componentes. Probablemente están usando:

```javascript
// ❌ INCORRECTO: Consulta sin filtrar por organización
const { data } = await supabase.from('productos').select('*');

// ✅ CORRECTO: Debe filtrar por organization_id
const { data } = await supabase
  .from('productos')
  .select('*')
  .eq('organization_id', userProfile.organization_id);
```

---

## 🔧 SOLUCIÓN TEMPORAL: Forzar Organización

Si quieres verificar que el selector funciona, ejecuta esto en consola:

```javascript
// Ver organización actual
console.log('Organización actual:', 
  JSON.parse(localStorage.getItem('sb-emxqvqbhbmdgdooxzvbc-auth-token'))
);

// Forzar cambio (reemplaza con el ID real)
localStorage.setItem('selected_organization_id', 'ID_DE_LA_ORGANIZACION_INVITADA');
window.location.reload();
```

---

## 📊 REPORTE DEL DIAGNÓSTICO

Por favor ejecuta los 5 pasos de arriba y responde:

1. **¿Qué logs aparecen en consola?**
   ```
   [Pega aquí los logs]
   ```

2. **¿Cuántas filas tiene tu usuario en team_members?**
   - [ ] 1
   - [ ] 2
   - [ ] Más

3. **¿La segunda fila tiene status='active'?**
   - [ ] Sí
   - [ ] No
   - [ ] No hay segunda fila

4. **¿Cuántos productos/ventas tiene la organización invitada?**
   - Productos: ___
   - Ventas: ___

5. **¿Qué muestra el dashboard actualmente?**
   - [ ] Datos de mi organización original
   - [ ] Completamente vacío
   - [ ] Error

---

Con esta información podré darte la solución exacta. 🎯
