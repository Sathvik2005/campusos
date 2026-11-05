import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "http://api.test", supabaseUrl: "", supabaseAnonKey: "" } }));

import { ApiError, NetworkError, apiFetch, setTokenProvider } from "./client";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("apiFetch", () => {
  beforeEach(() => setTokenProvider(async () => null));
  afterEach(() => vi.unstubAllGlobals());

  it("returns parsed JSON and calls the configured base URL", async () => {
    const f = vi.fn().mockResolvedValue(json({ status: "ok" }));
    vi.stubGlobal("fetch", f);
    await expect(apiFetch("/health")).resolves.toEqual({ status: "ok" });
    expect(f.mock.calls[0][0]).toBe("http://api.test/health");
  });

  it("attaches the Bearer token when one is available", async () => {
    setTokenProvider(async () => "tok123");
    const f = vi.fn().mockResolvedValue(json({}));
    vi.stubGlobal("fetch", f);
    await apiFetch("/api/v1/auth/me");
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer tok123");
  });

  it("maps the API error envelope to ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => json({ error: { code: "forbidden", message: "No access" } }, 403)));
    await expect(apiFetch("/x")).rejects.toMatchObject({ status: 403, code: "forbidden", message: "No access" });
    await expect(apiFetch("/x")).rejects.toBeInstanceOf(ApiError);
  });

  it("throws NetworkError when the server cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(apiFetch("/x")).rejects.toBeInstanceOf(NetworkError);
  });
});
