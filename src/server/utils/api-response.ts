import { ZodError } from "zod";
import { logError } from "@/server/utils/logger";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function assertUuid(value: string, label: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new ApiError(`${label} must be a valid UUID`, 400);
  }
}

export async function withApiErrors(
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof ZodError) {
      return Response.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    logError("Unhandled API request error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function parseBody<T>(
  request: Request,
  schema: {
    safeParse: (
      input: unknown,
    ) =>
      | { success: true; data: T }
      | { success: false; error: ZodError };
  },
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiError("Request body must be valid JSON", 400);
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw result.error;
  }

  return result.data;
}
