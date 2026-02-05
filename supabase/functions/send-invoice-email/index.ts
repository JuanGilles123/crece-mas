import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { sendEmail, SENDERS } from './sendgrid.ts'
import { renderInvoiceGenerated } from './emailTemplates.ts'

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
    const name = body?.name || 'Hola'
    const invoiceNumber = body?.invoiceNumber || '—'
    const invoiceUrl = body?.invoiceUrl || 'https://creceplus.app/dashboard'

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email requerido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const html = renderInvoiceGenerated({
      name,
      invoiceNumber,
      invoiceUrl,
    })

    await sendEmail({
      to: email,
      subject: 'Factura disponible – Crece+',
      html,
      from: SENDERS.BILLING,
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error send-invoice-email:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Error interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
