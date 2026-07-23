// Yahoo Finance's unofficial chart endpoint — no API key, which keeps this
// MVP dependency-free, but it's undocumented (429s/timeouts happen). This
// file is the single seam a licensed provider would replace later; it's a
// plain function rather than a provider interface because there is exactly
// one implementation today.
const FETCH_TIMEOUT_MS = 5_000;

export async function fetchYahooQuote(instrument) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(instrument.symbol)}?range=1d&interval=5m`;
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        // Yahoo 429s more readily without a browser-like UA on
        // server-to-server requests.
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/json',
      },
    });

    if (!res.ok) throw new Error(`Upstream responded ${res.status}`);

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') {
      throw new Error(data?.chart?.error?.description || 'Malformed quote payload');
    }

    const value = meta.regularMarketPrice;
    const previousClose = meta.previousClose ?? meta.chartPreviousClose;
    const change = typeof previousClose === 'number' ? value - previousClose : 0;
    const changePercent = typeof previousClose === 'number' && previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
      id: instrument.id,
      name: instrument.name,
      shortName: instrument.shortName,
      value,
      change,
      changePercent,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      currency: meta.currency || null,
      previousClose: typeof previousClose === 'number' ? previousClose : null,
      dayHigh: typeof meta.regularMarketDayHigh === 'number' ? meta.regularMarketDayHigh : null,
      dayLow: typeof meta.regularMarketDayLow === 'number' ? meta.regularMarketDayLow : null,
      // "REGULAR" during trading hours, "CLOSED"/"PRE"/"POST" otherwise —
      // surfaced as-is rather than re-deriving NSE/BSE trading hours here.
      marketState: meta.marketState || null,
      marketTime: meta.regularMarketTime ? meta.regularMarketTime * 1000 : null,
      updatedAt: Date.now(),
      available: true,
      stale: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}
