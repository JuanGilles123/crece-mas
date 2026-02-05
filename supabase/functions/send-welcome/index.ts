import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { sendEmail, SENDERS } from './sendgrid.ts'
import { renderWelcome } from './emailTemplates.ts'

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
    const { email, name, userId } = body || {}

    if (!email && !userId) {
      return new Response(JSON.stringify({ error: 'Email o userId requerido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let to = String(email || '')
    let resolvedName = name

    if (userId) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (data?.user?.email) {
        to = data.user.email
      }
      resolvedName = resolvedName || data?.user?.user_metadata?.full_name
    }

    const html = renderWelcome({
      name: resolvedName || 'Hola',
      dashboardUrl: 'https://creceplus.app/dashboard',
    })

    const result = await sendEmail({
      to,
      subject: '¡Bienvenido a Crece+!',
      html,
      from: SENDERS.SYSTEM,
    })

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error send-welcome:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Error interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
