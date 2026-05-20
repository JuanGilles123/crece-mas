import sgMail from 'https://esm.sh/@sendgrid/mail@8.1.4'

export const SENDERS = {
  SYSTEM: { email: 'no-reply@crecemas.co', name: 'Crece Más Sistema' },
  SUPPORT: { email: 'soporte@crecemas.co', name: 'Soporte Crece Más' },
  BILLING: { email: 'facturacion@crecemas.co', name: 'Facturación Crece Más' },
  NOTIFICATIONS: { email: 'notificaciones@crecemas.co', name: 'Notificaciones Crece Más' },
}

const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
const resendApiKey = Deno.env.get('RESEND_API_KEY')

// Exportado para compatibilidad con la función principal que usa esta variable para validar
export const isSendgridConfigured = Boolean(sendgridApiKey || resendApiKey)

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey)
}

export const sendEmail = async ({
  to,
  subject,
  html,
  from,
}: {
  to: string
  subject: string
  html: string
  from: { email: string; name: string }
}) => {
  // Intentar con Resend primero
  if (resendApiKey) {
    console.log('[email] Intentando enviar correo por Resend a:', to)
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${from.name} <${from.email}>`,
          to: [to],
          subject,
          html,
        }),
      })

      if (res.ok) {
        console.log('[email] Correo enviado exitosamente vía Resend')
        return { success: true, provider: 'resend' }
      } else {
        const errorText = await res.text()
        console.error('[email] Error Resend:', errorText)
      }
    } catch (error) {
      console.error('[email] Excepción en Resend:', error)
    }
  }

  // Fallback o principal con SendGrid
  if (sendgridApiKey) {
    console.log('[email] Intentando enviar correo por SendGrid a:', to)
    try {
      const timeoutMs = Number(Deno.env.get('SENDGRID_TIMEOUT_MS') || 8000)
      await Promise.race([
        sgMail.send({ to, subject, html, from }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`SendGrid timeout ${timeoutMs}ms`)), timeoutMs)
        ),
      ])
      console.log('[email] Correo enviado exitosamente vía SendGrid')
      return { success: true, provider: 'sendgrid' }
    } catch (error) {
      console.error('[email] Error SendGrid:', error)
      return { success: false, error }
    }
  }

  console.warn('[email] Ni RESEND_API_KEY ni SENDGRID_API_KEY están configuradas. Envío omitido.', { to, subject })
  return { success: false, skipped: true }
}
