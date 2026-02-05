import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { sendEmail, SENDERS } from './sendgrid.ts'
import { renderSystemNotification } from './emailTemplates.ts'

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
    const subject = String(body?.subject || 'Notificación Crece+')
    const title = body?.title || 'Notificación del sistema'
    const message = body?.message || 'Tienes una nueva notificación de Crece+.'
    const ctaLabel = body?.ctaLabel
    const ctaUrl = body?.ctaUrl

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email requerido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const html = renderSystemNotification({ title, message, ctaLabel, ctaUrl })

    const result = await sendEmail({
      to: email,
      subject,
      html,
      from: SENDERS.NOTIFICATIONS,
    })

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error send-system-notification:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Error interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
