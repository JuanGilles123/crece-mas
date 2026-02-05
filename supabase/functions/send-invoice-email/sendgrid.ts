import sgMail from 'https://esm.sh/@sendgrid/mail@8.1.4'

export const SENDERS = {
  SYSTEM: { email: 'no-reply@creceplus.app', name: 'Crece+ Sistema' },
  SUPPORT: { email: 'soporte@creceplus.app', name: 'Soporte Crece+' },
  BILLING: { email: 'facturacion@creceplus.app', name: 'Facturación Crece+' },
  NOTIFICATIONS: { email: 'notificaciones@creceplus.app', name: 'Notificaciones Crece+' },
}

const apiKey = Deno.env.get('SENDGRID_API_KEY')
export const isSendgridConfigured = Boolean(apiKey)

if (apiKey) {
  sgMail.setApiKey(apiKey)
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
  if (!isSendgridConfigured) {
    console.warn('[email] SENDGRID_API_KEY no configurada. Envío omitido.', { to, subject })
    return { success: false, skipped: true }
  }

  try {
    const timeoutMs = Number(Deno.env.get('SENDGRID_TIMEOUT_MS') || 8000)
    await Promise.race([
      sgMail.send({ to, subject, html, from }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`SendGrid timeout ${timeoutMs}ms`)), timeoutMs)
      ),
    ])
    return { success: true }
  } catch (error) {
    console.error('[email] Error SendGrid:', error)
    return { success: false, error }
  }
}
