import {
  PROFANITY_LATIN,
  PROFANITY_DEVANAGARI,
  SPAM_PHRASES,
  LINK_GATED_SPAM_TERMS,
  URL_SHORTENERS,
  BLOCKED_LINK_DOMAINS,
  SUSPICIOUS_TLDS,
  DANGEROUS_EXTENSIONS,
  RESERVED_NAME_PATTERN,
} from './guestBlocklists';

/**
 * Pre-publication content checks for guest comments. Pure functions: text in,
 * `{ ok: true }` or `{ ok: false, code, message }` out. Because guest comments
 * go live immediately, anything that fails here is rejected outright (the
 * visitor is asked to rephrase) rather than stored.
 *
 * Messages are deliberately generic — they say *what kind* of problem it is,
 * never which word or rule matched, so the lists can't be probed.
 */

export const MAX_LINKS = 1;

const WORD_CHARS = '\\p{L}\\p{M}\\p{N}';
const NOT_AFTER_WORD = `(?<![${WORD_CHARS}])`;
const NOT_BEFORE_WORD = `(?![${WORD_CHARS}])`;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ------------------------------ profanity ------------------------------ */

// 'fuck' -> /f+u+c+k+/ so "fuuuck" matches; multi-word terms allow separators.
function latinTermPattern(term) {
  return term
    .split(/\s+/)
    .map((word) =>
      [...word]
        .map((char) => (/[a-z]/i.test(char) ? `${char}+` : escapeRegex(char)))
        .join('')
    )
    .join('[\\s._-]+');
}

const LATIN_SUFFIX = '(?:s|es|ed|er|ers|ing|in|y|z)?';

const LATIN_PROFANITY = new RegExp(
  `${NOT_AFTER_WORD}(?:${PROFANITY_LATIN.map(latinTermPattern).join('|')})${LATIN_SUFFIX}${NOT_BEFORE_WORD}`,
  'iu'
);

const DEVANAGARI_PROFANITY = new RegExp(
  `${NOT_AFTER_WORD}(?:${[...new Set(PROFANITY_DEVANAGARI.map((w) => w.normalize('NFC')))]
    .map(escapeRegex)
    .join('|')})${NOT_BEFORE_WORD}`,
  'u'
);

const LEET = { '@': 'a', '4': 'a', '3': 'e', '1': 'i', '!': 'i', '|': 'i', '0': 'o', $: 's', 5: 's', 7: 't' };

// Drop Latin diacritics ("fück") without touching Devanagari, whose few
// precomposed letters are composition-excluded and so round-trip unchanged.
function foldAccents(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}

// "f u c k" / "f.u.c.k" -> "fuck": only runs of single letters joined by
// separators are collapsed, so ordinary words are never glued together.
function spacedLetterRuns(text) {
  const runs = [];
  const pattern = /(?<![\p{L}\p{N}])((?:\p{L}[\s._\-*]+){2,}\p{L})(?![\p{L}\p{N}])/gu;
  for (const match of text.matchAll(pattern)) {
    runs.push(match[1].replace(/[\s._\-*]+/g, ''));
  }
  return runs;
}

function containsProfanity(text) {
  const plain = foldAccents(text).toLowerCase();
  const leet = plain.replace(/[@43!|1075$]/g, (char) => LEET[char] ?? char);

  const latinCandidates = [plain, leet, ...spacedLetterRuns(plain), ...spacedLetterRuns(leet)];

  return (
    latinCandidates.some((candidate) => LATIN_PROFANITY.test(candidate)) ||
    DEVANAGARI_PROFANITY.test(text.normalize('NFC'))
  );
}

/* ------------------------------- spam ---------------------------------- */

const SPAM_PHRASE = new RegExp(
  `${NOT_AFTER_WORD}(?:${SPAM_PHRASES.join('|')})${NOT_BEFORE_WORD}`,
  'iu'
);

const GATED_SPAM_TERM = new RegExp(
  `${NOT_AFTER_WORD}(?:${LINK_GATED_SPAM_TERMS.join('|')})${NOT_BEFORE_WORD}`,
  'iu'
);

