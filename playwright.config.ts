import { defineConfig, devices } from "@playwright/test";
import { generateOutputs } from "./e2e/generate";

// Tests run against the exported files, not the editor preview. Writes skip unchanged files,
// so it's safe that this runs in every Playwright process.
generateOutputs();

const port = 3100;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${port}`, locale: "en-US" },
  webServer: {
    command: `pnpm dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
