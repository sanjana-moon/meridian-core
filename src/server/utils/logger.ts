export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: unknown, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

const isProduction = process.env.NODE_ENV === "production";

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: isProduction ? undefined : error.stack,
      cause: error.cause instanceof Error
        ? { name: error.cause.name, message: error.cause.message }
        : error.cause,
    };
  }
  if (typeof error === "string") return { message: error };
  return { value: error };
}

function emit(
  level: "info" | "warn" | "error" | "debug",
  message: string,
  payload: Record<string, unknown>,
): void {
  // In production, emit structured JSON so log aggregators can parse it.
  if (isProduction) {
    console.log(
      JSON.stringify({ level, message, time: new Date().toISOString(), ...payload }),
    );
    return;
  }
  // In development, keep it human-readable.
  const fn =
    level === "error" ? console.error :
    level === "warn" ? console.warn :
    level === "debug" ? console.debug :
    console.log;
  fn(`[${level}] ${message}`, payload);
}

export const logger: Logger = {
  info(message, context) {
    emit("info", message, context ?? {});
  },
  warn(message, context) {
    emit("warn", message, context ?? {});
  },
  error(message, error, context) {
    emit("error", message, { ...(context ?? {}), error: serializeError(error) });
  },
  debug(message, context) {
    if (isProduction) return; // skip debug in prod
    emit("debug", message, context ?? {});
  },
};

// ---- Backward-compatible helper (your existing code uses `logError`) ----
export function logError(context: string, error: unknown): void {
  logger.error(context, error);
}