import { NetworkError } from "@/lib/api/client";
import { getDb } from "./db";

export interface Cached<T> { data: T; fromCache: boolean; cachedAt: number | null }

/**
 * Network first; on success the result is cached in IndexedDB, on NetworkError the last cached copy is used.
 * Keys are namespaced by profile. Only call this for data that is safe to keep on the device (rosters, class lists).
 */
export async function cachedFetch<T>(profileId: string, key: string, fetcher: () => Promise<T>): Promise<Cached<T>> {
  const k = `${profileId}|${key}`;
  try {
    const data = await fetcher();
    const cachedAt = Date.now();
    try { await getDb().meta.put({ key: k, value: data, cachedAt }); } catch { /* cache is best effort */ }
    return { data, fromCache: false, cachedAt };
  } catch (e) {
    if (e instanceof NetworkError) {
      const row = await getDb().meta.get(k);
      if (row) return { data: row.value as T, fromCache: true, cachedAt: row.cachedAt };
    }
    throw e;
  }
}
