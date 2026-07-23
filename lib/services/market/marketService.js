import { INSTRUMENTS, DEFAULT_INSTRUMENT_IDS } from './marketConstants';
import { getFresh, setFresh, getLastGood, setLastGood } from './marketCache';
import { fetchYahooQuote } from './yahooProvider';

export { DEFAULT_INSTRUMENT_IDS };

// Collapses concurrent requests for the same symbol within this process
// (e.g. several tabs polling at once) into one upstream call. Across
// processes/instances, marketCache's Redis "fresh" tier does the
// equivalent job once the first one populates it.
const inFlight = new Map(); // id -> Promise

async function getQuote(instrumentId) {
  const instrument = INSTRUMENTS[instrumentId];
  if (!instrument) return { id: instrumentId, available: false, stale: false, error: 'Unknown instrument' };

  const fresh = await getFresh(instrumentId);
  if (fresh) return fresh;

  if (inFlight.has(instrumentId)) return inFlight.get(instrumentId);

  const promise = (async () => {
    try {
      const quote = await fetchYahooQuote(instrument);
      await Promise.all([setFresh(instrumentId, quote), setLastGood(instrumentId, quote)]);
      return quote;
    } catch (error) {
      console.error(`market quote fetch failed for ${instrumentId}:`, error.message);
      const last = await getLastGood(instrumentId);
      if (last) return { ...last, stale: true };
      return { id: instrumentId, name: instrument.name, shortName: instrument.shortName, available: false, stale: false, error: 'Market data unavailable' };
    } finally {
      inFlight.delete(instrumentId);
    }
  })();

  inFlight.set(instrumentId, promise);
  return promise;
}

export async function getMarketQuotes(ids = DEFAULT_INSTRUMENT_IDS) {
  const validIds = ids.filter((id) => INSTRUMENTS[id]);
  return Promise.all(validIds.map(getQuote));
}
