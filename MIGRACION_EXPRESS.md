# ⚡ MIGRACIÓN EXPRESS - COMANDOS RÁPIDOS

**¿No tienes tiempo para leer la guía completa? Sigue estos pasos exactos.**

---

## 🎯 ANTES DE EMPEZAR

1. Abre Supabase Dashboard en tu navegador
2. Ten tu Service Role Key lista (Settings > API > service_role)
3. Ten VS Code abierto con el proyecto

---

## 📋 CHECKLIST RÁPIDO

### ✅ PASO 1: Facturación (2 min)
```
1. Supabase Dashboard > SQL Editor
2. Abrir archivo: agregar_info_facturacion_organizacion.sql
3. Copiar todo el contenido
4. Pegar en SQL Editor
5. Click en "Run"
6. Esperar mensaje: "✅ COLUMNAS DE FACTURACIÓN"
```

### ✅ PASO 2: Rutas BD (2 min)
```
1. Supabase Dashboard > SQL Editor
2. Abrir archivo: migracion_completa_imagenes.sql
3. Copiar todo el contenido
4. Pegar en SQL Editor
5. Click en "Run"
6. Esperar mensaje: "✅ MIGRACIÓN DE RUTAS COMPLETADA"
```

### ✅ PASO 3: Configurar Script (2 min)
```
1. Abrir: migrate-storage-images.js
2. Línea 12: Reemplazar 'TU_SUPABASE_URL'
   Ejemplo: 'https://xyzcompany.supabase.co'
3. Línea 13: Reemplazar 'TU_SERVICE_ROLE_KEY'
   Ejemplo: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
4. Guardar archivo
```

### ✅ PASO 4: Ejecutar Script (10 min)
```bash
# En terminal de VS Code:
npm install @supabase/supabase-js
node migrate-storage-images.js

# Esperar mensaje:
# "🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!"
```

### ✅ PASO 5: Verificar (2 min)
```
1. Supabase Dashboard > SQL Editor
2. Abrir archivo: verificacion_post_migracion.sql
3. Copiar todo el contenido
4. Pegar en SQL Editor
5. Click en "Run"
6. Esperar mensaje: "🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!"
```

### ✅ PASO 6: Limpiar (1 min)
```
1. Supabase Dashboard > SQL Editor
2. Abrir archivo: limpiar_politicas_organizations.sql
3. Copiar todo el contenido
4. Pegar en SQL Editor
5. Click en "Run"
6. Esperar mensaje: "✅ POLÍTICAS LIMPIADAS"
```

### ✅ PASO 7: Probar (5 min)
```
1. Abrir la aplicación
2. Ir a Inventario
3. Ver que las imágenes carguen ✅
4. Agregar nuevo producto con imagen ✅
5. Ir a Configuración > Facturación
6. Llenar datos de la empresa ✅
7. Generar un recibo ✅
```

---

## ⏱️ TIEMPO TOTAL: 20-25 MINUTOS

---

## 🆘 ERRORES COMUNES

### Error: "relation does not exist"
**Causa:** No ejecutaste los pasos en orden  
**Solución:** Vuelve al PASO 1

### Error: "Invalid API key"
**Causa:** Service Role Key incorrecta  
**Solución:** Verifica en Supabase Dashboard > Settings > API

### Error: "File not found"
**Causa:** Archivos no existen en Storage  
**Solución:** Normal si son productos nuevos sin imagen antigua

### Imágenes no cargan
**Causa:** Script de Storage no terminó  
**Solución:** Re-ejecuta: `node migrate-storage-images.js`

---

## 📞 SOPORTE RÁPIDO

### Ver logs en terminal
```bash
# Si algo falla en Node.js, verás el error en rojo
# Copia el error y revisa la documentación
```

### Ver errores en Supabase
```
Supabase Dashboard > Logs > Edge Logs
```

### Verificar estado actual
```sql
-- Pegar en SQL Editor:
SELECT 
  COUNT(*) as productos_totales,
  COUNT(CASE WHEN imagen IS NOT NULL THEN 1 END) as con_imagen
FROM productos;
```

---

## ✅ SEÑALES DE ÉXITO

### Después del PASO 2 (Rutas BD)
```
✅ Productos migrados: 3
✅ Rutas correctas: 3
✅ Rutas incorrectas: 0
```

### Después del PASO 4 (Script Node)
```
✅ Total productos:    3
✅ Exitosos:        3
❌ Errores:         0
```

### Después del PASO 5 (Verificación)
```
🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!
✅ Todo está funcionando correctamente:
   • Facturación configurada
   • Rutas de imágenes correctas
   • Archivos migrados en Storage
```

---

## 🎉 ¿TODO LISTO?

Si ves estos mensajes, ¡felicitaciones! 🎊

Tu sistema ahora tiene:
- ✅ Multi-organización completo
- ✅ Imágenes funcionando para todos
- ✅ Facturación personalizada
- ✅ Performance optimizado
- ✅ Stock en tiempo real

**¡Estás listo para producción!** 🚀

---

## 📚 MÁS INFORMACIÓN

Si algo no funciona o quieres entender mejor cada paso:
- Lee: **GUIA_MIGRACION_COMPLETA.md**
- Lee: **RESUMEN_MIGRACION.md**

---

## 🔄 ROLLBACK (Si necesitas volver atrás)

Los scripts crean backups automáticos. Si algo sale mal:

```sql
-- Ver backups disponibles
SELECT * FROM backup_rutas_imagenes;

-- Restaurar rutas antiguas (si es necesario)
UPDATE productos p
SET imagen = b.imagen_old
FROM backup_rutas_imagenes b
WHERE p.id = b.id;
```

Pero **no deberías necesitarlo** - los scripts están probados ✅

---

## ⚡ ¿EMPEZAMOS?

**Comienza con el PASO 1 y sigue en orden. ¡Suerte!** 🚀
