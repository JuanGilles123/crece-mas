# Supabase Edge Functions Configuration

## Functions disponibles:

1. **create-checkout** - Crea una sesión de pago en Wompi
2. **wompi-webhook** - Recibe webhooks de Wompi para activar suscripciones

## Variables de entorno necesarias:

Configurar en Supabase Dashboard → Project Settings → Edge Functions:

```bash
WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxxxxxxxxxx
WOMPI_EVENTS_SECRET=test_events_xxxxxxxxxxxxx
WOMPI_REDIRECT_URL=https://tudominio.com/subscription/success
```

## Desplegar funciones:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref TU_PROJECT_REF

# Deploy create-checkout
supabase functions deploy create-checkout

# Deploy wompi-webhook
supabase functions deploy wompi-webhook
```

## URLs de las funciones:

Una vez desplegadas, las URLs serán:

```
https://TU_PROJECT_REF.supabase.co/functions/v1/create-checkout
https://TU_PROJECT_REF.supabase.co/functions/v1/wompi-webhook
```

## Configurar Webhook en Wompi:

1. Ir al dashboard de Wompi
2. Configuración → Webhooks
3. Agregar URL: `https://TU_PROJECT_REF.supabase.co/functions/v1/wompi-webhook`
4. Seleccionar evento: `transaction.updated`
5. Guardar

## Probar en local:

```bash
# Iniciar funciones localmente
supabase start
supabase functions serve --env-file ./supabase/.env.local

# Test create-checkout
curl -i --location --request POST 'http://localhost:54321/functions/v1/create-checkout' \
  --header 'Authorization: Bearer TU_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"plan_id":"plan-uuid","billing_period":"monthly"}'
```
