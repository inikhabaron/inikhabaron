// A superset of what's enabled today — Bank Nifty/Gold/Silver/USD-INR/
// Crude/Crypto are pre-wired with `enabled: false` so turning one on later
// is a one-line flip here plus adding it to a consuming component's `ids`
// prop, not a new integration.
export const INSTRUMENTS = Object.freeze({
  sensex: { id: 'sensex', symbol: '^BSESN', name: 'Sensex', shortName: 'SENSEX', enabled: true },
  nifty: { id: 'nifty', symbol: '^NSEI', name: 'Nifty 50', shortName: 'NIFTY 50', enabled: true },
  banknifty: { id: 'banknifty', symbol: '^NSEBANK', name: 'Bank Nifty', shortName: 'BANK NIFTY', enabled: false },
  gold: { id: 'gold', symbol: 'GC=F', name: 'Gold', shortName: 'GOLD', enabled: false },
  silver: { id: 'silver', symbol: 'SI=F', name: 'Silver', shortName: 'SILVER', enabled: false },
  usdinr: { id: 'usdinr', symbol: 'INR=X', name: 'USD/INR', shortName: 'USD/INR', enabled: false },
  crude: { id: 'crude', symbol: 'CL=F', name: 'Crude Oil', shortName: 'CRUDE', enabled: false },
  crypto: { id: 'crypto', symbol: 'BTC-USD', name: 'Bitcoin', shortName: 'BTC', enabled: false },
});

export const DEFAULT_INSTRUMENT_IDS = Object.values(INSTRUMENTS)
  .filter((i) => i.enabled)
  .map((i) => i.id);
