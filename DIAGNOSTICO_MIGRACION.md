# 🔍 DIAGNÓSTICO: Errores después de migración

## ✅ PROGRESO HASTA AHORA

1. ✅ Script `agregar_organization_id.sql` ejecutado
2. ✅ Columnas agregadas a la base de datos
3. ⚠️ Ahora hay errores de imágenes (400 Bad Request)

---

## 🎯 PRÓXIMOS PASOS

### 1️⃣ **Ejecuta el script de verificación**

Ve a **Supabase SQL Editor** y ejecuta:
```
verificar_y_corregir_organization_id.sql
```

Este script:
- ✅ Verifica cuántos productos/ventas tienen organization_id
- ✅ Corrige los que no tienen
- ✅ Muestra tus organizaciones y datos
- ✅ Lista tus productos visibles

---

### 2️⃣ **Recarga la página (F5)**

Después de ejecutar el script de verificación, recarga tu aplicación.

---

## 🖼️ ERRORES DE IMÁGENES (Secundario)

Los errores que ves:
```
POST .../storage/v1/object/sign/productos/... 400 (Bad Request)
```

Son porque las imágenes están almacenadas con rutas que incluyen el `user_id` antiguo:
```
productos/87b2e05c-382b-4eaa-b37f-dc2247b7f9a2/1758235817207_logo app.png
         ↑ Este es el user_id, no organization_id
```

**¿Es grave?** No, las imágenes siguen existiendo. Solo necesitamos:

**OPCIÓN A: Ignorar (Temporal)**
- Las imágenes antiguas pueden dar error
- Las nuevas imágenes que subas funcionarán bien

**OPCIÓN B: Migrar rutas de storage**
- Mover las imágenes de `user_id/` a `organization_id/`
- Actualizar las URLs en la tabla productos
- (Más complejo, solo si es necesario)

---

## 🔍 VERIFICAR SI LOS DATOS APARECEN

Abre la consola (F12) y busca:

### ✅ LOGS CORRECTOS:
```
🔍 Consultando productos para organization_id: 57b529d2-245f-43a8-9cf8-2de95fe13473
✅ Productos cargados: 5  ← DEBE SER > 0
```

### ❌ SI AÚN DA ERROR:
```
Error fetching productos: column productos.organization_id does not exist
```

**Solución:** El script no se ejecutó correctamente. Verifica en Supabase:

1. Ve a **Table Editor** → **productos**
2. Verifica que existe la columna `organization_id`
3. Si no existe, ejecuta `agregar_organization_id.sql` de nuevo

---

## 📊 CHECKLIST DE VERIFICACIÓN

- [ ] Ejecuté `agregar_organization_id.sql` en Supabase
- [ ] Vi mensaje "✅ MIGRACIÓN COMPLETADA"
- [ ] Ejecuté `verificar_y_corregir_organization_id.sql`
- [ ] Vi "✅ PERFECTO: Todos los datos tienen organization_id"
- [ ] Recargué la página (F5)
- [ ] En consola veo "✅ Productos cargados: X" (X > 0)
- [ ] Veo mis productos en el inventario
- [ ] Puedo hacer ventas en Caja
- [ ] El selector de organizaciones funciona

---

## 🎯 SI LOS DATOS NO APARECEN AÚN

Ejecuta en **Supabase SQL Editor**:

```sql
-- Ver TUS productos con su organization_id
SELECT 
  p.id,
  p.nombre,
  p.organization_id,
  o.name as organizacion,
  tm.user_id as tu_user_id,
  tm.role as tu_rol
FROM productos p
LEFT JOIN organizations o ON o.id = p.organization_id
LEFT JOIN team_members tm ON tm.organization_id = p.organization_id
WHERE tm.user_id = auth.uid()
  AND tm.status = 'active'
LIMIT 10;
```

**Resultado esperado:**
- Deberías ver tus productos
- Con `organization_id` correcto
- Y tu rol en esa organización

**Si no ves productos:**
- Puede que pertenezcan a otra organización
- O que el `organization_id` no se asignó correctamente
- Ejecuta `verificar_y_corregir_organization_id.sql`

---

## 🚨 ERROR MÁS COMÚN

**Si sigues viendo:**
```
column productos.organization_id does not exist
```

**Significa que el script NO se ejecutó.** 

1. Ve a Supabase SQL Editor
2. Verifica que estás en el proyecto correcto
3. Copia TODO el contenido de `agregar_organization_id.sql`
4. Pégalo en el editor
5. Haz clic en **RUN** ▶️
6. **Espera** que termine (verás mensajes en verde)
7. Recarga la app (F5)

---

## 📝 RESUMEN EJECUTIVO

| Paso | Qué hacer | Estado |
|------|-----------|--------|
| 1 | Ejecutar `agregar_organization_id.sql` | ✅ HECHO |
| 2 | Ejecutar `verificar_y_corregir_organization_id.sql` | ⏳ PENDIENTE |
| 3 | Recargar aplicación (F5) | ⏳ PENDIENTE |
| 4 | Verificar logs en consola | ⏳ PENDIENTE |
| 5 | Confirmar que datos aparecen | ⏳ PENDIENTE |

---

**Ejecuta el script de verificación y dime qué resultado te da.** 🔍
