import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "http://api.test", supabaseUrl: "", supabaseAnonKey: "" } }));
import { InsightsView, riskLabel, riskTone } from "./insights-view";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });
const row = { student_id: "s1", roll_number: "ENG-24-CSE-0420", full_name: "Demo Student", category: "at_risk", confidence: "sufficient", indicators: [{ code: "ATT_LT_75", text: "Attendance is 62.0%, below the 75% threshold." }], attendance_pct: "62.0", internals_score: "14", internals_max: "40", rule_version: "v1" };
const assessment = { ...row, explanation: null, explanation_status: "unavailable", explanation_note: "AI explanation unavailable. Showing the rule-based evidence only.", persisted: false, created_at: null };

function setup() {
  const posts: { url: string; body: unknown }[] = [];
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    if (init?.method === "POST") { posts.push({ url, body: JSON.parse(String(init.body ?? "null")) }); return json({ id: "t1" }, 201); }
    if (url.includes("/at-risk")) return json([row]);
    if (url.includes("/mentor-tasks")) return json([]);
    if (url.includes("/history")) return json([{ ...assessment, id: "h1", created_at: "2026-11-01T10:00:00Z" }]);
    return json(assessment);
  }));
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><InsightsView /></QueryClientProvider>);
  return posts;
}
afterEach(() => vi.unstubAllGlobals());

describe("InsightsView", () => {
  it.each([
    ["at_risk", "sufficient", "High", "danger"],
    ["watch", "limited", "Moderate", "warning"],
    ["on_track", "sufficient", "Low", "positive"],
    ["on_track", "insufficient", "Insufficient data", "neutral"],
  ])("maps %s/%s to %s", (c, conf, label, tone) => {
    expect(riskLabel(c, conf)).toBe(label);
    expect(riskTone(c, conf)).toBe(tone);
  });

  it("shows rule evidence and a deterministic fallback when AI is unavailable", async () => {
    setup();
    await userEvent.click(await screen.findByRole("button", { name: /Demo Student/ }));
    expect(await screen.findByText(/below the 75% threshold/)).toBeInTheDocument();
    expect(await screen.findByText(/AI explanation unavailable/)).toBeInTheDocument();
    expect(await screen.findByText(/Past calculations/)).toBeInTheDocument();
  });

  it("creates a mentor task only after the admin approves the form", async () => {
    const posts = setup();
    await userEvent.click(await screen.findByRole("button", { name: /Demo Student/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Create mentor task" }));
    expect(posts).toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "Approve and create task" }));
    await vi.waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0].url).toContain("/mentor-tasks");
    expect(posts[0].body).toMatchObject({ student_id: "s1", title: "Follow up with Demo Student" });
  });
});
