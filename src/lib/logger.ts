import { createLogger, format, transports } from 'winston';

const { combine, timestamp, splat, printf, errors } = format;

const jsonFormatter = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const base = {
    level,
    message,
    timestamp: ts,
    ...meta,
  } as Record<string, unknown>;

  if (stack) {
    base.stack = stack;
  }

  return JSON.stringify(base);
});

const loggerInstance = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(errors({ stack: true }), splat(), timestamp(), jsonFormatter),
  defaultMeta: { service: 'eleventy-build' },
  transports: [new transports.Console({ stderrLevels: ['error', 'warn'] })],
});

export type BuildLogger = typeof loggerInstance;

export function getLogger(): BuildLogger {
  return loggerInstance;
}

/**
 * Helper that logs a structured lifecycle event when Eleventy starts.
 */
export function logBuildLifecycle(phase: string, details?: Record<string, unknown>): void {
  getLogger().info('eleventy lifecycle event', { phase, ...details });
}
