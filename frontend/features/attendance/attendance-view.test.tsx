import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "http://api.test", supabaseUrl: "", supabaseAnonKey: "" } }));
import { AuthTestProvider } from "@/features/auth/auth-provider";
import { AttendanceView, CorrectionPanel, buildSyncPayload } from "./attendance-view";

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

function setup(sessionPost: () => Response = () => json({ session_id: "x", created: true, record_count: 2 }, 201)) {
  const posts: unknown[] = [];
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    if (init?.method === "POST") { posts.push(JSON.parse(String(init.body))); return sessionPost(); }
    if (url.includes("/attendance/roster")) return json(roster);
    return json(routes[Object.keys(routes).find((k) => url.endsWith(`/${k}`))!]);
  }));
  const user = { id: "u", role: "faculty" as const, display_name: "Demo Faculty", faculty_id: "f" };
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthTestProvider value={{ state: { status: "authenticated", user }, signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}>
        <AttendanceView />
      </AuthTestProvider>
    </QueryClientProvider>,
  );
  return posts;
}
afterEach(() => vi.unstubAllGlobals());

async function openRoster() {
  await userEvent.selectOptions(await screen.findByLabelText("Class and subject"), "b1|s1");
  await screen.findByText("Subhashree Mohanty");
}

describe("AttendanceView (faculty)", () => {
  it("blocks save until everyone is marked, then posts the sync-shaped payload with a client UUID", async () => {
    const posts = setup();
    await openRoster();
    const save = screen.getByRole("button", { name: "Save attendance" });
    expect(save).toBeDisabled();
    await userEvent.click(within("Subhashree Mohanty", "Absent"));
    await userEvent.click(screen.getByRole("button", { name: "Mark remaining present" }));
    expect(save).toBeEnabled();
    await userEvent.click(save);
    await screen.findByText(/Saved 2 records/);
    const body = posts[0] as ReturnType<typeof buildSyncPayload>;
    expect(body.idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.records).toEqual([{ student_id: "st1", status: "absent" }, { student_id: "st2", status: "present" }]);
  });

  it("keeps marks and reuses the same idempotency key when the save fails, then retries", async () => {
    let fail = true;
    const posts = setup(() => (fail ? json({ error: { code: "internal_error", message: "Boom" } }, 500) : json({ session_id: "x", created: true, record_count: 2 }, 201)));
    await openRoster();
    await userEvent.click(screen.getByRole("button", { name: "Mark remaining present" }));
    await userEvent.click(screen.getByRole("button", { name: "Save attendance" }));
    expect(await screen.findByText("Boom")).toBeInTheDocument();
    fail = false;
    await userEvent.click(screen.getByRole("button", { name: "Save attendance" }));
    await screen.findByText(/Saved 2 records/);
    await waitFor(() => expect(posts).toHaveLength(2));
    expect((posts[0] as { idempotency_key: string }).idempotency_key).toBe((posts[1] as { idempotency_key: string }).idempotency_key);
  });
});

function within(student: string, label: string) {
  return screen.getByRole("group", { name: `Attendance for ${student}` }).querySelector(`button:nth-child(${["Present", "Absent", "Late"].indexOf(label) + 1})`) as HTMLElement;
}

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
