import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;

if (apiKey) {
  sgMail.setApiKey(apiKey);
}

export const isSendgridConfigured = Boolean(apiKey);

export const sendgridClient = sgMail;
