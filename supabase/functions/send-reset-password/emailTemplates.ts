const renderBaseTemplate = ({
  title,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footerNote,
}: {
  title: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
  footerNote?: string
}) => {
  const buttonHtml = ctaLabel && ctaUrl
    ? `
      <div style="margin: 24px 0;">
        <a href="${ctaUrl}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;display:inline-block;font-weight:600;">
          ${ctaLabel}
        </a>
      </div>
    `
    : ''

  const footer = footerNote
    ? `<p style="color:#6b7280;font-size:12px;margin-top:24px;">${footerNote}</p>`
    : ''

  return `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
    </head>
    <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
        <div style="background:#ffffff;border-radius:16px;padding:28px;border:1px solid #e5e7eb;">
          <div style="text-align:center;margin-bottom:20px;">
            <img src="https://creceplus.app/logo-crece.svg" alt="Crece+" width="72" height="72" style="display:inline-block;" />
          </div>
          <h1 style="font-size:22px;color:#111827;margin:0 0 16px 0;text-align:center;">${title}</h1>
          <div style="color:#374151;font-size:15px;line-height:1.6;">
            ${bodyHtml}
          </div>
          ${buttonHtml}
          ${footer}
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px;">
          Crece+ · creceplus.app
        </p>
      </div>
    </body>
  </html>
  `
}

export const renderSubscriptionActive = (data: {
  name?: string
  planName?: string
  startDate?: string
  endDate?: string
  status?: string
  dashboardUrl?: string
}) => {
  const name = data?.name || 'Hola'
  const planName = data?.planName || 'tu nuevo plan'
  const startDate = data?.startDate || '—'
  const endDate = data?.endDate || '—'
  const status = data?.status || 'activa'
  const dashboardUrl = data?.dashboardUrl || 'https://creceplus.app/dashboard'

  return renderBaseTemplate({
    title: 'Tu suscripción Crece+ está activa',
    bodyHtml: `
      <p>${name},</p>
      <p>Tu plan <strong>${planName}</strong> ya está activo.</p>
      <p><strong>Estado:</strong> ${status}</p>
      <p><strong>Inicio:</strong> ${startDate}</p>
      <p><strong>Vencimiento:</strong> ${endDate}</p>
    `,
    ctaLabel: 'Ir al dashboard',
    ctaUrl: dashboardUrl,
  })
}

export const renderSubscriptionPaymentFailed = (data: { name?: string; supportUrl?: string }) => {
  const name = data?.name || 'Hola'
  const supportUrl = data?.supportUrl || 'https://creceplus.app/soporte'

  return renderBaseTemplate({
    title: 'Problema con tu pago en Crece+',
    bodyHtml: `
      <p>${name},</p>
      <p>Detectamos un problema al procesar tu pago. Tu suscripción no se activó.</p>
      <p>Si no se regulariza, tu acceso podría verse limitado en los próximos días.</p>
    `,
    ctaLabel: 'Contactar soporte',
    ctaUrl: supportUrl,
  })
}

export const renderSubscriptionExpiring = (data: { name?: string; endDate?: string; dashboardUrl?: string }) => {
  const name = data?.name || 'Hola'
  const endDate = data?.endDate || '—'
  const dashboardUrl = data?.dashboardUrl || 'https://creceplus.app/dashboard'

  return renderBaseTemplate({
    title: 'Tu suscripción está por vencer',
    bodyHtml: `
      <p>${name},</p>
      <p>Tu suscripción vence el <strong>${endDate}</strong>.</p>
      <p>Renueva a tiempo para evitar interrupciones en el servicio.</p>
    `,
    ctaLabel: 'Gestionar suscripción',
    ctaUrl: dashboardUrl,
  })
}

export const renderWelcome = (data: { name?: string; dashboardUrl?: string }) => {
  const name = data?.name || 'Hola'
  const dashboardUrl = data?.dashboardUrl || 'https://creceplus.app/dashboard'
  return renderBaseTemplate({
    title: '¡Bienvenido a Crece+!',
    bodyHtml: `
      <p>Hola ${name},</p>
      <p>Gracias por unirte a Crece+. Ya puedes empezar a gestionar tu negocio desde una sola plataforma.</p>
    `,
    ctaLabel: 'Ir al dashboard',
    ctaUrl: dashboardUrl,
  })
}

export const renderResetPassword = (data: { name?: string; resetUrl?: string }) => {
  const name = data?.name || 'Hola'
  const resetUrl = data?.resetUrl || 'https://creceplus.app/restablecer-contraseña'
  return renderBaseTemplate({
    title: 'Restablece tu contraseña',
    bodyHtml: `
      <p>${name},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Si fuiste tú, continúa con el botón.</p>
    `,
    ctaLabel: 'Restablecer contraseña',
    ctaUrl: resetUrl,
  })
}

export const renderVerifyEmail = (data: { name?: string; verifyUrl?: string }) => {
  const name = data?.name || 'Hola'
  const verifyUrl = data?.verifyUrl || 'https://creceplus.app'
  return renderBaseTemplate({
    title: 'Confirma tu correo en Crece+',
    bodyHtml: `
      <p>${name},</p>
      <p>Para terminar la configuración de tu cuenta necesitamos verificar tu correo.</p>
    `,
    ctaLabel: 'Confirmar correo',
    ctaUrl: verifyUrl,
  })
}

export const renderInvoiceGenerated = (data: { name?: string; invoiceNumber?: string; invoiceUrl?: string }) => {
  const name = data?.name || 'Hola'
  const invoiceNumber = data?.invoiceNumber || '—'
  const invoiceUrl = data?.invoiceUrl || 'https://creceplus.app/dashboard'
  return renderBaseTemplate({
    title: 'Factura disponible – Crece+',
    bodyHtml: `
      <p>${name},</p>
      <p>Tu factura <strong>${invoiceNumber}</strong> ya está disponible.</p>
    `,
    ctaLabel: 'Ver factura',
    ctaUrl: invoiceUrl,
  })
}

export const renderSystemNotification = (data: {
  title?: string
  message?: string
  ctaLabel?: string
  ctaUrl?: string
}) => {
  const title = data?.title || 'Notificación del sistema'
  const message = data?.message || 'Tienes una nueva notificación de Crece+.'
  return renderBaseTemplate({
    title,
    bodyHtml: `<p>${message}</p>`,
    ctaLabel: data?.ctaLabel,
    ctaUrl: data?.ctaUrl,
  })
}
