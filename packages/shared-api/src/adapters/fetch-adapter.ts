export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type RequestCredentialsMode = "omit" | "same-origin" | "include";

export interface FetchAdapterRequest {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
  credentials?: RequestCredentialsMode;
}

export interface FetchAdapterResponse {
  status: number;
  json: () => Promise<unknown>;
}

export type FetchAdapter = (req: FetchAdapterRequest) => Promise<FetchAdapterResponse>;

export const defaultFetchAdapter: FetchAdapter = async (req) => {
  const response = await fetch(req.url, {
    method: req.method,
    headers: req.headers,
    body: req.body,
    credentials: req.credentials ?? "omit",
  });
  return {
    status: response.status,
    json: () => response.json().catch(() => ({})),
  };
};
