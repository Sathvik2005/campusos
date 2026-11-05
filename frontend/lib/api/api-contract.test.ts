import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import paths from "./api-paths.json";

/**
 * Contract guard: every `/api/v1/...` path the UI calls must exist on the real backend (api-paths.json is dumped
 * from FastAPI's OpenAPI by backend/tools/dump_api_paths.py). Mocked-fetch tests cannot catch a wrong URL; this can.
 */
const ROOT = path.resolve(__dirname, "..", "..");
const SKIP = new Set(["node_modules", ".next", "e2e"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) out.push(p);
  }
  return out;
}

const templates = (route: string) => new RegExp("^" + route.replace(/\{[^}]+\}/g, "[^/]+") + "$");
const known = (paths as string[]).map((r) => ({ method: r.split(" ")[0], re: templates(r.split(" ")[1]) }));

describe("frontend API calls match the real backend routes", () => {
  const found = new Map<string, string>();
  for (const f of ["features", "lib", "components", "hooks", "app"].flatMap((d) => (fs.existsSync(path.join(ROOT, d)) ? walk(path.join(ROOT, d)) : []))) {
    const src = fs.readFileSync(f, "utf-8");
    for (const m of src.matchAll(/["'`](\/api\/v1\/[^"'`?\s]*)/g)) {
      const norm = m[1].replace(/\$\{[^}]*\}/g, "X");
      found.set(norm, path.relative(ROOT, f));
    }
  }

  it("finds the calls it is supposed to check", () => {
    expect(found.size).toBeGreaterThan(20);
  });

  it.each([...found.entries()])("%s (%s) exists on the backend", (p) => {
    const trimmed = p.replace(/\/$/, "");
    expect(known.some((k) => k.re.test(trimmed)), `${trimmed} is not a backend route`).toBe(true);
  });
});
