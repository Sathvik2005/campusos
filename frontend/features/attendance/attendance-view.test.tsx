import "fake-indexeddb/auto";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "http://api.test", supabaseUrl: "", supabaseAnonKey: "" } }));
import { AuthTestProvider } from "@/features/auth/auth-provider";
import { SyncProvider } from "@/features/offline/sync-provider";
import { resetDbForTests } from "@/lib/offline/db";
import { listOutbox } from "@/lib/offline/outbox";
import { AttendanceView, CorrectionPanel } from "./attendance-view";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });
const routes: Record<string, unknown> = {
  assignments: [{ id: "a", faculty_id: "f", subject_id: "s1", batch_id: "b1" }],
  batches: [{ id: "b1", programme_id: "p", academic_year_id: "y", year_of_study: 2, section: "A", is_active: true }],
  subjects: [{ id: "s1", programme_id: "p", code: "DS", name: "Data Structures", credits: 4, is_active: true }],
};
const roster = { batch_id: "b1", subject_id: "s1", students: [
  { id: "st1", roll_number: "ENG-24-CSE-0412", full_name: "Subhashree Mohanty" },
  { id: "st2", roll_number: "ENG-24-CSE-0413", full_name: "Demo Student" },
] };
const synced = () => json({ session_id: "x", created: true, record_count: 2 }, 201);

let online = true;
let syncAnswer: () => Response = synced;
const posts: { idempotency_key: string; records: unknown[] }[] = [];

function stubFetch() {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    if (!online) throw new TypeError("Failed to fetch");
    if (init?.method === "POST") { posts.push(JSON.parse(String(init.body))); return syncAnswer(); }
    if (url.includes("/attendance/roster")) return json(roster);
    return json(routes[Object.keys(routes).find((k) => url.endsWith(`/${k}`))!]);
  }));
}

function mount() {
  const user = { id: "u1", role: "faculty" as const, display_name: "Demo Faculty", faculty_id: "f" };
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthTestProvider value={{ state: { status: "authenticated", user }, signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}>
        <SyncProvider>
          <AttendanceView />
        </SyncProvider>
      </AuthTestProvider>
    </QueryClientProvider>,
  );
}

beforeEach(async () => { online = true; syncAnswer = synced; posts.length = 0; await resetDbForTests(); stubFetch(); });
afterEach(() => vi.unstubAllGlobals());

async function openRoster() {
  await userEvent.selectOptions(await screen.findByLabelText("Class and subject"), "b1|s1");
  await screen.findByText("Subhashree Mohanty");
}
const btn = (student: string, label: string) =>
  Array.from(screen.getByRole("group", { name: `Attendance for ${student}` }).querySelectorAll("button")).find((b) => b.textContent === label)!;

describe("AttendanceView (faculty, offline-first)", () => {
  it("blocks save until everyone is marked; then writes IndexedDB first and syncs the sync-shaped payload", async () => {
    mount();
    await openRoster();
    const save = screen.getByRole("button", { name: "Save attendance" });
    expect(save).toBeDisabled();
    await userEvent.click(btn("Subhashree Mohanty", "Absent"));
    await userEvent.click(screen.getByRole("button", { name: "Mark remaining present" }));
    await userEvent.click(save);
    await screen.findByText(/Saved and synced 2 records/);
    expect(posts).toHaveLength(1);
    expect(posts[0].idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
    expect(posts[0].records).toEqual([{ student_id: "st1", status: "absent" }, { student_id: "st2", status: "present" }]);
    const [item] = await listOutbox("u1");
    expect(item).toMatchObject({ status: "synced", id: posts[0].idempotency_key });
  });

  it("offline: marks from the cached roster are saved on the device and stay pending (nothing lost)", async () => {
    const first = mount();
    await openRoster(); // caches roster + class lists while online
    first.unmount();
    online = false;
    mount();
    await userEvent.selectOptions(await screen.findByLabelText("Class and subject"), "b1|s1");
    expect(await screen.findByText(/Using the roster saved on this device/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mark remaining present" }));
    await userEvent.click(screen.getByRole("button", { name: "Save attendance" }));
    await screen.findByText(/Saved 2 records on this device/);
    expect(posts).toHaveLength(0);
    const [item] = await listOutbox("u1");
    expect(item.status).toBe("pending");
    expect(item.payload.records).toHaveLength(2);
    expect(await screen.findByText("Waiting to sync")).toBeInTheDocument();
  });

  it("explains honestly when offline and the roster was never saved on this device", async () => {
    online = false;
    mount();
    expect(await screen.findByText(/aren.t saved on this device yet/)).toBeInTheDocument();
  });

  it("server failure keeps the local record, shows Failed with a retry that reuses the same key", async () => {
    syncAnswer = () => json({ error: { code: "internal_error", message: "Boom" } }, 500);
    mount();
    await openRoster();
    await userEvent.click(screen.getByRole("button", { name: "Mark remaining present" }));
    await userEvent.click(screen.getByRole("button", { name: "Save attendance" }));
    await screen.findByText(/Saved 2 records on this device/);
    expect(await screen.findByText("Failed")).toBeInTheDocument();
    syncAnswer = synced;
    await userEvent.click(screen.getByRole("button", { name: "Retry now" }));
    await waitFor(async () => expect((await listOutbox("u1"))[0].status).toBe("synced"));
    expect(posts.length).toBeGreaterThanOrEqual(2);
    expect(new Set(posts.map((p) => p.idempotency_key)).size).toBe(1);
  });

  it("409 conflict is shown for review and the local marks are kept", async () => {
    syncAnswer = () => json({ error: { code: "conflict", message: "Attendance already recorded for this class and period" } }, 409);
    mount();
    await openRoster();
    await userEvent.click(screen.getByRole("button", { name: "Mark remaining present" }));
    await userEvent.click(screen.getByRole("button", { name: "Save attendance" }));
    expect(await screen.findByText("Needs review")).toBeInTheDocument();
    const [item] = await listOutbox("u1");
    expect(item).toMatchObject({ status: "conflict", retryable: false });
    expect(item.payload.records).toHaveLength(2);
  });
});

describe("CorrectionPanel (admin)", () => {
  it("needs a reason before a correction can be saved and sends only changed records", async () => {
    const puts: unknown[] = [];
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === "PUT") { puts.push(JSON.parse(String(init.body))); return json({}); }
      if (url.includes("/students")) return json({ items: [{ id: "st1", full_name: "Subhashree Mohanty", roll_number: "R1" }] });
      return json({ id: "se1", batch_id: "b1", subject_id: "s1", held_on: "2026-11-05", period: 1, records: [{ student_id: "st1", status: "present" }] });
    }));
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <CorrectionPanel session={{ id: "se1", batch_id: "b1", subject_id: "s1", held_on: "2026-11-05", period: 1 }} />
      </QueryClientProvider>,
    );
    const group = await screen.findByRole("group", { name: "Correct Subhashree Mohanty" });
    await userEvent.click(group.querySelectorAll("button")[1]);
    const save = screen.getByRole("button", { name: "Save correction" });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Reason for correction/), "Marked in error");
    await userEvent.click(save);
    await vi.waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0]).toEqual({ reason: "Marked in error", records: [{ student_id: "st1", status: "absent" }] });
  });
});
