import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "http://api.test", supabaseUrl: "", supabaseAnonKey: "" } }));

import { ApiError, NetworkError } from "@/lib/api/client";
import { cachedFetch } from "./cache";
import { resetDbForTests, simulateRestart, type SyncPayload } from "./db";
import { DuplicateLocalSessionError, countOutbox, enqueue, listOutbox, requeue } from "./outbox";
import { backoffMs, classify, syncOutbox } from "./sync";

const payload = (key: string, period = 1): SyncPayload => ({
  idempotency_key: key, batch_id: "b1", subject_id: "s1", held_on: "2026-11-05", period,
  records: [{ student_id: "st1", status: "present" }, { student_id: "st2", status: "absent" }],
});
const ok = { session_id: "x", created: true, record_count: 2 };

beforeEach(async () => { await resetDbForTests(); });

describe("enqueue (IndexedDB first)", () => {
  it("persists the full payload locally with pending status, without any network", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    await enqueue("u1", payload("k1"), "DS · Year 2 A");
    const [item] = await listOutbox("u1");
    expect(item).toMatchObject({ id: "k1", status: "pending", profileId: "u1" });
    expect(item.payload.records).toHaveLength(2);
    expect(f).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("survives a 'restart': a fresh connection still sees the record", async () => {
    await enqueue("u1", payload("k1"), "x");
    simulateRestart();
    expect((await listOutbox("u1")).map((i) => i.id)).toEqual(["k1"]);
  });

  it("refuses a second local save for the same class, date and period", async () => {
    await enqueue("u1", payload("k1"), "x");
    await expect(enqueue("u1", payload("k2"), "x")).rejects.toBeInstanceOf(DuplicateLocalSessionError);
    expect(await listOutbox("u1")).toHaveLength(1);
  });
});

describe("classify (status table)", () => {
  it.each([
    [new NetworkError(), "stop-offline", undefined],
    [new ApiError(401, "unauthorized", "x"), "stop-auth", undefined],
    [new ApiError(409, "conflict", "x"), "conflict", undefined],
    [new ApiError(403, "forbidden", "x"), "failed", false],
    [new ApiError(422, "validation", "x"), "failed", false],
    [new ApiError(500, "internal_error", "x"), "failed", true],
    [new ApiError(429, "rate_limited", "x"), "failed", true],
  ])("%#", (err, kind, retryable) => {
    const o = classify(err);
    expect(o.kind).toBe(kind);
    if (retryable !== undefined) expect((o as { retryable: boolean }).retryable).toBe(retryable);
  });

  it("backs off exponentially up to 5 minutes", () => {
    expect([0, 1, 2].map(backoffMs)).toEqual([2000, 4000, 8000]);
    expect(backoffMs(20)).toBe(300_000);
  });
});

describe("syncOutbox", () => {
  it("marks items synced on success and never deletes them", async () => {
    await enqueue("u1", payload("k1"), "x");
    const send = vi.fn().mockResolvedValue(ok);
    const r = await syncOutbox("u1", { send });
    expect(r.synced).toBe(1);
    const [item] = await listOutbox("u1");
    expect(item.status).toBe("synced");
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ idempotency_key: "k1" }));
  });

  it("replaying the same key twice sends the same idempotency key (server answers 200 no-op)", async () => {
    await enqueue("u1", payload("k1"), "x");
    const send = vi.fn().mockRejectedValueOnce(new ApiError(500, "e", "boom")).mockResolvedValue({ ...ok, created: false });
    await syncOutbox("u1", { send });
    await syncOutbox("u1", { send, force: true });
    expect(send.mock.calls.map((c) => c[0].idempotency_key)).toEqual(["k1", "k1"]);
    expect((await listOutbox("u1"))[0].status).toBe("synced");
  });

  it("offline: keeps the item pending, stops, and does not burn a retry", async () => {
    await enqueue("u1", payload("k1"), "x");
    await enqueue("u1", payload("k2", 2), "x");
    const send = vi.fn().mockRejectedValue(new NetworkError());
    const r = await syncOutbox("u1", { send });
    expect(r.offline).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    const items = await listOutbox("u1");
    expect(items.map((i) => i.status)).toEqual(["pending", "pending"]);
    expect(items[0].retryCount).toBe(0);
  });

  it("5xx: failed but retryable with backoff; not retried before nextRetryAt unless forced", async () => {
    await enqueue("u1", payload("k1"), "x");
    const t = 1_000_000;
    const send = vi.fn().mockRejectedValueOnce(new ApiError(503, "e", "down")).mockResolvedValue(ok);
    await syncOutbox("u1", { send, now: () => t });
    expect((await listOutbox("u1"))[0]).toMatchObject({ status: "failed", retryable: true, retryCount: 1, lastError: "down" });
    await syncOutbox("u1", { send, now: () => t + 100 });
    expect(send).toHaveBeenCalledTimes(1);
    await syncOutbox("u1", { send, now: () => t + 10_000 });
    expect(send).toHaveBeenCalledTimes(2);
    expect((await listOutbox("u1"))[0].status).toBe("synced");
  });

  it("403/422: non-retryable failure, local data preserved", async () => {
    await enqueue("u1", payload("k1"), "x");
    const send = vi.fn().mockRejectedValue(new ApiError(403, "forbidden", "No longer assigned"));
    await syncOutbox("u1", { send });
    const [item] = await listOutbox("u1");
    expect(item).toMatchObject({ status: "failed", retryable: false });
    expect(item.payload.records).toHaveLength(2);
    await syncOutbox("u1", { send, force: true });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("409: conflict, kept locally, never silently merged or retried", async () => {
    await enqueue("u1", payload("k1"), "x");
    const send = vi.fn().mockRejectedValue(new ApiError(409, "conflict", "Another record exists for this class and period"));
    const r = await syncOutbox("u1", { send });
    expect(r.conflicts).toBe(1);
    expect((await listOutbox("u1"))[0]).toMatchObject({ status: "conflict", retryable: false });
    await syncOutbox("u1", { send, force: true });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("401: expired session keeps the queue, flags auth, sends nothing further", async () => {
    await enqueue("u1", payload("k1"), "x");
    await enqueue("u1", payload("k2", 2), "x");
    const send = vi.fn().mockRejectedValue(new ApiError(401, "unauthorized", "expired"));
    const r = await syncOutbox("u1", { send });
    expect(r.authExpired).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    expect(countOutbox(await listOutbox("u1")).pending).toBe(2);
  });

  it("never sends another profile's records", async () => {
    await enqueue("alice", payload("k1"), "x");
    const send = vi.fn().mockResolvedValue(ok);
    const r = await syncOutbox("bob", { send });
    expect(r.synced).toBe(0);
    expect(send).not.toHaveBeenCalled();
    expect((await listOutbox("alice"))[0].status).toBe("pending");
  });

  it("partial failure: one item fails, the others still sync", async () => {
    await enqueue("u1", payload("k1", 1), "x");
    await enqueue("u1", payload("k2", 2), "x");
    await enqueue("u1", payload("k3", 3), "x");
    const send = vi.fn().mockImplementation(async (p: SyncPayload) => {
      if (p.idempotency_key === "k2") throw new ApiError(500, "e", "boom");
      return ok;
    });
    const r = await syncOutbox("u1", { send });
    expect(r).toMatchObject({ synced: 2, failed: 1 });
    expect((await listOutbox("u1")).map((i) => i.status)).toEqual(["synced", "failed", "synced"]);
  });

  it("is single-flight: concurrent calls do not double-send", async () => {
    await enqueue("u1", payload("k1"), "x");
    let release!: () => void;
    const send = vi.fn().mockImplementation(() => new Promise((res) => { release = () => res(ok); }));
    const a = syncOutbox("u1", { send });
    const b = syncOutbox("u1", { send });
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    release();
    await Promise.all([a, b]);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("manual requeue makes a failed item eligible immediately", async () => {
    await enqueue("u1", payload("k1"), "x");
    await syncOutbox("u1", { send: vi.fn().mockRejectedValue(new ApiError(500, "e", "boom")) });
    await requeue("k1");
    const send = vi.fn().mockResolvedValue(ok);
    await syncOutbox("u1", { send });
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe("cachedFetch", () => {
  it("serves the last cached copy when the network is unreachable, per profile", async () => {
    await cachedFetch("u1", "roster", async () => ["a"]);
    const off = await cachedFetch("u1", "roster", async () => { throw new NetworkError(); });
    expect(off).toMatchObject({ data: ["a"], fromCache: true });
    await expect(cachedFetch("u2", "roster", async () => { throw new NetworkError(); })).rejects.toBeInstanceOf(NetworkError);
  });

  it("does not hide server errors behind the cache", async () => {
    await cachedFetch("u1", "roster", async () => ["a"]);
    await expect(cachedFetch("u1", "roster", async () => { throw new ApiError(403, "forbidden", "no"); })).rejects.toBeInstanceOf(ApiError);
  });
});
