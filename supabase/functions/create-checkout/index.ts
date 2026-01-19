// Edge Function para crear checkout de Wompi
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente admin - usaremos este para todo
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener el JWT de Supabase que automáticamente parsea y valida
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado - falta Authorization header' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Extraer y validar el token JWT manualmente usando el admin client
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: 'No autorizado',
          details: authError?.message || 'Token inválido',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Obtener datos del body
    const requestBody = await req.json()
    console.log('Request body:', requestBody)
    
    const { plan_id, billing_period } = requestBody

    if (!plan_id || !billing_period) {
      return new Response(
        JSON.stringify({ 
          error: 'plan_id y billing_period son requeridos',
          received: requestBody 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Obtener datos del plan (usar admin client para evitar RLS)
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'Plan no encontrado', details: planError?.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Obtener organización del usuario
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!userProfile?.organization_id) {
      return new Response(
        JSON.stringify({ error: 'Usuario sin organización' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Calcular precio según período
    const amount = billing_period === 'yearly' 
      ? plan.price_yearly 
      : plan.price_monthly

    // Crear referencia única
    const reference = `SUB-${userProfile.organization_id.substring(0, 8)}-${Date.now()}`

    // Preparar datos para Wompi
    const wompiPublicKey = Deno.env.get('WOMPI_PUBLIC_KEY')
    const wompiIntegritySecret = Deno.env.get('WOMPI_INTEGRITY_SECRET')
    const redirectUrl = Deno.env.get('WOMPI_REDIRECT_URL') || 'http://localhost:3000/subscription/callback'

    const amountInCents = Math.round(amount * 100)
    
    // Generar firma de integridad (SHA256)
    const signatureString = `${reference}${amountInCents}COP${wompiIntegritySecret}`
    const encoder = new TextEncoder()
    const data = encoder.encode(signatureString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    console.log('🔐 Generando link de pago Wompi...')
    console.log('📋 Datos:', {
      reference,
      amountInCents,
      publicKey: wompiPublicKey?.substring(0, 20) + '...',
      signature: signature.substring(0, 10) + '...'
    })
    
    // Construir URL simple sin widget - redirige directo a la página de pago de Wompi
    const checkoutUrl = new URL('https://checkout.wompi.co/p/')
    checkoutUrl.searchParams.set('public-key', wompiPublicKey || '')
    checkoutUrl.searchParams.set('currency', 'COP')
    checkoutUrl.searchParams.set('amount-in-cents', amountInCents.toString())
    checkoutUrl.searchParams.set('reference', reference)
    checkoutUrl.searchParams.set('signature:integrity', signature)
    
    // Opcionales pero recomendados
    if (redirectUrl) {
      checkoutUrl.searchParams.set('redirect-url', redirectUrl)
    }
    if (user.email) {
      checkoutUrl.searchParams.set('customer-data:email', user.email)
    }

    console.log('✅ URL generada:', checkoutUrl.toString().substring(0, 100) + '...')

    // Guardar intento de pago en la base de datos
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        organization_id: userProfile.organization_id,
        plan_id: plan_id,
        amount: amount,
        currency: 'COP',
        status: 'pending',
        billing_period: billing_period,
        wompi_transaction_id: null, // Se actualizará con el webhook
        wompi_reference: reference,
      })

    if (paymentError) {
      console.error('Error guardando payment:', paymentError)
    }

    // Retornar URL de checkout
    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: checkoutUrl.toString(),
        reference: reference,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error en create-checkout:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
