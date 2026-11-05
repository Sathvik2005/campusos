import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "http://api.test", supabaseUrl: "", supabaseAnonKey: "" } }));
vi.mock("next/link", () => ({ default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a> }));

import { StudentsView } from "./students-view";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const batch = { id: "b1", programme_id: "p", academic_year_id: "y", year_of_study: 2, section: "A", is_active: true };
const sample = { id: "s1", roll_number: "ENG-24-CSE-0412", full_name: "Subhashree Mohanty", batch_id: "b1", year_of_study: 2, status: "active" };

function setup(students: unknown[] = [sample]) {
  const fetchMock = vi.fn().mockImplementation(async (url: string) =>
    url.includes("/batches") ? json([batch]) : json({ total: students.length, page: 1, page_size: 25, items: students }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <StudentsView />
    </QueryClientProvider>,
  );
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("StudentsView", () => {
  it("lists real rows with roll number and class, linking to the detail page", async () => {
    setup();
    const link = await screen.findByRole("link", { name: /Subhashree Mohanty/ });
    expect(link).toHaveAttribute("href", "/students/s1");
    expect(link).toHaveTextContent("ENG-24-CSE-0412");
    expect(await screen.findByText(/Year 2 · A/, { selector: "span" })).toBeInTheDocument();
  });

  it("sends the search term to the API", async () => {
    const fetchMock = setup();
    await screen.findByRole("link", { name: /Subhashree/ });
    await userEvent.type(screen.getByLabelText("Search students"), "Subh");
    await vi.waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u).includes("q=Subh"))).toBe(true));
  });

  it("shows an empty state when nothing matches", async () => {
    setup([]);
    expect(await screen.findByText("No students found")).toBeInTheDocument();
  });
});
