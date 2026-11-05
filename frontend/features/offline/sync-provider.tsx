"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { useOnline } from "@/hooks/use-online";
import type { OutboxItem } from "@/lib/offline/db";
import { countOutbox, type OutboxCounts, watchOutbox } from "@/lib/offline/outbox";
import { syncOutbox } from "@/lib/offline/sync";

interface SyncCtx {
  profileId: string | null;
  items: OutboxItem[];
  counts: OutboxCounts;
  online: boolean;
  authExpired: boolean;
  /** Run a sync now. force=true ignores backoff (manual retry). */
  syncNow: (force?: boolean) => Promise<void>;
}

const none = countOutbox([]);
const Ctx = createContext<SyncCtx>({ profileId: null, items: [], counts: none, online: true, authExpired: false, syncNow: async () => {} });
export const useSync = () => useContext(Ctx);

const INTERVAL_MS = 30_000;

/**
 * Owns the live view of this profile's IndexedDB outbox and triggers the single-flight sync runner on:
 * mount, `online`, tab becoming visible, a 30s interval, and manual retry. Truth lives in IndexedDB, not React state.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const profileId = state.status === "authenticated" ? state.user.id : null;
  const online = useOnline();
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [authExpired, setAuthExpired] = useState(false);
  const profileRef = useRef(profileId);
  useEffect(() => {
    profileRef.current = profileId;
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;
    return watchOutbox(profileId, setItems);
  }, [profileId]);

  const syncNow = useCallback(async (force = false) => {
    const id = profileRef.current;
    if (!id || (typeof navigator !== "undefined" && !navigator.onLine)) return;
    const r = await syncOutbox(id, { force });
    if (!r.skipped) setAuthExpired(r.authExpired);
  }, []);

  useEffect(() => {
    if (!profileId) return;
    void syncNow();
    const onVisible = () => document.visibilityState === "visible" && void syncNow();
    const onOnline = () => void syncNow(true);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    const t = window.setInterval(() => void syncNow(), INTERVAL_MS);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(t);
    };
  }, [profileId, syncNow]);

  const value = useMemo<SyncCtx>(() => ({ profileId, items, counts: countOutbox(items), online, authExpired, syncNow }), [profileId, items, online, authExpired, syncNow]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
