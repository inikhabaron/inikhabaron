const ENV = process.env.NODE_ENV || 'development';

function format(level, msg, meta) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[khabaron:${level}] ${ts} - ${msg}${metaStr}`;
}

export const logger = {
  info: (msg, meta) => console.info(format('info', msg, meta)),
  warn: (msg, meta) => console.warn(format('warn', msg, meta)),
  error: (msg, meta) => console.error(format('error', msg, meta)),
  debug: (msg, meta) => {
    if (ENV !== 'production') console.debug(format('debug', msg, meta));
  }
};

export default logger;
