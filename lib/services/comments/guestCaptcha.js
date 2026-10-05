/**
 * CAPTCHA for guest comments, using Cloudflare Turnstile (free, no puzzle for
 * most visitors). Rate limits and the content filter can't stop a botnet that
 * rotates IPs and devices; a challenge that has to be solved per post can.
 *
 * Configuration is environment-only, so it can be switched on without a code
 * change or rebuild:
 *   TURNSTILE_SITE_KEY      public key, handed to the browser via the comments API
 *   TURNSTILE_SECRET_KEY    server key, used to verify the token
 *   GUEST_CAPTCHA_REQUIRED  'true' => if the keys are missing, refuse guest posts
 *                           instead of allowing them unprotected (fail closed)
 *
 * With no keys and GUEST_CAPTCHA_REQUIRED unset, guest posting still works but
 * is unprotected by CAPTCHA — the admin moderation settings show that state
 * loudly so it isn't missed. Logged-in comments never need a CAPTCHA.
 *
 * To use another provider (hCaptcha, reCAPTCHA), only verifyCaptcha() and the
 * widget in components/comments/CaptchaWidget.jsx need to change.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function getCaptchaConfig(env = process.env) {
  const siteKey = env.TURNSTILE_SITE_KEY?.trim() || '';
  const secret = env.TURNSTILE_SECRET_KEY?.trim() || '';

  return {
    provider: 'turnstile',
    configured: Boolean(siteKey && secret),
    siteKey,
    secret,
    required: env.GUEST_CAPTCHA_REQUIRED === 'true',
  };
}

/** What the browser needs to render the widget, or null when not configured. */
export function getPublicCaptchaConfig(env = process.env) {
  const config = getCaptchaConfig(env);

  return config.configured
    ? { provider: config.provider, siteKey: config.siteKey }
    : null;
}

/**
 * Verifies a Turnstile token server-side.
 *
 * Returns `{ ok: true }` or `{ ok: false, reason }` where reason is:
 *   'missing'     — no token was sent
 *   'failed'      — Cloudflare rejected the token (bot, expired, or already used)
 *   'unavailable' — couldn't reach Cloudflare in time; the caller should fail
 *                   closed (the post is refused) rather than let it through
 *
 * `fetchImpl` and `secret` are injectable so the failure paths can be tested
 * without the network.
 */
export async function verifyCaptcha(
  token,
  ip,
  { secret = getCaptchaConfig().secret, fetchImpl = fetch, timeoutMs = 4000 } = {}
) {
  if (typeof token !== 'string' || !token.trim()) {
    return { ok: false, reason: 'missing' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body = new URLSearchParams({ secret, response: token });

    // The client IP lets Cloudflare tighten its decision; "unknown" isn't one.
    if (ip && ip !== 'unknown') {
      body.set('remoteip', ip);
    }

    const response = await fetchImpl(VERIFY_URL, {
      method: 'POST',
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, reason: 'unavailable' };
    }

    const result = await response.json();

    return result?.success === true
      ? { ok: true }
      : { ok: false, reason: 'failed' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}
