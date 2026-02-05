import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { sendEmail, SENDERS } from './sendgrid.ts'
import { renderResetPassword } from './emailTemplates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  try {
    const body = await req.json()
    const email = String(body?.email || '').trim()
    const redirectTo = String(body?.redirectTo || '').trim()
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://creceplus.app'
    const safeRedirect = redirectTo || `${appBaseUrl}/restablecer-contraseña`

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email requerido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: safeRedirect },
    })

    if (error || !data?.properties?.action_link) {
      console.error('Error generando link reset:', error)
      return new Response(JSON.stringify({ error: 'No se pudo generar el enlace' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const html = renderResetPassword({
      name: data?.user?.user_metadata?.full_name || 'Hola',
      resetUrl: data.properties.action_link,
    })

    await sendEmail({
      to: email,
      subject: 'Restablece tu contraseña',
      html,
      from: SENDERS.SYSTEM,
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error send-reset-password:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Error interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
