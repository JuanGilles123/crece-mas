# 🚀 Guía de Instalación - Sistema de Suscripciones con Wompi

## 📋 Prerrequisitos

1. **Cuenta de Wompi** (test o producción)
2. **Supabase CLI** instalado: `npm install -g supabase`
3. **Proyecto Supabase** activo

---

## 🔧 Configuración

### 1️⃣ **Instalar Supabase CLI**

```bash
npm install -g supabase
```

### 2️⃣ **Login en Supabase**

```bash
supabase login
```

### 3️⃣ **Link a tu proyecto**

```bash
supabase link --project-ref ywilkhfkuwhsjvojocso
```

### 4️⃣ **Configurar Secrets en Supabase**

Ve a tu **Dashboard de Supabase** → **Project Settings** → **Edge Functions** → **Secrets**

O usando CLI:

```bash
# Wompi Private Key (Backend)
supabase secrets set WOMPI_PRIVATE_KEY=prv_test_ihqcWruxXcOVoBMJk4h3lYQUk25xyFUb

# Wompi Public Key (Backend)
supabase secrets set WOMPI_PUBLIC_KEY=pub_test_xcq8VJUu4UvgTsJ2HxDZmf7qgSiQCUph

# Wompi Events Secret (Webhook validation)
supabase secrets set WOMPI_EVENTS_SECRET=test_events_HJ3JVcrVUti7i3MXBZyaV7pHQqpn7z84

# URL de redirección tras pago
supabase secrets set WOMPI_REDIRECT_URL=https://tu-dominio.vercel.app
```

### 5️⃣ **Deploy de Edge Functions**

```bash
# Deploy ambas funciones
supabase functions deploy create-checkout
supabase functions deploy wompi-webhook
```

O deploy todas a la vez:

```bash
supabase functions deploy
```

---

## 🌐 **Configurar Webhook en Wompi**

1. Ve a tu **Dashboard de Wompi** → **Configuración** → **Webhooks**
2. Agrega esta URL:

```
https://ywilkhfkuwhsjvojocso.supabase.co/functions/v1/wompi-webhook
```

3. Selecciona estos eventos:
   - ✅ `transaction.updated`
   - ✅ `transaction.completed`

---

## 🧪 **Probar el Sistema**

### **Modo Test (Local):**

1. Asegúrate de tener el `.env` configurado con la public key:
```bash
REACT_APP_WOMPI_PUBLIC_KEY=pub_test_xcq8VJUu4UvgTsJ2HxDZmf7qgSiQCUph
```

2. Inicia la app:
```bash
npm start
```

3. Ve a `/pricing` y haz clic en "Actualizar Plan"

4. Usa estas **tarjetas de prueba de Wompi**:

**Tarjeta aprobada:**
- Número: `4242 4242 4242 4242`
- CVV: cualquier 3 dígitos
- Fecha: cualquier fecha futura

**Tarjeta rechazada:**
- Número: `4111 1111 1111 1111`

---

## 📊 **Verificar que funciona**

### **Logs de Edge Functions:**

```bash
# Ver logs en tiempo real
supabase functions logs create-checkout
supabase functions logs wompi-webhook
```

### **Verificar en Base de Datos:**

```sql
-- Ver suscripciones creadas
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 10;

-- Ver pagos registrados
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- Ver planes disponibles
SELECT * FROM subscription_plans;
```

---

## 🔄 **Flujo Completo**

1. **Usuario** hace clic en "Actualizar Plan" → 
2. **Frontend** llama a Edge Function `create-checkout` →
3. **Edge Function** crea transacción en Wompi →
4. **Frontend** redirige al usuario a Wompi checkout →
5. **Usuario** completa el pago en Wompi →
6. **Wompi** envía webhook a `wompi-webhook` →
7. **Edge Function** verifica firma y activa suscripción →
8. **Usuario** es redirigido a página de éxito

---

## 🐛 **Troubleshooting**

### **Error: "Edge Function not found"**
```bash
# Verifica que las funciones estén deployed
supabase functions list
```

### **Error: "Invalid signature"**
- Verifica que el `WOMPI_EVENTS_SECRET` esté configurado correctamente
- Revisa los logs: `supabase functions logs wompi-webhook`

### **Error: "No se puede crear transacción"**
- Verifica que `WOMPI_PRIVATE_KEY` esté configurado
- Revisa los logs: `supabase functions logs create-checkout`

### **Pago exitoso pero suscripción no se activa**
- Verifica que el webhook esté configurado en Wompi
- Revisa los logs del webhook
- Verifica la URL del webhook en Wompi dashboard

---

## 🔐 **Seguridad**

- ✅ Las keys privadas NUNCA deben estar en el frontend
- ✅ Solo la public key va en el `.env` del frontend
- ✅ Las private keys van en Supabase Secrets
- ✅ El webhook valida la firma de Wompi
- ✅ RLS está habilitado en todas las tablas

---

## 📝 **Notas**

- **Modo TEST**: Usa las keys `pub_test_` y `prv_test_`
- **Modo PRODUCCIÓN**: Usa las keys `pub_prod_` y `prv_prod_`
- **Webhook URL**: Debe ser HTTPS (Supabase ya lo es)
- **CORS**: Ya está configurado en `supabase/config.toml`

---

## ✅ **Checklist de Deploy**

- [ ] Supabase CLI instalado
- [ ] Link a proyecto Supabase
- [ ] Secrets configurados en Supabase
- [ ] Edge Functions deployed
- [ ] Webhook URL configurado en Wompi
- [ ] .env configurado en frontend
- [ ] Probado con tarjeta de test
- [ ] Verificado logs de funciones
- [ ] Verificado datos en BD

---

## 🆘 **Soporte**

Si tienes problemas:
1. Revisa los logs de las Edge Functions
2. Verifica la configuración de secrets
3. Comprueba que el webhook esté activo en Wompi
4. Verifica los datos en la base de datos
