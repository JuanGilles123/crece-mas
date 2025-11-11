// Edge Function para recibir webhooks de Wompi
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-event-signature',
}

// Función para verificar la firma de Wompi
async function verifyWompiSignature(
  signature: string,
  payload: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const signatureBytes = new Uint8Array(
    signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  )

  return await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(payload)
  )
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Usamos service role para admin
    )

    // Obtener payload
    const payload = await req.text()
    const event = JSON.parse(payload)

    // Verificar firma de Wompi (seguridad)
    const signature = req.headers.get('x-event-signature') || req.headers.get('x-signature')
    const eventsSecret = Deno.env.get('WOMPI_EVENTS_SECRET')

    if (signature && eventsSecret) {
      const isValid = await verifyWompiSignature(signature, payload, eventsSecret)
      if (!isValid) {
        console.error('Firma inválida de Wompi')
        return new Response(
          JSON.stringify({ error: 'Firma inválida' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        )
      }
    }

    console.log('📨 Webhook recibido de Wompi:', event)

    // Procesar según el tipo de evento
    const { event: eventType, data } = event

    if (eventType === 'transaction.updated') {
      const transaction = data.transaction
      const transactionId = transaction.id
      const status = transaction.status
      const reference = transaction.reference

      console.log(`💳 Transacción ${transactionId} actualizada a: ${status}`)

      // Buscar el pago en la base de datos
      const { data: payment, error: paymentError } = await supabaseClient
        .from('payments')
        .select('*, organization_id')
        .eq('wompi_transaction_id', transactionId)
        .single()

      if (paymentError || !payment) {
        console.error('Pago no encontrado:', paymentError)
        return new Response(
          JSON.stringify({ error: 'Pago no encontrado', received: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Respondemos 200 para que Wompi no reintente
          }
        )
      }

      // Actualizar estado del pago
      if (status === 'APPROVED') {
        // ✅ Pago aprobado - Activar suscripción
        console.log('✅ Pago aprobado, activando suscripción...')

        // Actualizar el pago
        await supabaseClient
          .from('payments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', payment.id)

        // Calcular fechas de la suscripción
        const now = new Date()
        const periodEnd = new Date(now)
        
        if (payment.billing_period === 'yearly') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1)
        }

        // Verificar si ya existe una suscripción activa
        const { data: existingSub } = await supabaseClient
          .from('subscriptions')
          .select('id')
          .eq('organization_id', payment.organization_id)
          .eq('status', 'active')
          .single()

        if (existingSub) {
          // Actualizar suscripción existente
          await supabaseClient
            .from('subscriptions')
            .update({
              plan_id: payment.plan_id,
              billing_period: payment.billing_period,
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSub.id)

          console.log('✅ Suscripción actualizada:', existingSub.id)
        } else {
          // Crear nueva suscripción
          const { data: newSub, error: subError } = await supabaseClient
            .from('subscriptions')
            .insert({
              organization_id: payment.organization_id,
              plan_id: payment.plan_id,
              status: 'active',
              billing_period: payment.billing_period,
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              wompi_subscription_id: transactionId,
            })
            .select()
            .single()

          if (subError) {
            console.error('Error creando suscripción:', subError)
          } else {
            console.log('✅ Suscripción creada:', newSub.id)
          }
        }

      } else if (status === 'DECLINED' || status === 'ERROR') {
        // ❌ Pago rechazado
        console.log('❌ Pago rechazado o error')

        await supabaseClient
          .from('payments')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', payment.id)

      } else if (status === 'VOIDED') {
        // 🚫 Pago anulado
        console.log('🚫 Pago anulado')

        await supabaseClient
          .from('payments')
          .update({
            status: 'cancelled',
            completed_at: new Date().toISOString(),
          })
          .eq('id', payment.id)
      }
    }

    // Responder a Wompi que recibimos el webhook
    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error procesando webhook:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error procesando webhook',
        received: true // Importante para que Wompi no reintente
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})
