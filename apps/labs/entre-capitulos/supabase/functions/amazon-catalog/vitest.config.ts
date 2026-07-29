import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "supabase/functions/amazon-catalog/amazonCatalog.vitest.test.ts",
    ],
  },
});
