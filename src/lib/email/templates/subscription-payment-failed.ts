import { renderBaseTemplate } from './base';

type PaymentFailedData = {
  name?: string;
  supportUrl?: string;
};

export const renderSubscriptionPaymentFailed = (data: PaymentFailedData) => {
  const name = data?.name || 'Hola';
  const supportUrl = data?.supportUrl || 'https://creceplus.app/soporte';

  return renderBaseTemplate({
    title: 'Problema con tu pago en Crece+',
    bodyHtml: `
      <p>${name},</p>
      <p>Detectamos un problema al procesar tu pago. Tu suscripción no se activó.</p>
      <p>Puedes intentar nuevamente o contactar a nuestro equipo de soporte.</p>
    `,
    ctaLabel: 'Contactar soporte',
    ctaUrl: supportUrl,
    footerNote: 'Si ya resolviste el pago, ignora este mensaje.'
  });
};
