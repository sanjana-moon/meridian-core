export function getApiErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return "The request could not be completed.";
  }

  if ("data" in error && typeof error.data === "object" && error.data !== null) {
    const data = error.data;
    if ("error" in data && typeof data.error === "string") {
      return data.error;
    }
    if ("message" in data && typeof data.message === "string") {
      return data.message;
    }
  }

  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "The request could not be completed.";
}
