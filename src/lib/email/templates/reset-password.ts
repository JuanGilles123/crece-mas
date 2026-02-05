import { renderBaseTemplate } from './base';

type ResetPasswordData = {
  name?: string;
  resetUrl?: string;
};

export const renderResetPassword = (data: ResetPasswordData) => {
  const name = data?.name || 'Hola';
  const resetUrl = data?.resetUrl || 'https://creceplus.app/reset-password';

  return renderBaseTemplate({
    title: 'Restablece tu contraseña',
    bodyHtml: `
      <p>${name},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Si fuiste tú, continúa con el botón.</p>
      <p>Si no hiciste esta solicitud, puedes ignorar este correo.</p>
    `,
    ctaLabel: 'Restablecer contraseña',
    ctaUrl: resetUrl,
    footerNote: 'El enlace es válido por tiempo limitado.'
  });
};
