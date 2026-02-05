import { sendgridClient, isSendgridConfigured } from './sendgrid';
import { SENDERS } from './senders';
import { renderWelcomeEmail } from './templates/welcome';
import { renderVerifyEmail } from './templates/verify-email';
import { renderResetPassword } from './templates/reset-password';
import { renderSubscriptionActive } from './templates/subscription-active';
import { renderSubscriptionPaymentFailed } from './templates/subscription-payment-failed';
import { renderInvoiceGenerated } from './templates/invoice-generated';
import { renderSystemNotification } from './templates/system-notification';

export enum EmailType {
  WELCOME = 'WELCOME',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  RESET_PASSWORD = 'RESET_PASSWORD',
  SUBSCRIPTION_ACTIVE = 'SUBSCRIPTION_ACTIVE',
  SUBSCRIPTION_PAYMENT_FAILED = 'SUBSCRIPTION_PAYMENT_FAILED',
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION'
}

type SendEmailParams = {
  to: string;
  type: EmailType;
  data?: Record<string, any>;
};

const subjectByType: Record<EmailType, string> = {
  [EmailType.WELCOME]: '¡Bienvenido a Crece+!',
  [EmailType.VERIFY_EMAIL]: 'Confirma tu correo en Crece+',
  [EmailType.RESET_PASSWORD]: 'Restablece tu contraseña',
  [EmailType.SUBSCRIPTION_ACTIVE]: 'Tu suscripción Crece+ está activa',
  [EmailType.SUBSCRIPTION_PAYMENT_FAILED]: 'Problema con tu pago en Crece+',
  [EmailType.INVOICE_GENERATED]: 'Factura disponible – Crece+',
  [EmailType.SYSTEM_NOTIFICATION]: 'Notificación Crece+'
};

const senderByType: Record<EmailType, { email: string; name: string }> = {
  [EmailType.WELCOME]: SENDERS.SYSTEM,
  [EmailType.VERIFY_EMAIL]: SENDERS.SYSTEM,
  [EmailType.RESET_PASSWORD]: SENDERS.SYSTEM,
  [EmailType.SUBSCRIPTION_ACTIVE]: SENDERS.BILLING,
  [EmailType.SUBSCRIPTION_PAYMENT_FAILED]: SENDERS.BILLING,
  [EmailType.INVOICE_GENERATED]: SENDERS.BILLING,
  [EmailType.SYSTEM_NOTIFICATION]: SENDERS.NOTIFICATIONS
};

const templateByType: Record<EmailType, (data?: Record<string, any>) => string> = {
  [EmailType.WELCOME]: renderWelcomeEmail,
  [EmailType.VERIFY_EMAIL]: renderVerifyEmail,
  [EmailType.RESET_PASSWORD]: renderResetPassword,
  [EmailType.SUBSCRIPTION_ACTIVE]: renderSubscriptionActive,
  [EmailType.SUBSCRIPTION_PAYMENT_FAILED]: renderSubscriptionPaymentFailed,
  [EmailType.INVOICE_GENERATED]: renderInvoiceGenerated,
  [EmailType.SYSTEM_NOTIFICATION]: renderSystemNotification
};

export const sendEmail = async ({ to, type, data }: SendEmailParams) => {
  if (!isSendgridConfigured) {
    console.warn('[email] SENDGRID_API_KEY no configurada. Envío omitido.', { to, type });
    return { success: false, skipped: true };
  }

  const sender = senderByType[type];
  const subject = type === EmailType.SYSTEM_NOTIFICATION && data?.subject
    ? String(data.subject)
    : subjectByType[type];
  const html = templateByType[type](data);

  try {
    await sendgridClient.send({
      to,
      from: sender,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    console.error('[email] Error enviando correo', { to, type, error });
    return { success: false, error };
  }
};
