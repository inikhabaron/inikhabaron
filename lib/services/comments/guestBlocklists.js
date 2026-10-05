/**
 * Blocklists for guest comments, kept apart from the matching logic
 * (guestContentFilter.js) so editorial can tune them without touching code.
 *
 * These are deliberately a *first line* of defence: obvious abuse, obvious
 * spam, obviously dangerous links. They will miss coded or misspelled hate
 * speech and misinformation — the 24h moderator review and reader reports are
 * the real control for those. Prefer adding specific phrases over broad topic
 * words: a news site's comments legitimately discuss betting, bitcoin, loans.
 */

// Latin-script profanity/slurs (English + romanised Hindi). Matched on word
// boundaries, tolerant of repeated letters, leetspeak and spaced-out letters,
// and of common suffixes (s, ed, er, ing, y), so list the bare stem only.
export const PROFANITY_LATIN = [
  // English
  'fuck', 'motherfucker', 'shit', 'bullshit', 'bitch', 'bastard', 'asshole',
  'dickhead', 'cunt', 'whore', 'slut', 'nigger', 'nigga', 'faggot', 'tranny',
  'retard', 'wanker', 'twat', 'jackass', 'douchebag', 'pussy', 'bollocks',
  'son of a bitch', 'piece of shit',
  // Hindi / Hinglish
  'madarchod', 'madharchod', 'maderchod', 'behenchod', 'behnchod', 'bhenchod',
  'bhosdike', 'bhosdi', 'bhosda', 'bhosadi', 'bhosadike', 'chutiya', 'chutiye',
  'chut', 'gandu', 'gaandu', 'gaand', 'lund', 'lauda', 'lawda', 'lavda',
  'randi', 'raand', 'harami', 'haramzada', 'haramkhor', 'kutiya', 'bhadwa',
  'bhadve', 'jhatu', 'jhaatu',
  // Communal / caste / ethnic slurs
  'katua', 'katwe', 'bhimta', 'paki',
];

// Devanagari profanity/slurs. Matched as whole words; variant spellings are
// listed explicitly because there's no reliable "repeat letter" folding.
export const PROFANITY_DEVANAGARI = [
  'मादरचोद', 'मादरचोद', 'बहनचोद', 'बेहनचोद', 'भेनचोद', 'भोसड़ी', 'भोसड़ीके',
  'भोसडी', 'भोसडीके', 'चूतिया', 'चुतिया', 'चूतिये', 'चूत', 'गांडू', 'गान्डू',
  'गांड', 'रंडी', 'रण्डी', 'हरामी', 'हरामजादा', 'हरामज़ादा', 'हरामखोर', 'लौड़ा',
  'लौडा', 'लोड़ा', 'लंड', 'लण्ड', 'भड़वा', 'भड़वे', 'भडवा', 'झाटू', 'कटुआ',
  'कटवे', 'भीमटा',
];

// Solicitation phrases that are spam wherever they appear. Written as regex
// source; whitespace is matched flexibly. Case-insensitive.
export const SPAM_PHRASES = [
  'click\\s+(?:here|the\\s+link|below)', 'buy\\s+now', 'order\\s+now',
  'limited\\s+(?:time\\s+)?offer', 'free\\s+money', 'easy\\s+money',
  'make\\s+money', 'earn\\s+(?:money|cash|rs|₹|\\$)', 'work\\s+(?:from|at)\\s+home',
  'online\\s+earning', 'earning\\s+online', 'passive\\s+income', 'get\\s+rich',
  '100\\s*%\\s*(?:free|guaranteed)', 'guaranteed\\s+(?:income|profit|returns)',
  'no\\s+investment', 'double\\s+your', 'crypto\\s+giveaway',
  'bitcoin\\s+(?:doubler|giveaway|investment)', 'binary\\s+options',
  'forex\\s+(?:signals|trading\\s+course)', 'sex\\s+video', 'adult\\s+video',
  'call\\s+girl', 'escort\\s+service', 'buy\\s+(?:real\\s+)?followers',
  'free\\s+followers', 'instagram\\s+followers', 'seo\\s+services?', 'backlinks?',
  'viagra', 'cialis', 'porn', 'xxx', 'visit\\s+my\\s+(?:site|website|profile|page)',
  'check\\s+(?:out\\s+)?my\\s+(?:profile|site|website|channel)',
  'join\\s+my\\s+(?:channel|group)', 'subscribe\\s+to\\s+my', 'dm\\s+me',
  'inbox\\s+me', 'whatsapp\\s+me', 'contact\\s+me\\s+(?:on|at|via)',
  'instant\\s+loan', 'loan\\s+offer', 'credit\\s+card\\s+offer', 'you\\s+have\\s+won',
  'claim\\s+your\\s+(?:prize|reward)', 'lottery\\s+winner', 'customer\\s+care\\s+number',
  'kyc\\s+update', 'hire\\s+a\\s+hacker',
  // Hindi
  'पैसे\\s+कमाएं', 'घर\\s+बैठे\\s+कमाई', 'ऑनलाइन\\s+कमाई', 'सट्टा\\s+मटका',
  'सट्टा\\s+किंग', 'लॉटरी\\s+जीत',
];

// Topic words that are fine in a news discussion on their own but are spam
// when the comment also carries a link or a "contact me" hook.
export const LINK_GATED_SPAM_TERMS = [
  'casino', 'betting', 'bet', 'satta', 'matka', 'teen\\s+patti', 'rummy',
  'bitcoin', 'crypto', 'forex', 'loan', 'dating', 'telegram', 'whatsapp',
  'weight\\s+loss', 'diet\\s+pills', 'pharmacy', 'cheap',
];

// URL shorteners hide the destination, so they can't be vetted.
export const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'cutt.ly',
  'rb.gy', 'shorturl.at', 'tiny.cc', 'buff.ly', 'rebrand.ly', 'shorte.st',
  'adf.ly', 'lnkd.in', 'bl.ink', 'soo.gd', 'v.gd', 'clck.ru', 'qr.net',
];

// Messaging-app deep links are a spam/scam funnel.
export const BLOCKED_LINK_DOMAINS = [
  't.me', 'telegram.me', 'wa.me', 'chat.whatsapp.com', 'api.whatsapp.com',
  'discord.gg', 'linktr.ee',
];

// TLDs overwhelmingly used for throwaway spam/phishing/malware hosting.
export const SUSPICIOUS_TLDS = [
  'zip', 'mov', 'xyz', 'top', 'click', 'gq', 'tk', 'ml', 'cf', 'ga', 'work',
  'loan', 'win', 'bid', 'icu', 'cyou', 'rest', 'monster', 'country', 'stream',
  'download', 'racing', 'party', 'review', 'trade', 'cam', 'sbs', 'buzz',
];

// Link targets that are executables/installers.
export const DANGEROUS_EXTENSIONS = [
  'exe', 'apk', 'scr', 'bat', 'cmd', 'msi', 'jar', 'ps1', 'vbs', 'js', 'dll',
  'iso', 'dmg', 'pkg', 'deb', 'rar', 'sh', 'lnk',
];

// Impersonation: a guest must not present as the newsroom.
export const RESERVED_NAME_PATTERN =
  /\b(?:admin(?:istrator)?|moderator|mod|editor(?:ial)?|staff|reporter|official|support|helpdesk|news\s*desk|team|khabar\s*on|ini\s*khabar\s*on|inikhabaron)\b/i;
