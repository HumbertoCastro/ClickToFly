import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "4187";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "",
      VITE_SUPABASE_ANON_KEY: "",
      VITE_HOUSEHOLD_EMAIL: "",
      VITE_STOREFRONT_PROVIDER: "open_library",
      VITE_BOOK_CATALOG_ENDPOINT: `${baseURL}/__book-catalog-fixture`,
      VITE_AMAZON_CATALOG_MODE: "creators",
      VITE_AMAZON_CATALOG_ENDPOINT: `${baseURL}/__amazon-catalog-fixture`,
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
