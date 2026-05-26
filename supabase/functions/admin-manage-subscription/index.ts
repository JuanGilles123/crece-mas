// Edge Function para que el VIP Admin gestione suscripciones bypasando RLS
// Usa SUPABASE_SERVICE_ROLE_KEY igual que el webhook de Wompi
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Emails VIP autorizados para usar este endpoint (sincronizado con vipUsers.js)
const VIP_EMAILS = [
  'juanjosegilarbelaez@gmail.com',
  'jonathan-9411@hotmail.com',
]

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cliente admin (bypassa RLS por completo)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // --- Verificar que el usuario que llama es VIP ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado - falta Authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado', details: authError?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const userEmail = user.email?.toLowerCase().trim() ?? ''
    if (!VIP_EMAILS.includes(userEmail)) {
      console.warn(`⛔ Intento no autorizado de: ${userEmail}`)
      return new Response(
        JSON.stringify({ error: 'Acceso denegado - solo administradores VIP' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log(`✅ VIP Admin autenticado: ${userEmail}`)

    // --- Leer el body ---
    const body = await req.json()
    const { action, organization_id, plan_id, status, current_period_start, current_period_end, subscription_id } = body

    if (!action || !organization_id) {
      return new Response(
        JSON.stringify({ error: 'action y organization_id son requeridos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // =========================================================
    // ACCIÓN: upsert_subscription — Crear o actualizar suscripción
    // =========================================================
    if (action === 'upsert_subscription') {
      if (!plan_id || !status || !current_period_start || !current_period_end) {
        return new Response(
          JSON.stringify({ error: 'plan_id, status, current_period_start y current_period_end son requeridos' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      console.log(`📋 upsert_subscription para org: ${organization_id}`)

      let resultSub = null

      if (subscription_id) {
        // --- Actualizar suscripción existente ---
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            plan_id,
            status,
            current_period_start,
            current_period_end,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription_id)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Error actualizando suscripción:', updateError)
          return new Response(
            JSON.stringify({ error: 'Error actualizando suscripción', details: updateError }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        resultSub = updated
        console.log('✅ Suscripción actualizada:', resultSub.id)

      } else {
        // --- Buscar si ya existe alguna suscripción para esta org (aunque no sea active) ---
        const { data: anySub } = await supabaseAdmin
          .from('subscriptions')
          .select('id')
          .eq('organization_id', organization_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (anySub) {
          // Actualizar la existente
          const { data: updated, error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update({
              plan_id,
              status,
              current_period_start,
              current_period_end,
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', anySub.id)
            .select()
            .single()

          if (updateError) {
            console.error('❌ Error actualizando suscripción encontrada:', updateError)
            return new Response(
              JSON.stringify({ error: 'Error actualizando suscripción', details: updateError }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
          }

          resultSub = updated
          console.log('✅ Suscripción existente actualizada:', resultSub.id)

        } else {
          // Crear nueva
          const { data: created, error: createError } = await supabaseAdmin
            .from('subscriptions')
            .insert({
              organization_id,
              plan_id,
              status,
              current_period_start,
              current_period_end,
              cancel_at_period_end: false,
            })
            .select()
            .single()

          if (createError) {
            console.error('❌ Error creando suscripción:', createError)
            return new Response(
              JSON.stringify({ error: 'Error creando suscripción', details: createError }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
          }

          resultSub = created
          console.log('✅ Suscripción creada:', resultSub.id)
        }
      }

      // Actualizar también la organización
      const orgStatus = status === 'active' ? 'active' : status
      const { error: orgError } = await supabaseAdmin
        .from('organizations')
        .update({
          subscription_id: resultSub.id,
          subscription_status: orgStatus,
        })
        .eq('id', organization_id)

      if (orgError) {
        console.warn('⚠️ No se pudo actualizar organización:', orgError)
        // No es fatal — la suscripción ya está creada/actualizada
      } else {
        console.log('✅ Organización actualizada con subscription_id')
      }

      return new Response(
        JSON.stringify({ success: true, subscription: resultSub }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // =========================================================
    // ACCIÓN: delete_subscription — Eliminar suscripción (dejar sin plan)
    // =========================================================
    if (action === 'delete_subscription') {
      if (!subscription_id) {
        return new Response(
          JSON.stringify({ error: 'subscription_id es requerido para eliminar' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const { error: deleteError } = await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('id', subscription_id)

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: 'Error eliminando suscripción', details: deleteError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // Limpiar referencia en la organización
      await supabaseAdmin
        .from('organizations')
        .update({ subscription_id: null, subscription_status: null })
        .eq('id', organization_id)

      console.log('✅ Suscripción eliminada')
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ error: `Acción desconocida: ${action}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('❌ Error en admin-manage-subscription:', error)
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
