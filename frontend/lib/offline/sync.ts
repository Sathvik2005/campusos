import { ApiError, NetworkError, apiFetch } from "@/lib/api/client";
import { getDb, type OutboxItem, type SyncPayload } from "./db";
import { patchOutbox } from "./outbox";

export interface SyncResponse { session_id: string; created: boolean; record_count: number }
export type Send = (payload: SyncPayload) => Promise<SyncResponse>;

export const defaultSend: Send = (payload) => apiFetch<SyncResponse>("/api/v1/attendance/sync", { method: "POST", body: payload });

export const backoffMs = (retryCount: number) => Math.min(5 * 60_000, 2_000 * 2 ** retryCount);

export type Outcome =
  | { kind: "stop-offline"; message: string }
  | { kind: "stop-auth"; message: string }
  | { kind: "conflict"; message: string }
  | { kind: "failed"; retryable: boolean; message: string };

/** Table of how each server answer is handled (PD-33). Local records are never deleted by any outcome. */
export function classify(err: unknown): Outcome {
  if (err instanceof NetworkError) return { kind: "stop-offline", message: err.message };
  if (err instanceof ApiError) {
    const s = err.status;
    if (s === 401) return { kind: "stop-auth", message: "Your session expired. Sign in again; your attendance is still saved on this device." };
    if (s === 409) return { kind: "conflict", message: err.message };
    if (s === 403 || s === 404 || s === 422) return { kind: "failed", retryable: false, message: err.message };
    return { kind: "failed", retryable: true, message: err.message }; // 5xx, 408, 429 ...
  }
  return { kind: "failed", retryable: true, message: err instanceof Error ? err.message : "Unknown error" };
}

export interface SyncSummary { synced: number; failed: number; conflicts: number; authExpired: boolean; offline: boolean; skipped: boolean }
const empty = (): SyncSummary => ({ synced: 0, failed: 0, conflicts: 0, authExpired: false, offline: false, skipped: false });

let inflight: Promise<SyncSummary> | null = null;

/**
 * Single-flight sync of one profile's outbox. `force` ignores backoff (manual retry / reconnect).
 * Only items tagged with `profileId` are ever sent.
 */
export function syncOutbox(profileId: string, opts: { send?: Send; force?: boolean; now?: () => number } = {}): Promise<SyncSummary> {
  if (inflight) return inflight.then((s) => ({ ...s, skipped: true }));
  inflight = run(profileId, opts).finally(() => { inflight = null; });
  return inflight;
}

async function run(profileId: string, { send = defaultSend, force = false, now = Date.now }: { send?: Send; force?: boolean; now?: () => number }): Promise<SyncSummary> {
  const db = getDb();
  const out = empty();
  // A previous tab/crash may have left items mid-flight; the server is idempotent so re-sending is safe.
  await db.outbox.where("profileId").equals(profileId).and((i) => i.status === "syncing").modify({ status: "pending" });
  const due = (await db.outbox.where("profileId").equals(profileId).sortBy("createdAt")).filter(
    (i: OutboxItem) => (i.status === "pending" || (i.status === "failed" && i.retryable)) && (force || i.nextRetryAt <= now()),
  );
  for (const item of due) {
    await patchOutbox(item.id, { status: "syncing" });
    try {
      await send(item.payload);
      await patchOutbox(item.id, { status: "synced", syncedAt: now(), lastError: null });
      out.synced++;
    } catch (e) {
      const o = classify(e);
      if (o.kind === "stop-offline") {
        await patchOutbox(item.id, { status: "pending", lastError: o.message });
        out.offline = true;
        break;
      }
      if (o.kind === "stop-auth") {
        await patchOutbox(item.id, { status: "pending", lastError: o.message });
        out.authExpired = true;
        break;
      }
      if (o.kind === "conflict") {
        await patchOutbox(item.id, { status: "conflict", retryable: false, lastError: o.message });
        out.conflicts++;
      } else {
        const retryCount = item.retryCount + 1;
        await patchOutbox(item.id, { status: "failed", retryable: o.retryable, retryCount, nextRetryAt: now() + backoffMs(retryCount), lastError: o.message });
        out.failed++;
      }
    }
  }
  return out;
}
