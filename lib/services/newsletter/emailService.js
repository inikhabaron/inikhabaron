import { Resend } from 'resend';

// Lazily initialized so a missing RESEND_API_KEY doesn't crash the app at
// import/boot time — email sending is optional, deferred functionality, not
// a hard startup requirement (unlike lib/session/jwt.js's JWT_SECRET, which
// every request needs).
let resendClient;

function getResendClient() {
  if (resendClient !== undefined) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  resendClient = apiKey ? new Resend(apiKey) : null;
  return resendClient;
}

function getFromAddress() {
  if (process.env.NEWSLETTER_FROM) return process.env.NEWSLETTER_FROM;
  if (process.env.SENDER_NAME && process.env.SENDER_EMAIL) {
    return `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`;
  }
  return 'INIKhabaron <newsletter@inikhabaron.com>';
}

/**
 * Send a single HTML email via Resend. Never throws — a batch sender needs
 * one bad recipient to not take down the rest of the run, so failures are
 * logged and returned as { success: false, error } instead.
 */
export async function sendEmail({ to, subject, html, text }) {
  const client = getResendClient();
  if (!client) {
    console.error('[emailService] RESEND_API_KEY is not configured — skipping send.');
    return { success: false, error: 'RESEND_API_KEY is not configured' };
  }
  if (!to || !subject || !html) {
    return { success: false, error: 'Missing required email fields (to, subject, html)' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
      text: text || undefined,
    });

    if (error) {
      console.error(`[emailService] Resend rejected send to ${to}:`, error.message || error);
      return { success: false, error: error.message || 'Resend send failed' };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error(`[emailService] Unexpected error sending to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}
