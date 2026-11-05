import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "http://api.test", supabaseUrl: "", supabaseAnonKey: "" } }));

import { AuthTestProvider } from "@/features/auth/auth-provider";
import { OverviewView } from "./overview-view";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function renderView(fetchImpl: () => Promise<Response>, role: "faculty" | "office_admin" = "office_admin") {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(fetchImpl));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const user = { id: "1", role, display_name: "Demo Person", faculty_id: null };
  return render(
    <QueryClientProvider client={client}>
      <AuthTestProvider value={{ state: { status: "authenticated", user }, signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}>
        <OverviewView />
      </AuthTestProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("OverviewView", () => {
  it("shows real numbers from the API for an office admin (INR formatted)", async () => {
    renderView(async () =>
      json({ role: "office_admin", active_students: 41, students_below_75_attendance: 9, students_to_review: 12, outstanding_dues: "1250000.50", open_mentor_tasks: 3 }),
    );
    expect(await screen.findByText("41")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText(/12,50,000\.50/)).toBeInTheDocument();
    expect(screen.getByText("3 open mentor tasks")).toBeInTheDocument();
  });

  it("shows only class metrics (no money) for faculty", async () => {
    renderView(async () => json({ role: "faculty", assigned_classes: 2, sessions_recorded: 14 }), "faculty");
    expect(await screen.findByText("Assigned classes")).toBeInTheDocument();
    expect(screen.queryByText(/dues/i)).not.toBeInTheDocument();
  });

  it("shows a loading state first, then an honest error with retry when the API fails", async () => {
    renderView(async () => json({ error: { code: "internal_error", message: "Something went wrong." } }, 500));
    expect(screen.getByRole("status", { name: /loading overview/i })).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("surfaces a network failure instead of showing fake numbers", async () => {
    renderView(async () => {
      throw new TypeError("fetch failed");
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the server.");
    expect(screen.queryByText("Active students")).not.toBeInTheDocument();
  });
});