const CONTACT_HOOK = /(?<![\p{L}\p{N}])(?:dm|inbox|whatsapp|telegram|contact|call|sms|text)(?![\p{L}\p{N}])/iu;

function looksLikeSpamShape(text) {
  if (/(.)\1{14,}/u.test(text)) return true;

  const letters = text.match(/\p{L}/gu) || [];
  const upper = text.match(/[A-Z]/g) || [];
  if (letters.length >= 20 && upper.length / letters.length > 0.8) return true;

  if (/(?<![\p{L}\p{N}])([\p{L}\p{N}]{2,})(?:\s+\1){4,}(?![\p{L}\p{N}])/iu.test(text)) return true;

  // A single 80+ character unbroken token is a payload/blob, not a word.
  if (/[^\s]{80,}/u.test(text.replace(/(?:https?:\/\/|www\.)\S+/gi, ''))) return true;

  return false;
}

/* ---------------------- html / script injection ------------------------- */

// No whitespace is allowed after '<': browsers don't parse "< b>" as a tag, and
// allowing it would flag ordinary text such as "a < b and c > d".
const HTML_TAG = /<\/?[a-z][a-z0-9-]*(?:\s[^<>]*)?\/?>/i;
const DANGEROUS_OPEN_TAG = /<\/?(?:script|iframe|object|embed|svg|style|link|meta|img|body|html|form|input|video|audio|base)\b/i;
const EVENT_HANDLER = /\bon(?:error|load|click|dblclick|mouse\w+|focus|blur|submit|change|input|key(?:down|up|press)|toggle|animation\w*|pointer\w*|touch\w*)\s*=/i;
const SCRIPT_URI = /(?:javascript|vbscript)\s*:|data\s*:\s*(?:text|application|image)\/|expression\s*\(/i;
const ENCODED_TAG = /&(?:lt|#0*60|#x0*3c);\s*\/?\s*[a-z]/i;

function containsMarkup(text) {
  return (
    HTML_TAG.test(text) ||
    DANGEROUS_OPEN_TAG.test(text) ||
    EVENT_HANDLER.test(text) ||
    SCRIPT_URI.test(text) ||
    ENCODED_TAG.test(text)
  );
}

/* ------------------------- contact information -------------------------- */

const DEVANAGARI_DIGITS = /[०-९]/g;

const EMAIL = /[\p{L}\p{N}._%+-]+\s?(?:@|[[(]\s?at\s?[\])])\s?[\p{L}\p{N}-]+(?:\s?(?:\.|[[(]\s?dot\s?[\])])\s?[\p{L}]{2,})+/iu;

// Indian mobiles (10 digits from 6-9, optional +91), '+' international numbers,
// STD landlines, and 4-4-4 Aadhaar-shaped numbers. Deliberately not "any 10
// digits": that would flag dates and ids that are perfectly innocent.
const PHONE_PATTERNS = [
  /(?<!\d)(?:\+?91[\s.-]?)?[6-9](?:[\s.-]?\d){9}(?!\d)/,
  /(?<!\d)\+\d{1,3}[\s.-]?\d(?:[\s.-]?\d){7,12}(?!\d)/,
  /(?<!\d)0\d{2,4}[\s-]\d{6,8}(?!\d)/,
  /(?<!\d)\d{4}\s\d{4}\s\d{4}(?!\d)/,
];

function containsContactInfo(text) {
  const ascii = text.replace(DEVANAGARI_DIGITS, (d) => String(d.charCodeAt(0) - 0x0966));
  return EMAIL.test(text) || PHONE_PATTERNS.some((pattern) => pattern.test(ascii));
}

/* -------------------------------- links --------------------------------- */

const BARE_TLDS = [
  'com', 'net', 'org', 'in', 'co', 'io', 'ru', 'cn', 'info', 'biz', 'me', 'tv',
  'cc', 'app', 'dev', 'online', 'site', 'shop', 'store', 'live', 'link', 'club',
  'vip', ...SUSPICIOUS_TLDS,
].join('|');

const LINK_CANDIDATE = new RegExp(
  [
    '[a-z][a-z0-9+.-]*:\\/\\/[^\\s<>"\']+',
    'www\\.[^\\s<>"\']+',
    `(?<![@\\p{L}\\p{N}.-])(?:[a-z0-9-]+\\.)+(?:${BARE_TLDS})(?![\\p{L}\\p{N}-])(?:[\\/?#][^\\s<>"']*)?`,
    // "example (dot) com" / "example[.]com" — obfuscation only spammers use
    '[a-z0-9-]+\\s?(?:\\(dot\\)|\\[dot\\]|\\[\\.\\])\\s?[a-z]{2,}',
  ].join('|'),
  'giu'
);

const matchesDomain = (host, domains) =>
  domains.some((domain) => host === domain || host.endsWith(`.${domain}`));

// Returns true when the link is acceptable.
function isSafeLink(raw) {
  const candidate = raw.replace(/[.,;:!?)\]}>'"”’]+$/u, '');

  if (/\(dot\)|\[dot\]|\[\.\]/i.test(candidate)) return false;

  const scheme = candidate.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  if (scheme && !['http', 'https'].includes(scheme[1].toLowerCase())) return false;

  const rest = candidate.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const authority = rest.split(/[/?#]/)[0];

  // http://trusted.com@evil.com — the classic credential-prefix disguise.
  if (authority.includes('@') || authority.includes('%')) return false;

  const host = authority.replace(/:\d+$/, '').toLowerCase();

  if (!host.includes('.')) return false;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || /^\[/.test(host) || /^[\d.]+$/.test(host)) return false;
  if (host.includes('xn--')) return false;
  if (host.length > 60 || host.split('.').length > 5) return false;

  const tld = host.split('.').pop();
  if (SUSPICIOUS_TLDS.includes(tld)) return false;
  if (matchesDomain(host, URL_SHORTENERS) || matchesDomain(host, BLOCKED_LINK_DOMAINS)) return false;

  const path = rest.slice(authority.length).split(/[?#]/)[0];
  const extension = path.match(/\.([a-z0-9]{1,5})$/i)?.[1]?.toLowerCase();
  if (extension && DANGEROUS_EXTENSIONS.includes(extension)) return false;

  return true;
}

function findLinks(text) {
  return text.match(LINK_CANDIDATE) || [];
}

/* ------------------------------ public API ------------------------------ */

const REJECT = {
  invalid: 'Please write a valid comment.',
  html: "Comments can't contain HTML or code.",
  contact: "Please don't include phone numbers or email addresses.",
  linkLimit: `Please include at most ${MAX_LINKS} link in a comment.`,
  linkUnsafe: "One of the links in your comment can't be posted.",
  profanity: "Your comment contains language that isn't allowed. Please rephrase it.",
  spam: "This comment looks like spam and can't be posted.",
  name: 'Please choose a different name.',
};

const fail = (code, message) => ({ ok: false, code, message });

/** Checks a comment body. Order matters only for which message is shown. */
export function checkGuestText(text, { maxLinks = MAX_LINKS } = {}) {
  if (typeof text !== 'string' || !/[\p{L}\p{N}\p{Extended_Pictographic}]/u.test(text)) {
    return fail('invalid', REJECT.invalid);
  }

  if (containsMarkup(text)) return fail('html', REJECT.html);
  if (containsContactInfo(text)) return fail('contact', REJECT.contact);

  const links = findLinks(text);
  if (links.length > maxLinks) return fail('link_limit', REJECT.linkLimit);
  if (!links.every(isSafeLink)) return fail('link_unsafe', REJECT.linkUnsafe);

  if (containsProfanity(text)) return fail('profanity', REJECT.profanity);

  if (
    SPAM_PHRASE.test(text) ||
    looksLikeSpamShape(text) ||
    ((links.length > 0 || CONTACT_HOOK.test(text)) && GATED_SPAM_TERM.test(text))
  ) {
    return fail('spam', REJECT.spam);
  }

  return { ok: true };
}

/** Checks the display name: same rules, no links at all, and no impersonation. */
export function checkGuestName(name) {
  if (RESERVED_NAME_PATTERN.test(name)) return fail('name', REJECT.name);

  const result = checkGuestText(name, { maxLinks: 0 });

  return result.ok ? result : fail('name', REJECT.name);
}
