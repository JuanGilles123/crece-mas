import { renderBaseTemplate } from './base';

type SubscriptionActiveData = {
  name?: string;
  planName?: string;
  dashboardUrl?: string;
};

export const renderSubscriptionActive = (data: SubscriptionActiveData) => {
  const name = data?.name || 'Hola';
  const planName = data?.planName || 'tu nuevo plan';
  const dashboardUrl = data?.dashboardUrl || 'https://creceplus.app/dashboard';

  return renderBaseTemplate({
    title: 'Tu suscripción Crece+ está activa',
    bodyHtml: `
      <p>${name},</p>
      <p>Confirmamos que tu pago fue exitoso y tu suscripción al plan <strong>${planName}</strong> ya está activa.</p>
      <p>Gracias por confiar en Crece+ para hacer crecer tu negocio.</p>
    `,
    ctaLabel: 'Ir al dashboard',
    ctaUrl: dashboardUrl,
    footerNote: 'Si necesitas una factura o soporte, contáctanos.'
  });
};
