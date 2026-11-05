import { env } from "@/lib/env";

/** Error envelope from the API: { error: { code, message, details? } } */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Thrown when the server could not be reached at all (offline, DNS, CORS, timeout). */
export class NetworkError extends Error {
  constructor(message = "Could not reach the server.") {
    super(message);
    this.name = "NetworkError";
  }
}

type TokenProvider = () => Promise<string | null>;
let getToken: TokenProvider = async () => null;
let onUnauthorized: (() => void) | null = null;

/** The auth layer registers how to obtain the current Supabase access token. */
export function setTokenProvider(provider: TokenProvider) {
  getToken = provider;
}

/** Called when the API answers 401 for a request that carried a token (session expired/revoked). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (!env.apiBaseUrl) throw new NetworkError("API base URL is not configured.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000);
  opts.signal?.addEventListener("abort", () => controller.abort());

  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${env.apiBaseUrl}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    const err = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    throw new ApiError(res.status, err?.code ?? `http_${res.status}`, err?.message ?? res.statusText, err?.details);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
