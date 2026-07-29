import { defineConfig, devices } from "playwright/test";

const localPort = Number(process.env.PLAYWRIGHT_PORT ?? 41_739);
const localBaseUrl = `http://127.0.0.1:${localPort}/`;
const configuredBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = configuredBaseUrl
  ? `${configuredBaseUrl.replace(/\/+$/, "")}/`
  : localBaseUrl;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  timeout: 30_000,
  expect: {
    timeout: 7_500,
  },
  use: {
    baseURL,
    locale: "pt-BR",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: configuredBaseUrl
    ? undefined
    : {
        command: `npm run dev -- --host 127.0.0.1 --port ${localPort} --strictPort`,
        url: localBaseUrl,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
