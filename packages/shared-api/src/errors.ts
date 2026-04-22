export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message?: string) {
    super(message ?? "Network error");
    this.name = "NetworkError";
  }
}

export function parseApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }
  const d = data as Record<string, unknown>;
  const detail = d.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (detail && typeof detail === "object" && "message" in detail) {
    const m = (detail as { message?: unknown }).message;
    if (typeof m === "string") {
      return m;
    }
  }
  const err = d.error;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") {
      return m;
    }
  }
  return fallback;
}

const handledErrors = new WeakSet<object>();

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") handledErrors.add(error);
  if (error instanceof ApiError && error.status < 500) return error.message;
  return fallback;
}

export function isErrorHandled(error: unknown): boolean {
  return error !== null && typeof error === "object" && handledErrors.has(error);
}
