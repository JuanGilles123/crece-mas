import { renderBaseTemplate } from './base';

type VerifyEmailData = {
  name?: string;
  verifyUrl?: string;
};

export const renderVerifyEmail = (data: VerifyEmailData) => {
  const name = data?.name || 'Hola';
  const verifyUrl = data?.verifyUrl || 'https://creceplus.app';

  return renderBaseTemplate({
    title: 'Confirma tu correo en Crece+',
    bodyHtml: `
      <p>${name},</p>
      <p>Para terminar la configuración de tu cuenta necesitamos verificar tu correo.</p>
      <p>Haz clic en el botón para confirmar tu correo electrónico.</p>
    `,
    ctaLabel: 'Confirmar correo',
    ctaUrl: verifyUrl,
    footerNote: 'Si no creaste una cuenta, ignora este mensaje.'
  });
};
