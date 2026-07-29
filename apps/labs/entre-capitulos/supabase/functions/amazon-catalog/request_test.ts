/* global Deno */

import {
  cacheKeyForRequest,
  parseCatalogRequest,
  RequestValidationError,
} from "./request.ts";
import { assert, assertEquals } from "./testAssertions.ts";

Deno.test("validates and normalizes catalog requests", () => {
  assertEquals(parseCatalogRequest({
    operation: "items",
    asins: ["b0abc12345", "B0ABC12345"],
  }), {
    operation: "items",
    searchIndex: "Books",
    page: 1,
    asins: ["B0ABC12345"],
  });

  assertEquals(parseCatalogRequest({
    operation: "search",
    query: "  Torto Arado ",
    searchIndex: "KindleStore",
    page: 2,
  }), {
    operation: "search",
    searchIndex: "KindleStore",
    page: 2,
    query: "Torto Arado",
  });
});

Deno.test("rejects invalid ASINs and batches above ten", () => {
  for (const body of [
    { operation: "items", asins: ["not-an-asin"] },
    {
      operation: "items",
      asins: Array.from({ length: 11 }, (_, index) =>
        `B${String(index).padStart(9, "0")}`
      ),
    },
    { operation: "variations", asin: "short" },
  ]) {
    try {
      parseCatalogRequest(body);
      throw new Error("Request should have failed");
    } catch (error) {
      assert(error instanceof RequestValidationError);
    }
  }
});

Deno.test("uses a stable cache key for ASIN batches", async () => {
  const left = parseCatalogRequest({
    operation: "items",
    asins: ["B0ABC12345", "B0KINDLE12"],
  });
  const right = parseCatalogRequest({
    operation: "items",
    asins: ["B0KINDLE12", "B0ABC12345"],
  });
  assertEquals(await cacheKeyForRequest(left), await cacheKeyForRequest(right));
});
