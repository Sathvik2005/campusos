/**
 * Captures every screen of the running app (desktop 1440 and phone 390) for both roles, and exercises the
 * offline attendance flow in a real browser (real IndexedDB, real FastAPI, real SQLite data).
 *
 * LOCAL DEMO TOOL: needs `backend/tools/local_demo_server.py` (local test token issuer) and `npm run dev`
 * started with NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321. See docs/screenshots/README.md.
 *
 *   node tools/capture-screens.cjs <tokens.json> <out-dir>
 */
const { createRequire } = require("module");
const path = require("path");
const fs = require("fs");
const req = createRequire(path.join(__dirname, "..", "frontend", "package.json"));
const { chromium } = req("@playwright/test");

const [tokensFile, outDir] = [process.argv[2], process.argv[3]];
const { subs, tokens } = JSON.parse(fs.readFileSync(tokensFile, "utf-8"));
fs.mkdirSync(outDir, { recursive: true });
const WEB = "http://localhost:3000";
const API = "http://localhost:8000";
const SIZES = { desktop: { width: 1440, height: 1300 }, mobile: { width: 390, height: 844 } };
const log = [];
const note = (m) => { console.log(m); log.push(m); };

async function api(role, p) {
  const r = await fetch(API + p, { headers: { Authorization: `Bearer ${tokens[role]}` } });
  if (!r.ok) throw new Error(`${p} -> ${r.status}`);
  return r.json();
}

