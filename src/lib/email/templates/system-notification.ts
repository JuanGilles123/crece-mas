import { renderBaseTemplate } from './base';

type SystemNotificationData = {
  title?: string;
  message?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export const renderSystemNotification = (data: SystemNotificationData) => {
  const title = data?.title || 'Notificación del sistema';
  const message = data?.message || 'Tienes una nueva notificación de Crece+.';

  return renderBaseTemplate({
    title,
    bodyHtml: `<p>${message}</p>`,
    ctaLabel: data?.ctaLabel,
    ctaUrl: data?.ctaUrl
  });
};
