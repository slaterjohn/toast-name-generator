import { defineConfig, devices } from "@playwright/test";

// Runs against the static export (build first: `npm run build`), or against a
// running deployment when E2E_BASE_URL is set, e.g. the Docker container.
const external = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: external ?? "http://localhost:4173" },
  webServer: external ? undefined : {
    command: "node scripts/serve-static.mjs out 4173",
    url: "http://localhost:4173",
    reuseExistingServer: false,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    // Personalised mappings must match across engines.
    { name: "firefox", use: { ...devices["Desktop Firefox"] }, testMatch: /personal\.spec\.ts/ },
    // Playwright's WebKit build crashes on some macOS releases, so it is opt-in
    // (E2E_WEBKIT=1). `npm run test:jsc` checks the same vectors in
    // JavaScriptCore directly.
    ...(process.env.E2E_WEBKIT
      ? [{ name: "webkit", use: { ...devices["Desktop Safari"] }, testMatch: /personal\.spec\.ts/ }]
      : []),
  ],
});
