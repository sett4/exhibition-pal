import { performance } from "node:perf_hooks";
import { createLogger, format, transports } from "winston";

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
  level: process.env.LOG_LEVEL || "info",
  format: combine(errors({ stack: true }), splat(), timestamp(), jsonFormatter),
  defaultMeta: { service: "eleventy-build" },
  transports: [new transports.Console({ stderrLevels: ["error", "warn"] })],
});

export type BuildLogger = typeof loggerInstance;

/**
 * Provides the shared Winston logger instance for the build pipeline.
 * @returns Configured logger.
 */
export function getLogger(): BuildLogger {
  return loggerInstance;
}

export type PerformanceTimer = (metadata?: Record<string, unknown>) => void;

/**
 * Starts a high-resolution timer and logs a metric when completed.
 * @param metric Logical metric name (e.g. eleventy.build).
 * @param baseMeta Static metadata to include with each log.
 * @returns Function to call once the measured work completes.
 */
export function startPerformanceTimer(
  metric: string,
  baseMeta: Record<string, unknown> = {}
): PerformanceTimer {
  const start = performance.now();

  return (metadata: Record<string, unknown> = {}) => {
    const durationMs = Number((performance.now() - start).toFixed(3));
    getLogger().info("performance metric", {
      metric,
      durationMs,
      ...baseMeta,
      ...metadata,
    });
  };
}

let eleventyBuildTimer: PerformanceTimer | null = null;

/**
 * Helper that logs a structured lifecycle event when Eleventy starts.
 * @param phase Lifecycle identifier (before/after/etc.).
 * @param details Optional metadata to capture alongside the event.
 */
export function logBuildLifecycle(phase: string, details?: Record<string, unknown>): void {
  if (phase === "eleventy:before") {
    eleventyBuildTimer = startPerformanceTimer("eleventy.build");
  } else if (phase === "eleventy:after" && eleventyBuildTimer) {
    eleventyBuildTimer({ phase, ...details });
    eleventyBuildTimer = null;
  }

  getLogger().info("eleventy lifecycle event", { phase, ...details });
}
