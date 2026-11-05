import Dexie, { type Table } from "dexie";

export type Mark = "present" | "absent" | "late";

/** Exactly the body of POST /api/v1/attendance/sync. */
export interface SyncPayload {
  idempotency_key: string;
  batch_id: string;
  subject_id: string;
  held_on: string;
  period: number;
  records: { student_id: string; status: Mark }[];
}

export type OutboxStatus = "pending" | "syncing" | "synced" | "failed" | "conflict";

export interface OutboxItem {
  /** Equals payload.idempotency_key: replay is a server-side no-op. */
  id: string;
  /** Records are tagged so they never sync under a different signed-in profile. */
  profileId: string;
  payload: SyncPayload;
  label: string;
  status: OutboxStatus;
  retryCount: number;
  nextRetryAt: number;
  lastError: string | null;
  /** false for 403/422 and 409: retrying the same payload cannot succeed. */
  retryable: boolean;
  createdAt: number;
  syncedAt: number | null;
}

/** Cached read data (roster, class list) so marking works offline. No tokens, no fee data. */
export interface MetaRow {
  key: string;
  value: unknown;
  cachedAt: number;
}

class CampusDb extends Dexie {
  outbox!: Table<OutboxItem, string>;
  meta!: Table<MetaRow, string>;

  constructor(name = "campusos") {
    super(name);
    this.version(1).stores({ outbox: "id, profileId, status, createdAt", meta: "key" });
  }
}

let db: CampusDb | null = null;
export function getDb(): CampusDb {
  return (db ??= new CampusDb());
}

/** Test helper: forget the cached connection and start from an empty database. */
export async function resetDbForTests() {
  if (db) {
    db.close();
    await Dexie.delete(db.name);
  }
  db = null;
}

/** Simulates closing and reopening the browser: drops the connection but keeps the stored data. */
export function simulateRestart() {
  db?.close();
  db = null;
}
