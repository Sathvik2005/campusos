import { defineConfig } from "@playwright/test";

// Starts the real FastAPI backend and the Next.js dev server. Requires backend/.venv (see README).
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: { baseURL: "http://localhost:3000", channel: "msedge" }, // system Edge: no browser download needed
  webServer: [
    {
      command: "..\\backend\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --port 8000",
      cwd: "../backend",
      url: "http://localhost:8000/health",
      reuseExistingServer: true,
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      env: { NEXT_PUBLIC_API_BASE_URL: "http://localhost:8000" },
      reuseExistingServer: true,
    },
  ],
});
