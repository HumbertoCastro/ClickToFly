import process from "node:process";
import { describe, expect, it } from "vitest";

import type { BookCatalogConfig } from "./config.ts";
import { OpenLibraryClient } from "./openLibraryClient.ts";

const live = process.env.BOOK_CATALOG_LIVE_SMOKE === "1";

describe.runIf(live)("Open Library live smoke", () => {
  it("loads a canonical work and at most 12 editions", async () => {
    const contact =
      process.env.OPEN_LIBRARY_CONTACT_EMAIL ??
        "feedback@hcwebsolutions.com.br";
    const config: BookCatalogConfig = {
      allowedOrigins: new Set(["http://localhost:5173"]),
      allowNoOrigin: false,
      publicRequestsPerMinute: 60,
      supabaseUrl: "https://unused.invalid",
      supabaseServiceRoleKey: "unused",
      supabaseAnonKey: null,
      openLibraryBaseUrl: "https://openlibrary.org",
      openLibraryContactEmail: contact,
      openLibraryUserAgent: `EntreCapitulos-LiveSmoke/1.0 (${contact})`,
      openLibraryTimeoutMs: 15_000,
    };

    const result = await new OpenLibraryClient(config).work(
      "OL24141556W",
      1,
    );
    expect(result.work.workKey).toBe("OL24141556W");
    expect(result.work.title.toLocaleLowerCase("pt-BR")).toContain(
      "torto arado",
    );
    expect(result.work.authors).toContain("Itamar Vieira Junior");
    expect(result.editions.length).toBeGreaterThan(0);
    expect(result.editions.length).toBeLessThanOrEqual(12);
    expect(result.totalEditions).toBeGreaterThanOrEqual(
      result.editions.length,
    );
  }, 30_000);
});
