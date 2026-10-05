import crypto from 'crypto';

import { getCommentsCollection } from '@/lib/db/comments';
import { verifyFormToken } from './guestFormToken';
import { checkGuestText, checkGuestName } from './guestContentFilter';
import { getCaptchaConfig, verifyCaptcha } from './guestCaptcha';

/**
 * Server-side validation, content filtering and abuse limiting for guest
 * (no-login) comments. Guest comments are published immediately, so this is
 * the gate: a submission that fails any check is rejected and never stored.
 *
 * Nothing here is trusted from the browser. The honeypot is a cheap bot
 * filter; the completion time is measured from a server-signed token; and the
 * rate limits are counted from the `comments` collection itself, so they hold
 * across serverless instances without any new infrastructure. Senders are only
 * ever identified by salted HMACs (IP, device id, coarse browser fingerprint).
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const GUEST_LIMITS = {
  contentMin: 2,
  contentMax: 1000,
  nameMax: 40,
  // A human can't read, think and type a comment in under this.
  minFillMs: 3000,
  // Per sender signal: [short burst, daily ceiling]. IP caps are generous
  // because Indian mobile carriers put many users behind one address; the
  // device cap is tighter but a user can clear it; the fingerprint is shared
  // by every similar phone, so it is only a loose ceiling.
  perSender: {
    ip: [
      { windowMs: 10 * MINUTE, max: 6 },
      { windowMs: 24 * HOUR, max: 30 },
    ],
    device: [
      { windowMs: 10 * MINUTE, max: 3 },
      { windowMs: 24 * HOUR, max: 12 },
    ],
    fingerprint: [
      { windowMs: 10 * MINUTE, max: 8 },
      { windowMs: 24 * HOUR, max: 40 },
    ],
  },
  // Circuit breaker across all guests, so a botnet rotating IPs and devices
  // still hits a wall instead of flooding the public comment threads.
  siteWide: { windowMs: 10 * MINUTE, max: 100 },
  duplicates: {
    windowMs: 24 * HOUR,
    // Below this many characters ("Jai Hind", "Nice") identical comments from
    // different people are normal, so only the same sender is blocked.
    longContentMin: 30,
    // The same long comment pasted across this many places is spam.
    siteWideMax: 3,
  },
};

// Control chars (keeping \t \n), zero-width space, word joiner/BOM, and bidi
// overrides/isolates (used to disguise text direction). ZWJ/ZWNJ (U+200C/D)
// are deliberately kept: Devanagari conjuncts and emoji sequences need them.
const INVISIBLE_CHARS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​⁠﻿‪-‮⁦-⁩]/g;

function cleanText(value) {
  return value
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(INVISIBLE_CHARS, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function secret() {
  // JWT_SECRET is always present (lib/session/jwt.js refuses to load without it).
  return process.env.JWT_SECRET || '';
}

/** Salted HMAC of a sender signal. Domain-separated per signal type. */
export function hashSignal(kind, value) {
  return crypto
    .createHmac('sha256', `guest-comment:${kind}:${secret()}`)
    .update(String(value || 'unknown'))
    .digest('hex')
    .slice(0, 32);
}

// Same comment, whatever the casing, spacing or punctuation.
function contentKeyOf(text) {
  const normalized = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  return { key: hashSignal('content', normalized), length: normalized.length };
}

function reject(status, message, extra = {}) {
  return { ok: false, status, message, ...extra };
}

async function countGuestComments(filter, limit) {
  const comments = await getCommentsCollection();
  return comments.countDocuments({ source: 'guest', ...filter }, { limit });
}

const DEVICE_ID = /^[A-Za-z0-9-]{16,64}$/;

/**
 * Validates, filters and rate-limits one guest submission.
 *
 * Returns `{ ok: true, content, guest }` ready for addComment/addReply, or
 * `{ ok: false, status, message }`. `silent: true` means "pretend it worked"
 * (honeypot tripped) so the bot learns nothing.
 *
 * `thread` is where the comment would land — `{ articleId, parentCommentId }`
 * (parentCommentId is null for a top-level comment) — and scopes duplicates.
 */
