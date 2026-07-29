/* global Deno */

import { makeCacheWrite, readFreshCache } from "./cache.ts";
import { normalizeAmazonResponse } from "./normalize.ts";
import { assertEquals } from "./testAssertions.ts";

const fixture = JSON.parse(
  await Deno.readTextFile(new URL("./fixtures/creators-items.json", import.meta.url)),
);

Deno.test("separates one-hour commerce from 24-hour metadata", () => {
  const now = new Date("2026-07-28T12:00:00.000Z");
  const items = normalizeAmazonResponse("items", fixture, now);
  const write = makeCacheWrite("items:test", "items", items, now);

  assertEquals(write.metadata_expires_at, "2026-07-29T12:00:00.000Z");
  assertEquals(write.commerce_expires_at, "2026-07-28T13:00:00.000Z");
  assertEquals(write.metadata_payload[0].offer, null);
  assertEquals(
    (write.commerce_payload.B0ABC12345.offer)?.amount,
    39.9,
  );
  assertEquals("priceHistory" in write, false);
});

Deno.test("never serves a cache after its volatile block expires", () => {
  const now = new Date("2026-07-28T12:00:00.000Z");
  const items = normalizeAmazonResponse("items", fixture, now);
  const write = makeCacheWrite("items:test", "items", items, now);
  const row = write;

  assertEquals(
    readFreshCache(row, new Date("2026-07-28T12:59:59.000Z"))?.items[0].offer
      ?.amount,
    39.9,
  );
  assertEquals(
    readFreshCache(row, new Date("2026-07-28T13:00:00.000Z")),
    null,
  );
});
