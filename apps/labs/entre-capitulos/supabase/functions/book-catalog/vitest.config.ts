import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "supabase/functions/book-catalog/**/*.vitest.test.ts",
    ],
  },
});
