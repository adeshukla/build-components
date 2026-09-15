import { defineConfig, devices } from "@playwright/test";
import { generateOutputs } from "./e2e/generate";

// Tests run against the exported files, not the editor preview. Writes skip unchanged files,
// so it's safe that this runs in every Playwright process.
generateOutputs();

// Only one `next dev` can run per project: set E2E_PORT=3000 to reuse a dev server that's already running.
const port = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: { baseURL: `http://localhost:${port}`, locale: "en-US" },
  // Same tests in Chromium, WebKit (Safari's engine) and an emulated iPhone.
  // Playwright's WebKit is close to Safari but not identical; a real iPhone check stays on the manual checklist.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "iphone", use: { ...devices["iPhone 15"] } },
  ],
  webServer: {
    command: `pnpm dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
