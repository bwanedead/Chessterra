type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const levelRank: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const configuredLevel = ((): LogLevel => {
  const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  if (envLevel && envLevel in levelRank) {
    return envLevel;
  }
  return isProduction ? 'info' : 'debug';
})();

export const layoutDebugEnabled = isDevelopment && process.env.NEXT_PUBLIC_DEBUG_LAYOUT === 'true';

const formatPrefix = (namespace: string, level: LogLevel) => `[Chessterra:${namespace}] ${level.toUpperCase()}`;

const shouldLog = (level: LogLevel) => levelRank[level] <= levelRank[configuredLevel];

export interface LoggerApi {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  extend: (childNamespace: string) => LoggerApi;
}

const createLogger = (namespace: string): LoggerApi => {
  const log = (level: LogLevel, ...args: unknown[]) => {
    if (!shouldLog(level)) {
      return;
    }

    const prefix = formatPrefix(namespace, level);
    const serializedArgs = args.map((arg) => {
      if (arg === null) {
        return 'null';
      }

      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return '[unserializable object]';
        }
      }

      return arg;
    });

    switch (level) {
      case 'debug':
        console.log(prefix, ...serializedArgs);
        break;
      case 'info':
        console.info(prefix, ...serializedArgs);
        break;
      case 'warn':
        console.warn(prefix, ...serializedArgs);
        break;
      case 'error':
      default:
        console.error(prefix, ...serializedArgs);
        break;
    }
  };

  return {
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),
    extend: (childNamespace) => createLogger(`${namespace}:${childNamespace}`),
  };
};

export const logger = createLogger('app');

export const createScopedLogger = (namespace: string) => logger.extend(namespace);
