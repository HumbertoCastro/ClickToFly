import { describe, expect, it } from "vitest";
import { createDemoBookCatalogClient } from "./catalogDemo";

describe("demo catalog resolution", () => {
  it("does not turn an unknown legacy identifier into the first fixture", async () => {
    const catalog = createDemoBookCatalogClient();

    await expect(
      catalog.resolve({ legacyAsin: "UNKNOWN001" }),
    ).resolves.toMatchObject({
      work: null,
      works: [],
      editions: [],
      destinations: [],
    });
  });

  it("returns a typed 404 for an unknown work key", async () => {
    const catalog = createDemoBookCatalogClient();

    await expect(catalog.work("OL999999W")).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    });
  });
});
