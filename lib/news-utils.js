export const ACCENT        = '#152a58';
export const ACCENT_H      = '#1134a7';
export const EDITORIAL_RED = '#D72638';

export const translations = {
  en: {
    latestNews: 'Latest News',

    nation: 'Nation',
    states: 'States',
    politics: 'Politics',
    world: 'World',
    economy: 'Economy',
    sports: 'Sports',
    entertainment: 'Entertainment',
    opinion: 'Opinion',
    schemes: 'Schemes',
    education: 'Education',
    jobs: 'Jobs',
    farmers: 'Farmers',
    science: 'Science',
    innovation: 'Innovation',
    'auto-gadget': 'Auto-Gadget',
    'court-room': 'Court-Room',
    lifestyle: 'Lifestyle',

    more: 'More',
    searchPlaceholder: 'Search news...',
    loadMore: 'Load More',
    noArticles: 'No articles found',
    checkBackLater: 'Check back later',
    logout: 'Log Out',
    trendingNews: 'Trending News',
  },

  hi: {
    latestNews: 'ताज़ा खबर',

    nation: 'देश',
    states: 'राज्य',
    politics: 'राजनीति',
    world: 'दुनिया',
    economy: 'अर्थव्यवस्था',
    sports: 'खेल',
    entertainment: 'मनोरंजन',
    opinion: 'विमर्श',
    schemes: 'योजनाएं',
    education: 'पढ़ाई',
    jobs: 'नौकरी',
    farmers: 'किसान',
    science: 'विज्ञान',
    innovation: 'छलांग',
    'auto-gadget': 'ऑटोमोबाइल-गैजेट',
    'court-room': 'न्यायालय',
    lifestyle: 'लोकरुचि',

    more: 'और',
    searchPlaceholder: 'खोजें...',
    loadMore: 'और देखें',
    noArticles: 'कोई लेख नहीं मिला',
    checkBackLater: 'बाद में देखें',
    logout: 'लॉग आउट',
    trendingNews: 'ट्रेंडिंग न्यूज़',
  },
};

export const FONT_OPTIONS = [
  { label: 'Inter',        value: 'var(--font-inter)' },
  { label: 'Poppins',      value: 'var(--font-poppins)' },
  { label: 'Roboto',       value: 'var(--font-roboto)' },
  { label: 'DM Sans',      value: 'var(--font-dm-sans)' },
  // { label: 'Nunito Sans',  value: 'var(--font-nunito-sans)' },
  { label: 'Plus Jakarta', value: 'var(--font-plus-jakarta)' },
  { label: 'SF Pro',       value: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif" },
  { label: 'Helvetica',    value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
];

export const getCatAccent = (cat) => {
  const map = {
    nation: '#DC2626',
    states: '#EA580C',
    politics: '#9333EA',
    world: '#4F46E5',
    economy: '#2563EB',
    sports: '#16A34A',
    entertainment: '#D946EF',
    opinion: '#7C3AED',
    schemes: '#0891B2',
    education: '#0284C7',
    jobs: '#0F766E',
    farmers: '#65A30D',
    science: '#0EA5E9',
    innovation: '#8B5CF6',
    'auto-gadget': '#14B8A6',
    'court-room': '#C2410C',
    lifestyle: '#BE123C',
  };

  return map[(cat || '').toLowerCase()] || ACCENT;
};

export const getCatLabel = (category, lang) =>
  lang === 'hi' ? (translations.hi[category] || category) : category;

export const formatDate = (ds) => {
  if (!ds) return '';
  const date = new Date(ds);
  const diff = Date.now() - date;
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const getSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  let s = localStorage.getItem('newsdesk_session');
  if (!s) { s = 'sess_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('newsdesk_session', s); }
  return s;
};
