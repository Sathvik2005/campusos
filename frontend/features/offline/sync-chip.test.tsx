import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OutboxCounts } from "@/lib/offline/outbox";

const ctx = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("./sync-provider", () => ({ useSync: () => ctx.value }));
import { SyncChip, chipState } from "./sync-chip";

const c = (o: Partial<OutboxCounts> = {}): OutboxCounts => ({ pending: 0, syncing: 0, failed: 0, conflict: 0, synced: 0, ...o });

describe("chipState (priority)", () => {
  it.each([
    [c({ conflict: 1, failed: 1, pending: 1 }), true, "conflict"],
    [c({ failed: 1, pending: 2 }), true, "failed"],
    [c({ syncing: 1, pending: 2 }), true, "syncing"],
    [c({ pending: 2 }), false, "pending"],
    [c(), false, "offline"],
    [c({ synced: 3 }), true, "synced"],
    [c(), true, "online"],
  ])("%#", (counts, online, expected) => expect(chipState(counts, online)).toBe(expected));
});

describe("SyncChip", () => {
  it("shows the real pending count and is a button only when there is something to retry online", () => {
    ctx.value = { counts: c({ pending: 2 }), online: true, authExpired: false, syncNow: vi.fn() };
    render(<SyncChip />);
    expect(screen.getByRole("button", { name: /2 waiting to sync/ })).toBeInTheDocument();
  });

  it("offline with nothing pending is a plain status, not a dead button", () => {
    ctx.value = { counts: c(), online: false, authExpired: false, syncNow: vi.fn() };
    render(<SyncChip />);
    expect(screen.getByRole("status")).toHaveTextContent("Offline · saved");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("tells the user to sign in again when the session expired, keeping the queue", () => {
    ctx.value = { counts: c({ pending: 1 }), online: true, authExpired: true, syncNow: vi.fn() };
    render(<SyncChip />);
    expect(screen.getByRole("status")).toHaveTextContent("Sign in again to sync");
  });
});
