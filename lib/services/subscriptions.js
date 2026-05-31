export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    features: ['10 articles per day', 'Standard news access', 'Ad-supported'],
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    period: 'month',
    features: ['50 articles per day', 'Offline reading', 'Reduced ads', 'Email newsletter'],
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 299,
    period: 'month',
    features: ['Unlimited articles', 'Ad-free experience', 'Exclusive content', 'Early access', 'Offline reading', 'Priority support'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    period: 'month',
    features: ['Everything in Premium', 'API access', 'Multi-user accounts', 'Custom integrations', 'Dedicated support'],
    popular: false,
  },
];

const PLAN_FEATURES = {
  free: { adsEnabled: true, articleLimit: 10, offlineAccess: false, exclusiveContent: false, earlyAccess: false, noAds: false },
  basic: { adsEnabled: true, articleLimit: 50, offlineAccess: true, exclusiveContent: false, earlyAccess: false, noAds: false },
  premium: { adsEnabled: false, articleLimit: -1, offlineAccess: true, exclusiveContent: true, earlyAccess: true, noAds: true },
  enterprise: { adsEnabled: false, articleLimit: -1, offlineAccess: true, exclusiveContent: true, earlyAccess: true, noAds: true, apiAccess: true, multiUser: true },
};

export function getSubscriptionFeatures(plan) {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.free;
}
