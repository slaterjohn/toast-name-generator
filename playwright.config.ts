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
  ],
});
