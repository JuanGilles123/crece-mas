# 🧪 Guía para Probar el Build Local

Esta guía te ayudará a probar tu build de producción localmente antes de desplegar.

---

## 📋 Prerrequisitos

1. ✅ Build completado exitosamente (`npm run build`)
2. ✅ Variables de entorno configuradas en `.env.local`
3. ✅ Base de datos de Supabase configurada

---

## 🚀 Método 1: Usar `serve` (Recomendado)

### Paso 1: Instalar `serve` globalmente (si no lo tienes)

```bash
npm install -g serve
```

### Paso 2: Servir el build

```bash
npm run serve
```

Esto iniciará un servidor en `http://localhost:3000`

### Paso 3: Abrir en el navegador

1. Abre tu navegador
2. Ve a `http://localhost:3000`
3. Prueba la aplicación

---

## 🌐 Método 2: Usar `http-server`

### Paso 1: Instalar `http-server`

```bash
npm install -g http-server
```

### Paso 2: Servir el build

```bash
cd build
http-server -p 3000 -c-1
```

El flag `-c-1` deshabilita el cache para desarrollo.

---

## 🔧 Método 3: Usar Python (si lo tienes instalado)

### Python 3:

```bash
cd build
python -m http.server 3000
```

### Python 2:

```bash
cd build
python -m SimpleHTTPServer 3000
```

---

## ✅ Checklist de Pruebas

### 1. Verificación Inicial

- [ ] La aplicación carga sin errores en la consola
- [ ] No hay errores 404 en Network tab
- [ ] El diseño se ve correctamente
- [ ] Las rutas funcionan (navegación)

### 2. Autenticación

- [ ] Puedes registrarte correctamente
- [ ] Puedes iniciar sesión
- [ ] Puedes cerrar sesión
- [ ] El flujo de recuperación de contraseña funciona
- [ ] Las rutas protegidas redirigen correctamente

### 3. Funcionalidad Principal

- [ ] Puedes crear productos
- [ ] Puedes editar productos
- [ ] Puedes eliminar productos
- [ ] Las imágenes de productos se cargan correctamente
- [ ] Puedes realizar ventas
- [ ] Puedes generar recibos en PDF
- [ ] Los gráficos y reportes funcionan

### 4. Performance

- [ ] La aplicación carga rápidamente
- [ ] Las imágenes se cargan de forma optimizada
- [ ] No hay errores de memoria en la consola
- [ ] El scroll es fluido

### 5. Responsive Design

- [ ] Funciona correctamente en desktop
- [ ] Funciona correctamente en tablet
- [ ] Funciona correctamente en móvil
- [ ] El menú lateral funciona en móvil

### 6. Headers de Seguridad

Abre DevTools → Network → Recarga la página → Selecciona cualquier request → Headers

Verifica que aparezcan (o se configuren correctamente en el servidor de producción):

- [ ] Content-Security-Policy
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] Referrer-Policy

---

## 🔍 Verificar Variables de Entorno

### Importante: Variables en Build

**⚠️ IMPORTANTE:** Las variables de entorno se compilan en el build. Si cambias variables después de hacer el build, necesitas reconstruir:

```bash
npm run build
```

### Verificar Variables

Para verificar que las variables estén correctas:

1. Abre DevTools → Application → Local Storage
2. O verifica en el código fuente (view source) que las URLs de Supabase sean correctas

---

## 🐛 Solución de Problemas

### Error: "Module not found"

1. Limpia el build y reconstruye:
   ```bash
   rm -rf build
   npm run build
   ```

### Error: Variables de entorno no funcionan

1. Verifica que las variables tengan el prefijo `REACT_APP_`
2. Reconstruye el proyecto:
   ```bash
   npm run build
   ```

### Error: Rutas no funcionan (404 al refrescar)

Esto es normal con `serve`. El archivo `vercel.json` y `netlify.toml` ya tienen configurado el rewrites correcto. En producción esto funcionará automáticamente.

Para probarlo localmente con `serve`, usa:
```bash
serve -s build -l 3000
```

El flag `-s` (single-page application) maneja correctamente las rutas.

### Error: CORS o problemas de autenticación

1. Verifica que la URL en Supabase Dashboard incluya `localhost:3000`
2. Ve a Supabase → Authentication → URL Configuration
3. Agrega `http://localhost:3000` a:
   - Site URL
   - Redirect URLs

---

## 📊 Comparar Desarrollo vs Producción

| Aspecto | Desarrollo (`npm start`) | Producción (`npm run serve`) |
|---------|-------------------------|------------------------------|
| Tamaño del bundle | Sin optimizar | Optimizado y minificado |
| Hot reload | ✅ Sí | ❌ No |
| Source maps | ✅ Completos | ⚠️ Solo producción |
| Performance | Más lento | Más rápido |
| Errores detallados | ✅ Sí | ⚠️ Limitados |

---

## 🔄 Flujo Recomendado

1. **Desarrollo:**
   ```bash
   npm start  # Para desarrollo con hot reload
   ```

2. **Testing del build:**
   ```bash
   npm run build
   npm run serve  # Probar build local
   ```

3. **Despliegue:**
   - Después de verificar que todo funciona
   - Sube a Vercel/Netlify

---

## 💡 Tips

1. **Prueba en modo incógnito** para evitar problemas de cache
2. **Limpia el cache del navegador** si ves comportamientos extraños
3. **Verifica la consola** para errores de JavaScript
4. **Revisa Network tab** para requests fallidos
5. **Prueba en diferentes navegadores** (Chrome, Firefox, Safari)

---

## 🚀 Siguiente Paso

Una vez que hayas verificado que todo funciona correctamente en local, puedes proceder con el despliegue:

- [Guía de Despliegue](../deployment/DEPLOYMENT_GUIDE.md)
- [Guía Rápida de Despliegue](../../DEPLOYMENT_QUICKSTART.md)

---

**Última actualización:** 2024
