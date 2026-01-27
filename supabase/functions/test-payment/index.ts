// Edge Function para simular un pago exitoso de Wompi (DESHABILITADA)
// Esta función ha sido deshabilitada por seguridad. Solo se permiten pagos reales.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Función deshabilitada - solo se permiten pagos reales
  return new Response(
    JSON.stringify({
      error: 'Función deshabilitada',
      message: 'Los pagos de prueba han sido deshabilitados. Solo se permiten pagos reales a través de Wompi.'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 403, // Forbidden
    }
  )

  /* CÓDIGO DESHABILITADO - Solo se permiten pagos reales
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { plan_id, billing_period, organization_id } = await req.json()

    console.log('🧪 Datos recibidos:', { plan_id, billing_period, organization_id })

    if (!plan_id || !billing_period || !organization_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Faltan parámetros requeridos',
          received: { plan_id, billing_period, organization_id }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('🧪 Simulando pago exitoso:', { plan_id, billing_period, organization_id })

    // 1. Obtener el plan
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single()

    if (!plan) {
      throw new Error('Plan no encontrado')
    }

    const amount = billing_period === 'yearly' ? plan.price_yearly : plan.price_monthly

    // 2. Crear referencia única
    const reference = `TEST-${organization_id.substring(0, 8)}-${Date.now()}`
    const transaction_id = `test_${Math.random().toString(36).substring(7)}`

    // 3. Registrar pago como aprobado (solo campos que seguro existen)
    console.log('💳 Creando pago con campos mínimos...')
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        organization_id: organization_id,
        plan_id: plan_id,
        amount: amount,
        currency: 'COP',
        status: 'approved',
        wompi_transaction_id: transaction_id,
        wompi_reference: reference,
        payment_date: new Date().toISOString(),
        metadata: { 
          test: true, 
          simulated: true,
          billing_period: billing_period 
        }
      })
      .select()
      .single()

    if (paymentError) {
      console.error('❌ Error al crear pago:', paymentError)
      console.error('❌ Detalles del error:', JSON.stringify(paymentError, null, 2))
      throw new Error(`Error al crear pago: ${paymentError.message}`)
    }
    
    console.log('✅ Pago creado exitosamente:', payment.id)

    // 4. Crear o actualizar suscripción
    const periodStart = new Date()
    const periodEnd = new Date()
    if (billing_period === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    // Buscar suscripción existente (puede haber múltiples, buscar la activa o la más reciente)
    const { data: existingSubs } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })

    let subscription
    const existingSub = existingSubs && existingSubs.length > 0 ? existingSubs[0] : null

    if (existingSub) {
      // Actualizar suscripción existente
      console.log('🔄 Actualizando suscripción existente:', existingSub.id)
      const { data: updatedSub, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_id: plan_id,
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          wompi_subscription_id: transaction_id,
        })
        .eq('id', existingSub.id)
        .select()
        .single()

      if (subError) {
        console.error('❌ Error actualizando suscripción:', subError)
        throw subError
      }
      subscription = updatedSub
      console.log('✅ Suscripción actualizada:', subscription.id, 'Plan:', plan_id)
    } else {
      // Crear nueva suscripción
      console.log('➕ Creando nueva suscripción')
      const { data: newSub, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          organization_id: organization_id,
          plan_id: plan_id,
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          wompi_subscription_id: transaction_id,
        })
        .select()
        .single()

      if (subError) {
        console.error('❌ Error creando suscripción:', subError)
        throw subError
      }
      subscription = newSub
      console.log('✅ Suscripción creada:', subscription.id, 'Plan:', plan_id)
    }

    // 5. Actualizar organization
    const { error: orgError } = await supabaseAdmin
      .from('organizations')
      .update({
        subscription_id: subscription.id,
        subscription_status: 'active',
      })
      .eq('id', organization_id)

    if (orgError) throw orgError

    // 6. Actualizar el payment con el subscription_id
    await supabaseAdmin
      .from('payments')
      .update({ subscription_id: subscription.id })
      .eq('id', payment.id)

    console.log('✅ Pago simulado exitosamente')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pago simulado exitosamente',
        data: {
          payment_id: payment.id,
          subscription_id: subscription.id,
          transaction_id: transaction_id,
          reference: reference,
          amount: amount,
          plan: plan.name,
          billing_period: billing_period,
          active_until: periodEnd.toISOString(),
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error en test-payment:', error)
    return new Response(
      JSON.stringify({
        error: 'Error al simular pago',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
  */
})
