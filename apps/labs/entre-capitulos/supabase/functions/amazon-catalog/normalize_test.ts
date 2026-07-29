/* global Deno */

import { normalizeAmazonResponse } from "./normalize.ts";
import { assert, assertEquals } from "./testAssertions.ts";

const richFixture = JSON.parse(
  await Deno.readTextFile(new URL("./fixtures/creators-items.json", import.meta.url)),
);
const partialFixture = JSON.parse(
  await Deno.readTextFile(
    new URL("./fixtures/creators-partial.json", import.meta.url),
  ),
);

Deno.test("normalizes offer, Prime deal, third-party seller and formats", () => {
  const now = new Date("2026-07-28T12:00:00.000Z");
  const items = normalizeAmazonResponse("items", richFixture, now);

  assertEquals(items.length, 2);
  assertEquals(items[0].format, "paperback");
  assertEquals(items[0].authors, ["Autora Teste"]);
  assertEquals(items[0].publisher, "Editora Teste");
  assertEquals(items[0].pageCount, 320);
  assertEquals(items[0].isbn10, "6580309311");
  assertEquals(items[0].isbn13, "9786580309313");
  assertEquals(items[0].salesRank, 42);
  assertEquals(items[0].offer?.amount, 39.9);
  assertEquals(items[0].offer?.currency, "BRL");
  assertEquals(items[0].offer?.seller, "Livraria Parceira");
  assertEquals(items[0].offer?.condition, "New");
  assertEquals(items[0].offer?.isPrimeExclusive, true);
  assertEquals(items[0].offer?.savingsPercentage, 33);
  assertEquals(items[0].offer?.expiresAt, "2026-07-28T13:00:00.000Z");
  assertEquals(items[0].expiresAt, "2026-07-29T12:00:00.000Z");
  assertEquals(items[1].format, "kindle");
});

Deno.test("keeps usable partial items and rejects invalid affiliate URLs", () => {
  const items = normalizeAmazonResponse(
    "items",
    partialFixture,
    new Date("2026-07-28T12:00:00.000Z"),
  );
  assertEquals(items.length, 1);
  assertEquals(items[0].asin, "B0PARTIAL1");
  assertEquals(items[0].title, "Livro na Amazon");
  assertEquals(items[0].offer, null);
  assert(items[0].detailPageUrl.includes("amazon.com.br"));
});
