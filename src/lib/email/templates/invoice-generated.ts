import { renderBaseTemplate } from './base';

type InvoiceGeneratedData = {
  name?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
};

export const renderInvoiceGenerated = (data: InvoiceGeneratedData) => {
  const name = data?.name || 'Hola';
  const invoiceNumber = data?.invoiceNumber || '—';
  const invoiceUrl = data?.invoiceUrl || 'https://creceplus.app/dashboard';

  return renderBaseTemplate({
    title: 'Factura disponible – Crece+',
    bodyHtml: `
      <p>${name},</p>
      <p>Tu factura <strong>${invoiceNumber}</strong> ya está disponible.</p>
      <p>Puedes descargarla desde el panel o usando el botón de abajo.</p>
    `,
    ctaLabel: 'Ver factura',
    ctaUrl: invoiceUrl,
    footerNote: 'Si necesitas asistencia con tu facturación, escríbenos.'
  });
};
