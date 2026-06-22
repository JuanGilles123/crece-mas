import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEPARTMENT_EMAILS: Record<string, { to: string; label: string }> = {
  ventas: { to: 'ventas@crecemas.co', label: 'Ventas' },
  soporte: { to: 'soporte@crecemas.co', label: 'Soporte Técnico' },
  legal: { to: 'legal@crecemas.co', label: 'Legal' },
  general: { to: 'hola@crecemas.co', label: 'Contacto General' },
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
    const { name, email, department, message } = body || {}

    if (!name || !email || !department || !message) {
      return new Response(JSON.stringify({ error: 'Todos los campos son requeridos' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const dept = DEPARTMENT_EMAILS[department] || DEPARTMENT_EMAILS.general
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')

    const subject = `📬 Nuevo mensaje — ${dept.label}`
    const htmlContent = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #004481, #02A5E0); padding: 24px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 1.5rem;">Crece+</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0;">Nuevo mensaje de contacto — ${dept.label}</p>
        </div>
        <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 8px; font-weight: 700; color: #6b7280; width: 120px; font-size: 0.9rem;">NOMBRE</td>
              <td style="padding: 10px 8px; color: #111827; font-size: 0.95rem;">${name}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px 8px; font-weight: 700; color: #6b7280; font-size: 0.9rem;">EMAIL</td>
              <td style="padding: 10px 8px;"><a href="mailto:${email}" style="color: #004481;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 8px; font-weight: 700; color: #6b7280; font-size: 0.9rem;">ÁREA</td>
              <td style="padding: 10px 8px; color: #111827;">${dept.label}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 16px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #004481;">
            <strong style="color: #004481; font-size: 0.9rem;">MENSAJE:</strong>
            <p style="color: #1f2937; margin: 10px 0 0; line-height: 1.6;">${message.replace(/\n/g, '<br/>')}</p>
          </div>
        </div>
        <p style="color: #9ca3af; font-size: 0.75rem; text-align: center; margin-top: 16px;">
          Enviado desde el formulario de contacto de <a href="https://www.crecemas.co" style="color: #004481;">crecemas.co</a>
        </p>
      </div>
    `

    // Intentar con Resend si está configurado
    if (RESEND_API_KEY) {
      console.log('Intentando envío por Resend...')
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Crece+ Contacto <noreply@crecemas.co>',
          to: [dept.to],
          reply_to: email,
          subject,
          html: htmlContent,
        }),
      })

      if (res.ok) {
        return new Response(JSON.stringify({ success: true, provider: 'resend' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } else {
        const errorText = await res.text()
        throw new Error(`Resend falló: ${errorText}`)
      }
    }

    // Si no hay Resend, intentar con SendGrid si está configurado
    if (SENDGRID_API_KEY) {
      console.log('Intentando envío por SendGrid...')
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: dept.to }],
          }],
          from: { email: 'no-reply@crecemas.co', name: 'Crece+ Contacto' },
          reply_to: { email: email },
          subject,
          content: [{
            type: 'text/html',
            value: htmlContent,
          }],
        }),
      })

      if (res.ok) {
        return new Response(JSON.stringify({ success: true, provider: 'sendgrid' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } else {
        const errorText = await res.text()
        throw new Error(`SendGrid falló: ${errorText}`)
      }
    }

    throw new Error('Ni RESEND_API_KEY ni SENDGRID_API_KEY están configuradas en Supabase.')

  } catch (error: any) {
    console.error('Error send-contact:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Error interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
