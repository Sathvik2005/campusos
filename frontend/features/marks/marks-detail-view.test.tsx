import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "http://api.test", supabaseUrl: "", supabaseAnonKey: "" } }));
vi.mock("next/link", () => ({ default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a> }));
import { AuthTestProvider } from "@/features/auth/auth-provider";
import { MarksDetailView, validateScore } from "./marks-detail-view";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });
const comp = (lifecycle: string) => ({ id: "c1", subject_id: "s", batch_id: "b", name: "Internal 1", max_marks: "40.00", lifecycle, submitted_at: null, locked_at: null, scores: [{ student_id: "st1", score: "33.00" }] });
const students = { total: 1, page: 1, page_size: 100, items: [{ id: "st1", roll_number: "ENG-24-CSE-0412", full_name: "Subhashree Mohanty", batch_id: "b", year_of_study: 2, status: "active" }] };

function setup(lifecycle: string, role: "faculty" | "office_admin") {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) =>
    url.includes("/audit") ? json([]) : url.includes("/students") ? json(students) : json(comp(lifecycle))));
  const user = { id: "u", role, display_name: "X", faculty_id: role === "faculty" ? "f" : null };
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthTestProvider value={{ state: { status: "authenticated", user }, signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}>
        <MarksDetailView id="c1" />
      </AuthTestProvider>
    </QueryClientProvider>,
  );
}
afterEach(() => vi.unstubAllGlobals());

describe("validateScore", () => {
  it.each([["41", "Max is 40"], ["-1", "Cannot be negative"], ["abc", "Enter a number"], ["3.123", "At most 2 decimals"], ["33.5", null], ["", null]])("%s -> %s", (v, e) => {
    expect(validateScore(v, 40)).toBe(e);
  });
});

describe("MarksDetailView", () => {
  it("lets faculty edit a draft, flags an over-max score inline and disables save", async () => {
    setup("draft", "faculty");
    const input = await screen.findByLabelText("Score for Subhashree Mohanty");
    await userEvent.clear(input);
    await userEvent.type(input, "41");
    expect(await screen.findByText("Max is 40")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save scores" })).toBeDisabled();
  });

  it("shows locked marks read-only with the locked banner and no faculty actions", async () => {
    setup("locked", "faculty");
    expect(await screen.findByText(/Locked\. Scores are final/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Score for Subhashree Mohanty")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit|save/i })).not.toBeInTheDocument();
    expect(await screen.findByText("33.00")).toBeInTheDocument();
  });

  it("requires a reason before an admin can unlock", async () => {
    setup("locked", "office_admin");
    const btn = await screen.findByRole("button", { name: /Unlock/ });
    expect(btn).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Unlock reason"), "Typo in score");
    expect(btn).toBeEnabled();
  });
});
