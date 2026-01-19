# 🧪 Probar Build Local - Guía Rápida

## ✅ Paso 1: Verificar Variables de Entorno

Antes de servir el build, asegúrate de tener tus variables de entorno configuradas:

1. **Crea o verifica `.env.local`** (si no existe):
   ```bash
   # En Windows PowerShell:
   Copy-Item env.example .env.local
   
   # En Linux/Mac:
   cp env.example .env.local
   ```

2. **Edita `.env.local`** y agrega tus valores reales:
   ```env
   REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
   REACT_APP_DEBUG=false
   REACT_APP_LOG_LEVEL=error
   ```

3. **⚠️ IMPORTANTE:** Si cambiaste variables, **reconstruye el build**:
   ```bash
   npm run build
   ```

---

## 🚀 Paso 2: Servir el Build

Una vez que `serve` esté instalado y las variables estén configuradas:

```bash
npm run serve
```

Esto iniciará un servidor en: **http://localhost:3000**

---

## 🌐 Paso 3: Abrir en el Navegador

1. Abre tu navegador
2. Ve a: `http://localhost:3000`
3. Prueba la aplicación

---

## ✅ Checklist de Pruebas Rápidas

- [ ] La aplicación carga sin errores en la consola
- [ ] Puedes registrarte o iniciar sesión
- [ ] Puedes crear productos
- [ ] Puedes realizar ventas
- [ ] Las rutas funcionan correctamente
- [ ] No hay errores 404 en Network tab

---

## 🔧 Comandos Útiles

```bash
# Reconstruir si cambias variables de entorno
npm run build

# Servir el build
npm run serve

# Limpiar y reconstruir
Remove-Item -Recurse -Force build
npm run build
npm run serve
```

---

## 🐛 Problemas Comunes

### Error: Variables no funcionan
- ✅ Verifica que tengan el prefijo `REACT_APP_`
- ✅ Reconstruye: `npm run build`

### Error: CORS en autenticación
- ✅ Agrega `http://localhost:3000` a Supabase → Authentication → URL Configuration

### Error: Rutas dan 404 al refrescar
- ✅ Usa `npm run serve` que ya tiene el flag `-s` para SPAs

---

## 📚 Más Información

Para más detalles, consulta: [Guía Completa de Testing](docs/testing/TESTING_LOCAL_BUILD.md)

---

**¡Listo para probar! 🎉**
