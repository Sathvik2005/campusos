import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "http://api.test", supabaseUrl: "", supabaseAnonKey: "" } }));
import { AcademicView } from "./academic-view";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });
const data: Record<string, unknown> = {
  programmes: [{ id: "p1", code: "CSE", name: "B.Tech CSE", duration_years: 4, is_active: true }],
  "academic-years": [{ id: "y1", label: "2026-27", starts_on: "2026-07-01", ends_on: "2027-06-30", is_active: true }],
  batches: [], subjects: [], faculty: [], assignments: [],
};

function setup(post?: () => Response) {
  const f = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    if (init?.method === "POST" && post) return post();
    const key = Object.keys(data).find((k) => url.endsWith(`/${k}`))!;
    return json(data[key]);
  });
  vi.stubGlobal("fetch", f);
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AcademicView />
    </QueryClientProvider>,
  );
  return f;
}
afterEach(() => vi.unstubAllGlobals());

describe("AcademicView", () => {
  it("renders every master-data section from the API", async () => {
    setup();
    expect(await screen.findByRole("heading", { name: "Academic years" })).toBeInTheDocument();
    expect(screen.getByText("2026-27", { selector: "b" })).toBeInTheDocument();
    for (const h of ["Classes", "Subjects", "Faculty", "Teaching assignments"]) expect(screen.getByRole("heading", { name: h })).toBeInTheDocument();
  });

  it("shows the server duplicate (409) message inline", async () => {
    setup(() => json({ error: { code: "conflict", message: "Faculty already exists" } }, 409));
    await screen.findByRole("heading", { name: "Faculty" });
    const form = screen.getByRole("form", { name: "Add faculty" });
    const [name, code, email] = Array.from(form.querySelectorAll("input"));
    await userEvent.type(name, "A B");
    await userEvent.type(code, "E1");
    await userEvent.type(email, "a@b.co");
    await userEvent.click(screen.getByRole("button", { name: "Add faculty" }));
    expect(await screen.findByText("Faculty already exists")).toBeInTheDocument();
  });
});
