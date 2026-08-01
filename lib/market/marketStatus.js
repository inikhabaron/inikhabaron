// Session state for a quote — "is the market open right now".
//
// Kept out of lib/services/market/ because that layer is server-side
// fetching/caching; this is the presentation-side question, shared by the
// ticker and the /market page so the two can never disagree on what "Open"
// means.
//
// Yahoo's chart endpoint returns `marketState` for some symbols but sends
// null for ^BSESN/^NSEI, so it can't be the only source. When the provider
// doesn't say, derive it: exchange trading hours answer "should it be open",
// and the freshness of the last trade timestamp answers "is it actually
// trading" — which is what catches market holidays, when the clock says open
// but no ticks have arrived all day.

// NSE/BSE equity hours, 09:15–15:30 IST, Monday to Friday.
const OPEN_MINUTES = 9 * 60 + 15;
const CLOSE_MINUTES = 15 * 60 + 30;
const TRADING_DAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

// The chart endpoint is polled at a 5m interval, so `marketTime` legitimately
// lags a few minutes during live trading. Anything older than this means no
// ticks are arriving — a holiday, or the session has ended.
const STALE_TRADE_MS = 20 * 60 * 1000;

const IST_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function withinTradingHours(now) {
  const parts = IST_PARTS.formatToParts(new Date(now));
  const get = (type) => parts.find((p) => p.type === type)?.value;

  if (!TRADING_DAYS.has(get('weekday'))) return false;

  // Intl renders midnight as "24" in some runtimes; normalize so the
  // comparison below can't silently mis-bucket it.
  const hour = Number(get('hour')) % 24;
  const minutes = hour * 60 + Number(get('minute'));
  return minutes >= OPEN_MINUTES && minutes <= CLOSE_MINUTES;
}

/**
 * Resolves a quote to 'REGULAR' (open), 'CLOSED', or null when there isn't
 * enough information to say — callers render nothing rather than guess.
 */
export function resolveMarketState(quote, now = Date.now()) {
  if (!quote?.available) return null;

  // The provider is authoritative whenever it actually tells us.
  if (quote.marketState) return quote.marketState;

  if (!quote.marketTime) return null;

  const tradeIsLive = now - quote.marketTime <= STALE_TRADE_MS;
  return withinTradingHours(now) && tradeIsLive ? 'REGULAR' : 'CLOSED';
}

// Indian exchanges only report "REGULAR" during trading hours — PRE/POST/
// CLOSED all mean "can't trade right now", so they're collapsed into one
// Closed badge rather than surfacing Yahoo's raw session-state vocabulary.
export function isMarketOpen(marketState) {
  return marketState === 'REGULAR';
}

export function marketStatusLabel(marketState, isHindi) {
  if (isMarketOpen(marketState)) return isHindi ? 'खुला' : 'Open';
  return isHindi ? 'बंद' : 'Closed';
}

// Poll rates. Prices only move while the market is trading, so polling a
// closed market at the live rate is pure waste — overnight alone would be
// ~2,000 needless requests per open tab.
export const REFRESH_TRADING_MS = 15_000;   // actively trading
export const REFRESH_PROBE_MS = 60_000;     // inside hours, not trading yet
export const REFRESH_CLOSED_MS = 300_000;   // outside hours

/**
 * How often to refetch, given the currently resolved state.
 *
 * The middle tier matters: at 09:15 the clock says trading but the last
 * quote is still yesterday's, so the state reads CLOSED. Polling at the slow
 * rate there would leave the ticker stale for up to five minutes after the
 * opening bell. A one-minute probe inside trading hours picks the open up
 * quickly, and on a market holiday it settles at one request a minute rather
 * than four a minute.
 */
export function refreshIntervalFor(marketState, now = Date.now()) {
  if (isMarketOpen(marketState)) return REFRESH_TRADING_MS;
  return withinTradingHours(now) ? REFRESH_PROBE_MS : REFRESH_CLOSED_MS;
}