export async function evaluateGuestSubmission({
  ip,
  fingerprint,
  deviceId,
  content,
  name,
  honeypot,
  token,
  captchaToken,
  thread,
  now = Date.now(),
}) {
  if (honeypot) {
    return reject(200, 'Your comment has been posted.', { silent: true });
  }

  if (typeof content !== 'string' || (name != null && typeof name !== 'string')) {
    return reject(400, 'Invalid submission');
  }

  const formToken = verifyFormToken(token, now);

  if (!formToken.ok) {
    return formToken.reason === 'expired'
      ? reject(400, 'This page has been open for a long time. Please refresh it and try again.')
      : reject(400, 'Invalid submission');
  }

  if (formToken.ageMs < GUEST_LIMITS.minFillMs) {
    return reject(429, 'Please take a moment before posting your comment.');
  }

  const text = cleanText(content);

  if (text.length < GUEST_LIMITS.contentMin) {
    return reject(400, 'Comment content is required');
  }

  if (text.length > GUEST_LIMITS.contentMax) {
    return reject(400, `Comment cannot exceed ${GUEST_LIMITS.contentMax} characters`);
  }

  const textCheck = checkGuestText(text);
  if (!textCheck.ok) {
    return reject(400, textCheck.message, { code: textCheck.code });
  }

  const cleanedName = cleanText(name || '')
    .replace(/\s*\n\s*/g, ' ')
    .slice(0, GUEST_LIMITS.nameMax)
    .trim();

  if (cleanedName) {
    const nameCheck = checkGuestName(cleanedName);
    if (!nameCheck.ok) {
      return reject(400, nameCheck.message, { code: nameCheck.code });
    }
  }

  // CAPTCHA comes after the cheap local checks (so a fixable mistake like a
  // blocked word doesn't burn a challenge) and before any database work. When
  // it isn't configured guests are let through unprotected, unless
  // GUEST_CAPTCHA_REQUIRED=true says to fail closed.
  const captcha = getCaptchaConfig();

  if (captcha.configured) {
    const verdict = await verifyCaptcha(captchaToken, ip, { secret: captcha.secret });

    if (!verdict.ok) {
      if (verdict.reason === 'unavailable') {
        return reject(503, 'Verification is temporarily unavailable. Please try again shortly.', { code: 'captcha_unavailable' });
      }

      return reject(
        400,
        verdict.reason === 'missing'
          ? 'Please complete the verification challenge.'
          : 'Verification failed. Please try again.',
        { code: `captcha_${verdict.reason}` }
      );
    }
  } else if (captcha.required) {
    return reject(503, 'Guest commenting is temporarily unavailable.', { code: 'captcha_not_configured' });
  }

  const signals = {
    ip: hashSignal('ip', ip),
    device: DEVICE_ID.test(deviceId || '') ? hashSignal('device', deviceId) : null,
    fingerprint: hashSignal('fingerprint', fingerprint),
  };

  const fields = { ip: 'guest.ipHash', device: 'guest.deviceHash', fingerprint: 'guest.fingerprintHash' };

  for (const [kind, windows] of Object.entries(GUEST_LIMITS.perSender)) {
    if (!signals[kind]) continue;

    for (const { windowMs, max } of windows) {
      const recent = await countGuestComments(
        {
          [fields[kind]]: signals[kind],
          createdAt: { $gte: new Date(now - windowMs) },
        },
        max
      );

      if (recent >= max) {
        return reject(429, "You're commenting too quickly. Please try again later.");
      }
    }
  }

  const { windowMs, max } = GUEST_LIMITS.siteWide;
  const siteRecent = await countGuestComments(
    { createdAt: { $gte: new Date(now - windowMs) } },
    max
  );

  if (siteRecent >= max) {
    return reject(429, 'Comments are very busy right now. Please try again shortly.');
  }

  const { key: contentKey, length: contentLength } = contentKeyOf(text);

  const comments = await getCommentsCollection();
  const sameContent = await comments
    .find({
      source: 'guest',
      'guest.contentKey': contentKey,
      createdAt: { $gte: new Date(now - GUEST_LIMITS.duplicates.windowMs) },
    })
    .project({ articleId: 1, parentCommentId: 1, 'guest.ipHash': 1, 'guest.deviceHash': 1 })
    .limit(GUEST_LIMITS.duplicates.siteWideMax)
    .toArray();

  const sameSender = sameContent.some(
    (c) =>
      c.guest?.ipHash === signals.ip ||
      (signals.device && c.guest?.deviceHash === signals.device)
  );

  const isLong = contentLength >= GUEST_LIMITS.duplicates.longContentMin;

  // A reply is scoped to its parent comment; a top-level comment to its article.
  const sameThread = sameContent.some((c) =>
    thread.parentCommentId
      ? String(c.parentCommentId ?? null) === String(thread.parentCommentId)
      : c.parentCommentId == null && String(c.articleId) === String(thread.articleId)
  );

  if (
    sameSender ||
    (isLong && (sameThread || sameContent.length >= GUEST_LIMITS.duplicates.siteWideMax))
  ) {
    return reject(409, 'This comment has already been submitted.');
  }

  return {
    ok: true,
    content: text,
    guest: {
      name: cleanedName || 'Guest',
      ipHash: signals.ip,
      deviceHash: signals.device,
      fingerprintHash: signals.fingerprint,
      contentKey,
    },
  };
}
