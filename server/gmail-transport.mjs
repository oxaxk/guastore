export async function createGmailTransport(env = process.env) {
  // Generic SMTP is used in production (for example STRATO). The Gmail names
  // remain supported so an existing preview configuration keeps working.
  const user = env.GUA_SMTP_USER || env.GUA_GMAIL_USER;
  const password = env.GUA_SMTP_PASSWORD || env.GUA_GMAIL_APP_PASSWORD;
  const from = env.GUA_MAIL_FROM || user;
  const host = env.GUA_SMTP_HOST || (env.GUA_GMAIL_USER ? 'smtp.gmail.com' : null);
  const port = Number(env.GUA_SMTP_PORT || 465);
  const secure = env.GUA_SMTP_SECURE == null ? port === 465 : env.GUA_SMTP_SECURE === 'true';
  if (typeof user !== 'string' || !user.includes('@') || typeof password !== 'string' || password.length < 12 ||
      typeof from !== 'string' || !from.includes('@') || typeof host !== 'string' || !/^[a-z0-9.-]+$/i.test(host) ||
      !Number.isInteger(port) || port < 1 || port > 65535) {
    return { configured: false };
  }
  const { default: nodemailer } = await import('nodemailer');
  const smtp = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: password },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
  return {
    configured: true,
    async send({ to, subject, text, html }) {
      try {
        const result = await smtp.sendMail({ from: `GUA SHOP <${from}>`, replyTo: from, to, subject, text, html });
        if (Array.isArray(result.accepted) && result.accepted.includes(to)) return { status: 'sent' };
        if (Array.isArray(result.rejected) && result.rejected.includes(to)) return { status: 'not_sent', confirmedNotAccepted: true };
        return { status: 'unknown' };
      } catch (error) {
        if (Number.isInteger(error?.responseCode) && error.responseCode >= 500) return { status: 'not_sent', confirmedNotAccepted: true };
        return { status: 'unknown' };
      }
    },
  };
}
