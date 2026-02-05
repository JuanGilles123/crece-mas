import { renderBaseTemplate } from './base';

type WelcomeData = {
  name?: string;
  dashboardUrl?: string;
};

export const renderWelcomeEmail = (data: WelcomeData) => {
  const name = data?.name || 'Hola';
  const dashboardUrl = data?.dashboardUrl || 'https://creceplus.app/dashboard';

  return renderBaseTemplate({
    title: '¡Bienvenido a Crece+!',
    bodyHtml: `
      <p>Hola ${name},</p>
      <p>Gracias por unirte a Crece+. Ya puedes empezar a gestionar tu negocio desde una sola plataforma.</p>
      <p>Si necesitas ayuda, nuestro equipo de soporte está listo para acompañarte.</p>
    `,
    ctaLabel: 'Ir al dashboard',
    ctaUrl: dashboardUrl,
    footerNote: 'Si no solicitaste esta cuenta, puedes ignorar este correo.'
  });
};
