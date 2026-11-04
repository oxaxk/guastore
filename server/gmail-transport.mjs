export async function createGmailTransport(env = process.env) {
  const user = env.GUA_GMAIL_USER;
  const password = env.GUA_GMAIL_APP_PASSWORD;
  const from = env.GUA_MAIL_FROM || user;
  if (typeof user !== 'string' || !user.includes('@') || typeof password !== 'string' || password.length < 12 || typeof from !== 'string' || !from.includes('@')) {
    return { configured: false };
  }
  const { default: nodemailer } = await import('nodemailer');
  const smtp = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
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
