import { expect, test } from "@playwright/test";

// These run against the real Next.js dev server and real FastAPI, WITHOUT Supabase credentials
// (the CI/dev default). Authenticated flows need a Supabase dev project and are not covered here.

test("unauthenticated visit to / is sent to the sign-in page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("protected routes are not reachable without a session", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Revenue")).toHaveCount(0);
});

test("sign-in reports missing configuration honestly and disables the button", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("alert").first()).toContainText("isn't configured");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();
});

test("unknown pages show the not-found page", async ({ page }) => {
  await page.goto("/definitely-not-a-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("browser reaches FastAPI through CORS (real request)", async ({ page }) => {
  await page.goto("/login");
  const result = await page.evaluate(async () => {
    const r = await fetch("http://localhost:8000/ready");
    return { status: r.status, body: await r.json() };
  });
  expect(result.status).toBe(200);
  expect(result.body.database).toBeDefined();
});

for (const width of [1440, 1280, 1024, 768, 390, 360]) {
  test(`sign-in page has no horizontal overflow at ${width}px and tap targets are >= 44px on mobile`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    if (width <= 768) {
      for (const name of ["Email", "Password"]) {
        const box = await page.getByLabel(name).boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
      const btn = await page.getByRole("button", { name: "Sign in" }).boundingBox();
      expect(btn!.height).toBeGreaterThanOrEqual(44);
    }
  });
}
