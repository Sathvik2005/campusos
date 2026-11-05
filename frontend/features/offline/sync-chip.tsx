"use client";

import { CloudOff, RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSync } from "./sync-provider";
import type { OutboxCounts } from "@/lib/offline/outbox";

export type ChipState = "conflict" | "failed" | "syncing" | "pending" | "offline" | "synced" | "online";

/** Pure, so the label logic is testable: priority is conflict > failed > syncing > pending > offline > synced > online. */
export function chipState(c: OutboxCounts, online: boolean): ChipState {
  if (c.conflict) return "conflict";
  if (c.failed) return "failed";
  if (c.syncing) return "syncing";
  if (c.pending) return "pending";
  if (!online) return "offline";
  return c.synced ? "synced" : "online";
}

const COPY: Record<ChipState, (c: OutboxCounts) => string> = {
  conflict: (c) => `${c.conflict} need review`,
  failed: (c) => `${c.failed} failed · retry`,
  syncing: () => "Syncing…",
  pending: (c) => `${c.pending} waiting to sync`,
  offline: () => "Offline · saved",
  synced: () => "All synced",
  online: () => "Online",
};
const TONE: Record<ChipState, string> = {
  conflict: "bg-danger-bg text-danger-fg",
  failed: "bg-danger-bg text-danger-fg",
  syncing: "bg-warning-bg text-warning-fg",
  pending: "bg-warning-bg text-warning-fg",
  offline: "bg-black/5 text-ink",
  synced: "bg-positive-bg text-positive-fg",
  online: "bg-positive-bg text-positive-fg",
};

/** Reads navigator connectivity and the live IndexedDB outbox. Only actionable states render as a button. */
export function SyncChip() {
  const { counts, online, authExpired, syncNow } = useSync();
  const state = chipState(counts, online);
  const label = authExpired ? "Sign in again to sync" : COPY[state](counts);
  const Icon = state === "offline" ? CloudOff : state === "failed" || state === "conflict" || authExpired ? TriangleAlert : RefreshCw;
  const cls = cn("inline-flex min-h-11 min-w-0 items-center gap-2 truncate rounded-full px-3 text-sm font-medium sm:px-4", authExpired ? TONE.failed : TONE[state]);
  const actionable = (state === "failed" || state === "pending") && online && !authExpired;
  const inner = (
    <>
      <Icon size={14} aria-hidden className={state === "syncing" ? "animate-spin" : undefined} />
      {label}
    </>
  );
  return actionable ? (
    <button type="button" data-testid="sync-chip" data-state={state} aria-live="polite" onClick={() => void syncNow(true)} className={cls}>
      {inner}
    </button>
  ) : (
    <span role="status" data-testid="sync-chip" data-state={authExpired ? "auth" : state} className={cls}>
      {inner}
    </span>
  );
}
