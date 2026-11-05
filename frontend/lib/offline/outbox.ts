import { liveQuery } from "dexie";
import { getDb, type OutboxItem, type SyncPayload } from "./db";

export class DuplicateLocalSessionError extends Error {
  constructor() {
    super("This class and period is already saved on this device for that date. Wait for it to sync, or open it from the list.");
    this.name = "DuplicateLocalSessionError";
  }
}

export const buildSyncPayload = (a: {
  key: string; batchId: string; subjectId: string; heldOn: string; period: number; marks: Record<string, "present" | "absent" | "late">;
}): SyncPayload => ({
  idempotency_key: a.key,
  batch_id: a.batchId,
  subject_id: a.subjectId,
  held_on: a.heldOn,
  period: a.period,
  records: Object.entries(a.marks).map(([student_id, status]) => ({ student_id, status })),
});

/** Write to IndexedDB first (one transaction). Nothing here touches the network. */
export async function enqueue(profileId: string, payload: SyncPayload, label: string): Promise<OutboxItem> {
  const db = getDb();
  return db.transaction("rw", db.outbox, async () => {
    const same = await db.outbox
      .where("profileId").equals(profileId)
      .filter((i) => i.payload.batch_id === payload.batch_id && i.payload.subject_id === payload.subject_id
        && i.payload.held_on === payload.held_on && i.payload.period === payload.period && i.status !== "conflict")
      .first();
    if (same && same.id !== payload.idempotency_key) throw new DuplicateLocalSessionError();
    const item: OutboxItem = {
      id: payload.idempotency_key, profileId, payload, label, status: "pending", retryCount: 0,
      nextRetryAt: 0, lastError: null, retryable: true, createdAt: Date.now(), syncedAt: null,
    };
    await db.outbox.put(item);
    return item;
  });
}

export const listOutbox = (profileId: string) =>
  getDb().outbox.where("profileId").equals(profileId).sortBy("createdAt");

export async function patchOutbox(id: string, patch: Partial<OutboxItem>) {
  await getDb().outbox.update(id, patch);
}

/** Manual retry: make a failed (retryable) item eligible right now. */
export async function requeue(id: string) {
  await getDb().outbox.update(id, { status: "pending", nextRetryAt: 0, lastError: null, retryable: true });
}

/** Summary used by the sync chip. */
export interface OutboxCounts { pending: number; syncing: number; failed: number; conflict: number; synced: number }
export function countOutbox(items: OutboxItem[]): OutboxCounts {
  const c: OutboxCounts = { pending: 0, syncing: 0, failed: 0, conflict: 0, synced: 0 };
  for (const i of items) c[i.status]++;
  return c;
}

/** Subscribe to live changes of this profile's outbox (IndexedDB is the source of truth). */
export function watchOutbox(profileId: string, cb: (items: OutboxItem[]) => void): () => void {
  const sub = liveQuery(() => listOutbox(profileId)).subscribe({ next: cb, error: () => cb([]) });
  return () => sub.unsubscribe();
}
