import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "http://api.test", supabaseUrl: "", supabaseAnonKey: "" } }));
vi.mock("next/link", () => ({ default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a> }));
import { FeeAccountView, validateAmount } from "./fee-account-view";
import { sumDecimal } from "./fees-view";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });
const account = { student_id: "s1", roll_number: "ENG-24-CSE-0420", full_name: "Demo Student", total: "50000.00", paid: "10000.00", outstanding: "40000.00", payments: [] };
const result = { payment: { id: "p", amount: "5000.00", kind: "payment", created_at: "2026-11-05T10:00:00Z" }, receipt: { receipt_number: "RCP-1", amount: "5000.00", notice: "x" }, created: true, outstanding: "35000.00" };

function setup(post: () => Response = () => json(result)) {
  const posts: { idempotency_key: string; amount: string }[] = [];
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_u: string, init?: RequestInit) => {
    if (init?.method === "POST") { posts.push(JSON.parse(String(init.body))); return post(); }
    return json(account);
  }));
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><FeeAccountView studentId="s1" /></QueryClientProvider>);
  return posts;
}
afterEach(() => vi.unstubAllGlobals());

describe("money helpers", () => {
  it("sums decimals exactly", () => expect(sumDecimal(["0.10", "0.20"])).toBe("0.30"));
  it.each([["0", "Amount must be greater than 0"], ["1.234", "Enter an amount with at most 2 decimals"], ["50001", /exceeds the outstanding/], ["5000", null]])("%s", (v, e) => {
    const r = validateAmount(v, 40000);
    if (typeof e === "string" || e === null) expect(r).toBe(e);
    else expect(r).toMatch(e);
  });
});

describe("FeeAccountView", () => {
  it("blocks overpayment inline and disables the button", async () => {
    setup();
    await userEvent.type(await screen.findByLabelText("Amount (INR)"), "50000");
    expect(await screen.findByText(/exceeds the outstanding balance/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record simulated payment" })).toBeDisabled();
  });

  it("records a partial payment in demo mode and shows the receipt", async () => {
    const posts = setup();
    await userEvent.type(await screen.findByLabelText("Amount (INR)"), "5000");
    await userEvent.click(screen.getByRole("button", { name: "Record simulated payment" }));
    expect(await screen.findByText(/Payment recorded in demo mode\. Receipt RCP-1/)).toBeInTheDocument();
    expect(posts[0].idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("reuses the idempotency key when a failed payment is retried", async () => {
    let fail = true;
    const posts = setup(() => (fail ? json({ error: { code: "internal_error", message: "Boom" } }, 500) : json(result)));
    await userEvent.type(await screen.findByLabelText("Amount (INR)"), "5000");
    await userEvent.click(screen.getByRole("button", { name: "Record simulated payment" }));
    await screen.findByText("Boom");
    fail = false;
    await userEvent.click(screen.getByRole("button", { name: "Record simulated payment" }));
    await screen.findByText(/Receipt RCP-1/);
    expect(posts[0].idempotency_key).toBe(posts[1].idempotency_key);
  });
});
