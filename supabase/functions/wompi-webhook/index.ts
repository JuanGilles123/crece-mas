// Edge Function para recibir webhooks de Wompi
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'
import { sendEmail, SENDERS, isSendgridConfigured } from './sendgrid.ts'
import {
  renderSubscriptionActive,
  renderSubscriptionPaymentFailed
} from './emailTemplates.ts'

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
  try {
    const encoder = new TextEncoder()
    
    // Generar el hash HMAC-SHA256 del payload
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    )

    // Convertir a hex
    const hashArray = Array.from(new Uint8Array(signatureBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    console.log('🔐 Firma calculada:', hashHex.substring(0, 20) + '...')
    console.log('🔐 Firma recibida:', signature.substring(0, 20) + '...')
    
    // Comparación case-insensitive
    return hashHex.toLowerCase() === signature.toLowerCase()
  } catch (error) {
    console.error('❌ Error verificando firma:', error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🎯 Webhook llamado - Inicio')

  try {
    console.log('📡 Creando cliente Supabase...')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('� Leyendo payload...')
    const payload = await req.text()
    console.log('📦 Payload length:', payload.length)
    
    console.log('🔍 Parseando JSON...')
    let event
    try {
      event = JSON.parse(payload)
    } catch (parseError) {
      console.error('❌ Error parseando JSON:', parseError)
      console.error('   Payload recibido:', payload)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON', received: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }
    
    console.log('✅ Webhook recibido exitosamente')
    console.log('� Event type:', event.event)
    console.log('� Has data:', !!event.data)

    // Procesar según el tipo de evento
    const { event: eventType, data } = event

    if (eventType === 'transaction.updated') {
      // Wompi puede enviar la transacción en diferentes estructuras
      const transaction = data?.transaction || data
      
      if (!transaction) {
        console.error('❌ No se encontró transacción en el evento')
        console.error('   Estructura completa:', JSON.stringify(event, null, 2))
        return new Response(
          JSON.stringify({ error: 'Transaction not found in event', received: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      const transactionId = transaction.id
      const status = transaction.status
      const reference = transaction.reference

      console.log(`💳 Transacción ${transactionId} actualizada a: ${status}`)
      console.log(`📝 Reference: ${reference}`)

      if (!reference) {
        console.error('❌ No se encontró reference en la transacción')
        console.error('   Transacción completa:', JSON.stringify(transaction, null, 2))
        return new Response(
          JSON.stringify({ error: 'Reference not found in transaction', received: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      // Buscar el pago en la base de datos
      // Primero por reference, luego por transaction_id como fallback
      let payment = null
      let paymentError = null

      // Intentar buscar por reference primero
      if (reference) {
        const { data: paymentByRef, error: refError } = await supabaseClient
          .from('payments')
          .select('*')
          .eq('wompi_reference', reference)
          .maybeSingle()
        
        if (paymentByRef) {
          payment = paymentByRef
          console.log('✅ Pago encontrado por reference:', reference)
        } else if (refError) {
          console.warn('⚠️ Error buscando por reference:', refError)
        }
      }

      // Si no se encontró por reference, buscar por transaction_id
      if (!payment && transactionId) {
        const { data: paymentByTxId, error: txError } = await supabaseClient
          .from('payments')
          .select('*')
          .eq('wompi_transaction_id', transactionId)
          .maybeSingle()
        
        if (paymentByTxId) {
          payment = paymentByTxId
          console.log('✅ Pago encontrado por transaction_id:', transactionId)
        } else if (txError) {
          console.warn('⚠️ Error buscando por transaction_id:', txError)
        }
      }

      // Si aún no se encontró, buscar por transaction_id parcial (por si hay diferencias de formato)
      if (!payment && transactionId && transactionId.length > 10) {
        const { data: paymentsByPartial, error: partialError } = await supabaseClient
          .from('payments')
          .select('*')
          .like('wompi_transaction_id', `%${transactionId.substring(0, 10)}%`)
          .limit(1)
          .maybeSingle()
        
        if (paymentsByPartial) {
          payment = paymentsByPartial
          console.log('✅ Pago encontrado por transaction_id parcial')
        }
      }

      // Si aún no se encontró, buscar el último pago pendiente reciente (últimos 10 minutos)
      if (!payment) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
        const { data: recentPayments, error: recentError } = await supabaseClient
          .from('payments')
          .select('*')
          .eq('status', 'pending')
          .gte('created_at', tenMinutesAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (recentPayments) {
          console.log('⚠️ Usando último pago pendiente reciente como fallback')
          payment = recentPayments
        }
      }

      if (!payment) {
        console.error('❌ Pago no encontrado')
        console.error('   Reference buscado:', reference)
        console.error('   Transaction ID buscado:', transactionId)
        console.error('   Intentando buscar todos los pagos recientes...')
        
        // Log de todos los pagos recientes para debug
        const { data: allRecent } = await supabaseClient
          .from('payments')
          .select('id, wompi_reference, wompi_transaction_id, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
        
        console.error('   Últimos 5 pagos en BD:', JSON.stringify(allRecent, null, 2))
        
        return new Response(
          JSON.stringify({ 
            error: 'Pago no encontrado', 
            received: true,
            searched_reference: reference,
            searched_transaction_id: transactionId
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Respondemos 200 para que Wompi no reintente
          }
        )
      }

      console.log('✅ Pago encontrado:', payment.id, '- Organization:', payment.organization_id)

      // Actualizar estado del pago
      const fetchOwnerEmail = async (organizationId: string) => {
        const { data: org } = await supabaseClient
          .from('organizations')
          .select('owner_id, name')
          .eq('id', organizationId)
          .maybeSingle()

        if (!org?.owner_id) {
          return { email: null, name: org?.name || 'Crece+' }
        }

        const { data: ownerData } = await supabaseClient.auth.admin.getUserById(org.owner_id)
        return { email: ownerData?.user?.email || null, name: org?.name || 'Crece+' }
      }

      if (status === 'APPROVED') {
        // ✅ Pago aprobado - Activar suscripción
        console.log('✅ Pago aprobado, activando suscripción...')

        // Actualizar el pago con el transaction ID, reference y status
        // NOTA: El status debe ser 'approved' según la constraint de la tabla
        const updateData: any = {
          status: 'approved', // Cambiado de 'completed' a 'approved' para cumplir con la constraint
          wompi_transaction_id: transactionId,
          payment_date: new Date().toISOString(),
        }
        
        // Actualizar reference si no estaba guardado o es diferente
        if (reference && (!payment.wompi_reference || payment.wompi_reference !== reference)) {
          updateData.wompi_reference = reference
          console.log('📝 Actualizando wompi_reference:', reference)
        }
        
        const { error: paymentUpdateError } = await supabaseClient
          .from('payments')
          .update(updateData)
          .eq('id', payment.id)

        if (paymentUpdateError) {
          console.error('❌ Error actualizando pago:', paymentUpdateError)
          // Si falla la actualización del pago, retornamos error para que no siga e intente más tarde
          return new Response(
            JSON.stringify({ error: 'Error actualizando pago en BD', details: paymentUpdateError }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        } else {
          console.log('✅ Pago actualizado a approved')
        }

        // Calcular fechas de la suscripción
        const now = new Date()
        const periodEnd = new Date(now)
        
        if (payment.billing_period === 'yearly') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1)
        }

        // Verificar si ya existe una suscripción (de cualquier estado)
        const { data: existingSub, error: existingSubError } = await supabaseClient
          .from('subscriptions')
          .select('id, plan_id')
          .eq('organization_id', payment.organization_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existingSubError && existingSubError.code !== 'PGRST116') {
          console.error('❌ Error buscando suscripción existente:', existingSubError)
        }

        let subscriptionId: string | null = null

        if (existingSub) {
          // Actualizar suscripción existente
          // NOTA: billing_period NO existe en subscriptions, solo en payments
          const { data: updatedSub, error: updateError } = await supabaseClient
            .from('subscriptions')
            .update({
              plan_id: payment.plan_id,
              status: 'active', // Reactivar
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              cancel_at_period_end: false,
              wompi_subscription_id: transactionId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSub.id)
            .select()
            .single()

          if (updateError) {
            console.error('❌ Error actualizando suscripción:', updateError)
            // No detenemos el flujo completo pero es importante loguearlo como json
            console.error('   Detalles:', JSON.stringify(updateError, null, 2))
          } else {
            subscriptionId = updatedSub.id
            console.log('✅ Suscripción actualizada:', subscriptionId)
          }
        } else {
          // Crear nueva suscripción
          // NOTA: billing_period NO existe en subscriptions, solo en payments
          const { data: newSub, error: subError } = await supabaseClient
            .from('subscriptions')
            .insert({
              organization_id: payment.organization_id,
              plan_id: payment.plan_id,
              status: 'active',
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              wompi_subscription_id: transactionId,
            })
            .select()
            .single()

          if (subError) {
            console.error('❌ Error creando suscripción:', subError)
            console.error('   Detalles:', JSON.stringify(subError, null, 2))
          } else {
            subscriptionId = newSub.id
            console.log('✅ Suscripción creada:', subscriptionId)
          }
        }

        // Actualizar el pago con el subscription_id
        if (subscriptionId) {
          const { error: linkPaymentError } = await supabaseClient
            .from('payments')
            .update({ subscription_id: subscriptionId })
            .eq('id', payment.id)

          if (linkPaymentError) {
            console.error('❌ Error vinculando pago con suscripción:', linkPaymentError)
            console.error('   Detalles:', JSON.stringify(linkPaymentError, null, 2))
          } else {
            console.log('✅ Pago vinculado con suscripción:', subscriptionId)
          }

          // Actualizar la organización con el subscription_id
          const { error: orgUpdateError } = await supabaseClient
            .from('organizations')
            .update({ 
              subscription_id: subscriptionId,
              subscription_status: 'active'
            })
            .eq('id', payment.organization_id)

          if (orgUpdateError) {
            console.error('❌ Error actualizando organización:', orgUpdateError)
            console.error('   Detalles:', JSON.stringify(orgUpdateError, null, 2))
          } else {
            console.log('✅ Organización actualizada con suscripción:', subscriptionId)
          }
        } else {
          console.error('❌ No se pudo obtener subscription_id para vincular')
        }

        // Enviar correo de suscripción activa
        try {
          if (isSendgridConfigured) {
            const { email: ownerEmail, name: orgName } = await fetchOwnerEmail(payment.organization_id)
            if (ownerEmail) {
              const { data: plan } = await supabaseClient
                .from('subscription_plans')
                .select('name')
                .eq('id', payment.plan_id)
                .maybeSingle()

              const startDate = now.toISOString().split('T')[0]
              const endDate = periodEnd.toISOString().split('T')[0]

              const html = renderSubscriptionActive({
                name: orgName,
                planName: plan?.name || 'Plan Crece+',
                startDate,
                endDate,
                status: 'activa',
                dashboardUrl: 'https://crecemas.co/dashboard',
              })

              await sendEmail({
                to: ownerEmail,
                subject: 'Tu suscripción Crece+ está activa',
                html,
                from: SENDERS.BILLING,
              })
            }
          }
        } catch (emailError) {
          console.error('❌ Error enviando correo de suscripción activa:', emailError)
        }

      } else if (status === 'DECLINED' || status === 'ERROR') {
        // ❌ Pago rechazado
        console.log('❌ Pago rechazado o error')

        await supabaseClient
          .from('payments')
          .update({
            status: 'failed',
            payment_date: new Date().toISOString(),
          })
          .eq('id', payment.id)

        // Enviar correo de pago fallido
        try {
          if (isSendgridConfigured) {
            const { email: ownerEmail, name: orgName } = await fetchOwnerEmail(payment.organization_id)
            if (ownerEmail) {
              const html = renderSubscriptionPaymentFailed({
                name: orgName,
                supportUrl: 'https://crecemas.co/soporte',
              })

              await sendEmail({
                to: ownerEmail,
                subject: 'Problema con tu pago en Crece+',
                html,
                from: SENDERS.BILLING,
              })
            }
          }
        } catch (emailError) {
          console.error('❌ Error enviando correo de pago fallido:', emailError)
        }

      } else if (status === 'VOIDED') {
        // 🚫 Pago anulado
        console.log('🚫 Pago anulado')

        await supabaseClient
          .from('payments')
          .update({
            status: 'cancelled',
            payment_date: new Date().toISOString(),
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