async function newPage(browser, role, size) {
  const ctx = await browser.newContext({ viewport: SIZES[size], deviceScaleFactor: size === "mobile" ? 2 : 1 });
  const now = Math.floor(Date.now() / 1000);
  const session = {
    access_token: tokens[role], refresh_token: "local-demo", token_type: "bearer", expires_in: 3600, expires_at: now + 3600,
    user: { id: subs[role], aud: "authenticated", role: "authenticated", email: `${role}@demo.campusos.example`, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
  };
  await ctx.addInitScript((s) => { try { localStorage.setItem("sb-localhost-auth-token", JSON.stringify(s)); } catch {} }, session);
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  return { ctx, page };
}

async function settle(page, ms = 700) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

async function shot(page, file) {
  await settle(page);
  // Viewport shots (1440x1300 desktop, 390x844 phone): fixed navigation and sticky bars appear where a user sees them.
  await page.screenshot({ path: path.join(outDir, file), fullPage: false });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  note(`shot ${file}${overflow > 0 ? `  !! horizontal overflow ${overflow}px` : ""}`);
}

async function go(page, p, heading) {
  await page.goto(WEB + p, { waitUntil: "domcontentloaded" });
  if (heading) await page.getByRole("heading", { name: heading }).first().waitFor();
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const sample = (await api("admin", "/api/v1/students?q=Subhashree")).items[0];
  const comps = await api("admin", "/api/v1/marks/assessments");
  const sessions = await api("admin", "/api/v1/attendance/sessions");
  const comp = comps[0];

  const SIZES_TO_RUN = (process.env.SIZES || "desktop,mobile").split(",");
  const ROLES_TO_RUN = (process.env.ROLES || "admin,faculty").split(",");
  for (const size of SIZES_TO_RUN) {
    // ---------------- admin
    if (ROLES_TO_RUN.includes("admin")) {
      const { ctx, page } = await newPage(browser, "admin", size);
      const s = (n) => `${n}-${size}.png`;
      try {
        await go(page, "/dashboard", /Good (morning|afternoon|evening)/); await shot(page, s("a01-admin-overview"));
        await go(page, "/students", "Students"); await page.getByLabel("Search students").fill("Subhashree"); await page.getByRole("link", { name: /Subhashree/ }).first().waitFor(); await shot(page, s("a02-admin-students"));
        await go(page, `/students/${sample.id}`, "Subhashree Mohanty"); await page.getByText("Subhashree Mohanty").first().waitFor(); await shot(page, s("a03-admin-student-detail"));
        await go(page, "/academic", "Academics"); await shot(page, s("a04-admin-academics"));
        await go(page, "/attendance", "Attendance"); await page.getByRole("list", { name: "Sessions" }).waitFor();
        await shot(page, s("a05-admin-attendance-sessions"));
        await page.getByRole("list", { name: "Sessions" }).getByRole("button").first().click();
        await page.getByText("Reason for correction").waitFor();
        await page.getByRole("group", { name: /^Correct / }).first().getByRole("button", { pressed: false }).first().click();
        await page.getByLabel(/Reason for correction/).fill("Teacher confirmed this student arrived late");
        await shot(page, s("a06-admin-attendance-correction"));
        await page.getByRole("button", { name: "Save correction" }).click(); await page.getByText("Correction saved and audited.").waitFor();
        await go(page, "/marks", "Internal marks"); await page.getByRole("list", { name: "Assessments" }).waitFor(); await shot(page, s("a07-admin-marks-list"));
        await go(page, `/marks/${comp.id}`, comp.name); await page.getByRole("table").waitFor(); await shot(page, s("a08-admin-marks-detail"));
        await go(page, "/fees", "Fees"); await page.locator('table:visible, ul[aria-label="Fee accounts"]:visible').first().waitFor(); await shot(page, s("a09-admin-fees-ledger"));
        await go(page, `/fees/${sample.id}`, "Subhashree Mohanty"); await shot(page, s("a10-admin-fee-account"));
        const due = (await api("admin", "/api/v1/fees/accounts?page_size=100")).find((a) => Number(a.outstanding) > 0);
        if (due) { await go(page, `/fees/${due.student_id}`, due.full_name); await page.getByLabel("Amount (INR)").fill("5000"); await shot(page, s("a11-admin-fee-payment-form"));
          await page.getByRole("button", { name: "Record simulated payment" }).click(); await page.getByText(/Payment recorded in demo mode/).waitFor(); await shot(page, s("a11b-admin-fee-payment-receipt")); }
        await go(page, "/insights", "Student insights");
        await page.getByRole("list", { name: "Students to review" }).getByRole("button").first().click();
        await page.getByText("Evidence").first().waitFor(); await shot(page, s("a12-admin-insights-evidence"));
        await page.getByRole("button", { name: "Create mentor task" }).click(); await page.getByRole("form", { name: "New mentor task" }).waitFor(); await shot(page, s("a13-admin-mentor-task-approval"));
        await page.getByRole("button", { name: "Approve and create task" }).click(); await page.getByRole("list", { name: /./ }).last().waitFor(); await settle(page, 1200);
        await go(page, "/audit", "Audit history"); await page.getByRole("list", { name: "Audit events" }).waitFor(); await shot(page, s("a14-admin-audit"));
      } catch (e) { note(`ADMIN ${size} ERROR: ${e.message.split("\n")[0]}`); await page.screenshot({ path: path.join(outDir, `zz-error-admin-${size}.png`) }).catch(() => {}); }
      await ctx.close();
    }
    // ---------------- faculty
    if (ROLES_TO_RUN.includes("faculty")) {
      const { ctx, page } = await newPage(browser, "faculty1", size);
      const s = (n) => `${n}-${size}.png`;
      const periodOnline = size === "desktop" ? "8" : "6";
      const periodOffline = size === "desktop" ? "7" : "5";
      try {
        await go(page, "/dashboard", /Good (morning|afternoon|evening)/); await shot(page, s("f01-faculty-overview"));
        await go(page, "/students", "Students"); await page.getByRole("link").filter({ hasText: "ENG-24" }).first().waitFor(); await shot(page, s("f02-faculty-students"));
        await go(page, "/marks", "Internal marks"); await shot(page, s("f03-faculty-marks-list"));
        const fcomp = (await api("faculty1", "/api/v1/marks/assessments"))[0];
        if (fcomp) { await go(page, `/marks/${fcomp.id}`, fcomp.name); await page.getByRole("table").waitFor(); await shot(page, s("f04-faculty-marks-entry")); }

        // ---- attendance: online save
        await go(page, "/attendance", "Attendance");
        const sel = page.getByLabel("Class and subject");
        await sel.waitFor();
        const opt = await sel.locator("option").nth(1).getAttribute("value");
        await sel.selectOption(opt);
        await page.getByText("not marked").first().waitFor();
        await shot(page, s("f05-faculty-attendance-roster"));
        await page.getByRole("button", { name: "Mark remaining present" }).click();
        await page.getByRole("group").first().getByRole("button", { name: "Absent" }).click();
        await page.getByRole("group").nth(1).getByRole("button", { name: "Late" }).click();
        await shot(page, s("f06-faculty-attendance-marked"));
        await page.getByLabel("Period").selectOption(periodOnline);
        const t0 = Date.now();
        await page.getByRole("button", { name: "Save attendance" }).click();
        await page.getByText(/Saved and synced|Saved \d+ records on this device/).first().waitFor();
        note(`online save visible in ${Date.now() - t0} ms`);
        await shot(page, s("f07-faculty-attendance-synced"));

        // ---- attendance: API unreachable (weak Wi-Fi), reload, reconnect
        await page.getByLabel("Period").selectOption(periodOffline);
        await page.getByRole("button", { name: "Mark remaining present" }).click();
        await page.route(`${API}/**`, (r) => r.abort("internetdisconnected"));
        await page.getByRole("button", { name: "Save attendance" }).click();
        await page.getByText(/Saved \d+ records on this device/).waitFor();
        await shot(page, s("f08-faculty-offline-saved-on-device"));
        const dbBefore = await page.evaluate(() => new Promise((res) => {
          const open = indexedDB.open("campusos");
          open.onsuccess = () => { const tx = open.result.transaction("outbox"); const all = tx.objectStore("outbox").getAll(); all.onsuccess = () => res(all.result.map((i) => ({ status: i.status, period: i.payload.period, n: i.payload.records.length }))); };
          open.onerror = () => res(null);
        }));
        note(`IndexedDB outbox before reload: ${JSON.stringify(dbBefore)}`);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.getByText("Saved on this device").first().waitFor();
        const dbAfter = await page.evaluate(() => new Promise((res) => {
          const open = indexedDB.open("campusos");
          open.onsuccess = () => { const all = open.result.transaction("outbox").objectStore("outbox").getAll(); all.onsuccess = () => res(all.result.map((i) => ({ status: i.status, period: i.payload.period }))); };
        }));
        note(`IndexedDB outbox after reload (API still unreachable): ${JSON.stringify(dbAfter)}`);
        await shot(page, s("f09-faculty-offline-after-reload"));
        await page.unroute(`${API}/**`);
        await page.getByRole("button", { name: /waiting to sync/ }).click();
        await page.getByText("All synced").first().waitFor();
        await shot(page, s("f10-faculty-reconnected-synced"));
        const list = await api("faculty1", "/api/v1/attendance/sessions");
        const same = list.filter((x) => String(x.period) === periodOffline && x.held_on === new Date().toLocaleDateString("en-CA"));
        note(`server sessions for offline period ${periodOffline} today: ${same.length} (expect 1)`);
        // second manual sync must not create a duplicate
        await page.reload({ waitUntil: "domcontentloaded" }); await settle(page, 1500);
        const list2 = await api("faculty1", "/api/v1/attendance/sessions");
        note(`after reload + another sync tick, sessions for that period: ${list2.filter((x) => String(x.period) === periodOffline && x.held_on === new Date().toLocaleDateString("en-CA")).length} (expect 1)`);
      } catch (e) { note(`FACULTY ${size} ERROR: ${e.message.split("\n")[0]}`); await page.screenshot({ path: path.join(outDir, `zz-error-faculty-${size}.png`) }).catch(() => {}); }
      await ctx.close();
    }
  }
  fs.writeFileSync(path.join(outDir, "capture-log.txt"), log.join("\n") + "\n");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
