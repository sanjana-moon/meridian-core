export function logError(context: string, error: unknown): void {
  const name = error instanceof Error ? error.name : "UnknownError";
  const message = error instanceof Error ? error.message : "Non-Error value";
  console.error(context, { name, message });
}
