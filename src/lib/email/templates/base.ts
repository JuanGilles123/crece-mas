type BaseTemplateParams = {
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

export const renderBaseTemplate = ({
  title,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footerNote
}: BaseTemplateParams) => {
  const buttonHtml = ctaLabel && ctaUrl
    ? `
      <div style="margin: 24px 0;">
        <a href="${ctaUrl}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;display:inline-block;font-weight:600;">
          ${ctaLabel}
        </a>
      </div>
    `
    : '';

  const footer = footerNote
    ? `<p style="color:#6b7280;font-size:12px;margin-top:24px;">${footerNote}</p>`
    : '';

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
  `;
};
