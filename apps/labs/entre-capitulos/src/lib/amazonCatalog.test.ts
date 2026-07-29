import { describe, expect, it } from "vitest";
import type {
  AmazonCatalogItem,
  AmazonCurrentOffer,
} from "../amazonTypes";
import { amazonBootstrapItems } from "../data/amazonBootstrap";
import {
  amazonCatalogExpirations,
  AmazonCatalogError,
  createAmazonCatalogClient,
  filterAmazonItems,
  getAmazonCatalogConfig,
  getFreshCurrentOffer,
  isAmazonUrl,
  isExpired,
  itemToLibraryBook,
  normalizeAmazonBook,
  recommendAmazonItems,
  sanitizeAmazonCatalogItem,
  sortAmazonItems,
} from "./amazonCatalog";

const NOW = Date.parse("2026-07-28T12:00:00.000Z");
const FETCHED_AT = "2026-07-28T12:00:00.000Z";
const OFFER_EXPIRES_AT = "2026-07-28T13:00:00.000Z";
const METADATA_EXPIRES_AT = "2026-07-29T12:00:00.000Z";
const AFFILIATE_URL =
  "https://www.amazon.com.br/dp/6555320354?tag=entre-capitulos-20&linkCode=ogi";

function currentOffer(
  overrides: Partial<AmazonCurrentOffer> = {},
): AmazonCurrentOffer {
  return {
    priceAmount: 27.9,
    currency: "BRL",
    displayPrice: "R$ 27,90",
    savingsAmount: 12,
    savingsPercentage: 30,
    isPrime: false,
    isAvailable: true,
    availability: "Em estoque",
    seller: "Amazon.com.br",
    condition: "Novo",
    promotion: null,
    fetchedAt: FETCHED_AT,
    expiresAt: OFFER_EXPIRES_AT,
    ...overrides,
  };
}

function catalogItem(
  overrides: Partial<AmazonCatalogItem> = {},
): AmazonCatalogItem {
  const offer = overrides.offer === undefined ? currentOffer() : overrides.offer;
  const detailPageUrl = overrides.detailPageUrl ?? AFFILIATE_URL;
  const asin = overrides.asin ?? "6555320354";
  const format = overrides.format ?? "paperback";

  return {
    asin,
    parentAsin: null,
    source: "amazon.com.br",
    catalogSource: "creators",
    title: "A hora da estrela",
    subtitle: "Edição comemorativa",
    authors: ["Clarice Lispector"],
    publisher: "Rocco",
    publishedDate: "2020-11-16",
    pageCount: 88,
    language: "pt",
    description: "Uma narrativa sobre Macabéa.",
    languages: ["pt"],
    categories: ["Literatura brasileira", "Clássicos"],
    categoryDetails: [
      {
        id: "literatura-brasileira",
        name: "Literatura brasileira",
        path: ["Livros", "Literatura brasileira"],
        searchIndex: "Books",
      },
    ],
    isbn10: asin,
    isbn13: "9786555320350",
    imageUrl: "https://m.media-amazon.com/images/I/example.jpg",
    detailPageUrl,
    searchIndex: "Books",
    format,
    salesRank: 12,
    salesRankCategory: "Literatura brasileira",
    salesRankFetchedAt: FETCHED_AT,
    salesRankExpiresAt: OFFER_EXPIRES_AT,
    featured: false,
    editions: [
      {
        asin,
        format,
        label: "Livro físico",
        detailPageUrl,
        imageUrl: "https://m.media-amazon.com/images/I/example.jpg",
        offer,
        fetchedAt: FETCHED_AT,
        expiresAt: METADATA_EXPIRES_AT,
      },
    ],
    offer,
    fetchedAt: FETCHED_AT,
    expiresAt: METADATA_EXPIRES_AT,
    ...overrides,
  };
}

function creatorsPayload(
  items: unknown[],
  overrides: Record<string, unknown> = {},
) {
  return {
    operation: "search",
    mode: "creators",
    items,
    fetchedAt: FETCHED_AT,
    expiresAt: OFFER_EXPIRES_AT,
    source: "amazon.com.br",
    ...overrides,
  };
}

function jsonResponse(
  payload: unknown,
  status = 200,
  headers: HeadersInit = {},
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function wireItem(overrides: Record<string, unknown> = {}) {
  return {
    asin: "6555320354",
    parentAsin: null,
    title: "A hora da estrela",
    authors: ["Clarice Lispector"],
    publisher: "Rocco",
    publicationDate: "2020-11-16",
    languages: ["pt"],
    format: "paperback",
    categories: [
      {
        id: "literatura-brasileira",
        name: "Literatura brasileira",
        salesRank: 12,
      },
    ],
    imageUrl: "https://m.media-amazon.com/images/I/example.jpg",
    detailPageUrl: AFFILIATE_URL,
    offer: {
      amount: 27.9,
      currency: "BRL",
      displayAmount: "R$ 27,90",
      savingsAmount: 12,
      savingsPercentage: 30,
      seller: "Amazon.com.br",
      availability: "Em estoque",
      isBuyBoxWinner: true,
      isPrimeExclusive: true,
      dealBadge: "Oferta Prime",
      fetchedAt: FETCHED_AT,
      expiresAt: OFFER_EXPIRES_AT,
    },
    salesRank: 12,
    salesRankFetchedAt: FETCHED_AT,
    salesRankExpiresAt: OFFER_EXPIRES_AT,
    source: "creators",
    fetchedAt: FETCHED_AT,
    expiresAt: METADATA_EXPIRES_AT,
    ...overrides,
  };
}

describe("Amazon catalog configuration and safety", () => {
  it("defaults the public Edge Function config to disabled", () => {
    expect(
      getAmazonCatalogConfig({
        VITE_SUPABASE_URL: "https://project.supabase.co/",
        VITE_SUPABASE_ANON_KEY: "public-anon-key",
      }),
    ).toEqual({
      mode: "disabled",
      endpoint:
        "https://project.supabase.co/functions/v1/amazon-catalog",
      headers: {
        apikey: "public-anon-key",
        Authorization: "Bearer public-anon-key",
      },
    });
  });

  it("accepts only HTTPS Amazon Brasil URLs and preserves their contents", () => {
    expect(isAmazonUrl(AFFILIATE_URL)).toBe(true);
    expect(isAmazonUrl("https://amazon.com.br/dp/6555320354")).toBe(true);
    expect(isAmazonUrl("http://www.amazon.com.br/dp/6555320354")).toBe(false);
    expect(isAmazonUrl("https://amazon.com.br.example.com/dp/6555320354")).toBe(
      false,
    );
  });

  it("treats malformed and boundary timestamps as expired", () => {
    expect(isExpired("invalid", NOW)).toBe(true);
    expect(isExpired(FETCHED_AT, NOW)).toBe(true);
    expect(isExpired(OFFER_EXPIRES_AT, NOW)).toBe(false);
  });
});

describe("Amazon catalog normalization and expiration", () => {
  it("normalizes the Creators wire response and leaves the affiliate URL intact", async () => {
    const bodies: string[] = [];
    const fetchImpl: typeof fetch = async (_input, init) => {
      bodies.push(String(init?.body));
      return jsonResponse(creatorsPayload([wireItem()]));
    };
    const client = createAmazonCatalogClient({
      mode: "creators",
      endpoint: "https://project.supabase.co/functions/v1/amazon-catalog",
      headers: {},
      fetchImpl,
      now: () => NOW,
    });

    const result = await client.search({
      query: "Clarice",
      searchIndex: "Books",
      page: 2,
      category: "Literatura brasileira",
    });

    expect(JSON.parse(bodies[0])).toEqual({
      operation: "search",
      query: "Clarice",
      searchIndex: "Books",
      page: 2,
      category: "Literatura brasileira",
    });
    expect(result.items[0]).toMatchObject({
      asin: "6555320354",
      detailPageUrl: AFFILIATE_URL,
      publishedDate: "2020-11-16",
      categories: ["Literatura brasileira"],
      format: "paperback",
      offer: {
        priceAmount: 27.9,
        displayPrice: "R$ 27,90",
        isPrime: true,
        promotion: "Oferta Prime",
      },
    });
  });

  it("removes an expired offer and rank while retaining fresh metadata", () => {
    const item = catalogItem({
      offer: currentOffer({ expiresAt: FETCHED_AT }),
      salesRankExpiresAt: FETCHED_AT,
    });
    const sanitized = sanitizeAmazonCatalogItem(item, NOW);

    expect(sanitized).not.toBeNull();
    expect(sanitized?.offer).toBeNull();
    expect(sanitized?.salesRank).toBeNull();
    expect(getFreshCurrentOffer(sanitized!, NOW)).toBeNull();
  });

  it("removes expired or unbounded Creators metadata", () => {
    expect(
      sanitizeAmazonCatalogItem(
        catalogItem({ expiresAt: FETCHED_AT }),
        NOW,
      ),
    ).toBeNull();
    expect(
      sanitizeAmazonCatalogItem(catalogItem({ expiresAt: null }), NOW),
    ).toBeNull();
  });

  it("never serves an expired cache entry", async () => {
    let clock = NOW;
    let requests = 0;
    const fetchImpl: typeof fetch = async () => {
      requests += 1;
      const suffix = requests === 1 ? "primeira" : "atualizada";
      return jsonResponse(
        creatorsPayload(
          [wireItem({ title: `Edição ${suffix}` })],
          {
            fetchedAt: new Date(clock).toISOString(),
            expiresAt: new Date(clock + 1_000).toISOString(),
          },
        ),
      );
    };
    const client = createAmazonCatalogClient({
      mode: "creators",
      endpoint: "https://project.supabase.co/functions/v1/amazon-catalog",
      headers: {},
      fetchImpl,
      now: () => clock,
    });

    expect((await client.search({ query: "Clarice" })).items[0].title).toBe(
      "Edição primeira",
    );
    clock += 500;
    expect((await client.search({ query: "Clarice" })).items[0].title).toBe(
      "Edição primeira",
    );
    expect(requests).toBe(1);

    clock += 600;
    expect((await client.search({ query: "Clarice" })).items[0].title).toBe(
      "Edição atualizada",
    );
    expect(requests).toBe(2);
  });

  it("does not fall back to stale cache after a rate-limit response", async () => {
    let clock = NOW;
    let requests = 0;
    const fetchImpl: typeof fetch = async () => {
      requests += 1;
      if (requests === 1) {
        return jsonResponse(
          creatorsPayload([wireItem()], {
            expiresAt: new Date(clock + 1_000).toISOString(),
          }),
        );
      }
      return jsonResponse(
        {
          error: {
            code: "rate_limited",
            message: "Limite temporário.",
            retryAfterSeconds: 4,
          },
        },
        429,
      );
    };
    const client = createAmazonCatalogClient({
      mode: "creators",
      endpoint: "https://project.supabase.co/functions/v1/amazon-catalog",
      headers: {},
      fetchImpl,
      now: () => clock,
    });

    await client.search({ query: "Clarice" });
    clock += 1_001;

    await expect(client.search({ query: "Clarice" })).rejects.toMatchObject({
      code: "rate_limited",
      status: 429,
      retryAfterSeconds: 4,
    });
  });

  it("ignores malformed items in a partial response", async () => {
    const fetchImpl: typeof fetch = async () =>
      jsonResponse(
        creatorsPayload([
          wireItem(),
          wireItem({ asin: "invalid" }),
          null,
        ]),
      );
    const client = createAmazonCatalogClient({
      mode: "creators",
      endpoint: "https://project.supabase.co/functions/v1/amazon-catalog",
      headers: {},
      fetchImpl,
      now: () => NOW,
    });

    expect((await client.search({ query: "livro" })).items).toHaveLength(1);
  });
});

describe("Amazon catalog modes and operations", () => {
  it("never falls back to local links when an enabled mode has no endpoint", async () => {
    const client = createAmazonCatalogClient({
      mode: "creators",
      endpoint: "",
      headers: {},
      now: () => NOW,
    });

    await expect(client.search({ query: "livro" })).rejects.toMatchObject({
      code: "missing_endpoint",
    });
  });

  it("uses the SiteStripe bootstrap without inventing prices", async () => {
    const client = createAmazonCatalogClient({
      mode: "sitestripe",
      endpoint: "",
      headers: {},
      now: () => NOW,
      bootstrapItems: amazonBootstrapItems,
    });

    const search = await client.search({ query: "Clarice" });
    expect(search.items).toHaveLength(1);
    expect(search.items[0]).toMatchObject({
      title: "A hora da estrela",
      catalogSource: "sitestripe",
      offer: null,
    });
    expect(isAmazonUrl(search.items[0].detailPageUrl)).toBe(true);

    const byAsin = await client.items(["6555320354"]);
    expect(byAsin.items.map((item) => item.asin)).toEqual(["6555320354"]);
    expect((await client.variations("6555320354")).items).toHaveLength(1);

    const collection = await client.search({ query: "livros" });
    expect(collection.items).toHaveLength(amazonBootstrapItems.length);
  });

  it("loads persisted SiteStripe collections when an Edge Function is configured", async () => {
    let requests = 0;
    const client = createAmazonCatalogClient({
      mode: "sitestripe",
      endpoint: "https://project.supabase.co/functions/v1/amazon-catalog",
      headers: {},
      fetchImpl: async () => {
        requests += 1;
        return jsonResponse(
          creatorsPayload(
            [
              wireItem({
                source: "sitestripe",
                offer: null,
                salesRank: null,
                salesRankFetchedAt: null,
                salesRankExpiresAt: null,
                fetchedAt: FETCHED_AT,
                expiresAt: null,
              }),
            ],
            { mode: "sitestripe", expiresAt: null },
          ),
        );
      },
      now: () => NOW,
    });

    const result = await client.search({ query: "Clarice" });

    expect(requests).toBe(1);
    expect(result.items[0]).toMatchObject({
      catalogSource: "sitestripe",
      offer: null,
      detailPageUrl: AFFILIATE_URL,
    });
  });

  it("returns an explicit empty result when integration is disabled", async () => {
    const client = createAmazonCatalogClient({
      mode: "disabled",
      endpoint: "",
      headers: {},
      now: () => NOW,
    });

    await expect(client.search({ query: "livro" })).resolves.toMatchObject({
      mode: "disabled",
      items: [],
      expiresAt: null,
    });
  });

  it("validates search pages, ASIN batches and variations before requesting", async () => {
    const client = createAmazonCatalogClient({
      mode: "disabled",
      endpoint: "",
      headers: {},
    });

    await expect(client.search({ query: " " })).rejects.toMatchObject({
      code: "invalid_query",
    });
    await expect(
      client.search({ query: "livro", page: 11 }),
    ).rejects.toMatchObject({ code: "invalid_page" });
    await expect(client.items([])).rejects.toMatchObject({
      code: "invalid_asins",
    });
    await expect(client.variations("123")).rejects.toMatchObject({
      code: "invalid_asin",
    });
  });

  it("surfaces authentication failures as typed catalog errors", async () => {
    const client = createAmazonCatalogClient({
      mode: "creators",
      endpoint: "https://project.supabase.co/functions/v1/amazon-catalog",
      headers: {},
      fetchImpl: async () =>
        jsonResponse(
          {
            error: {
              code: "amazon_access_lost",
              message: "Acesso à Creators API indisponível.",
            },
          },
          401,
        ),
    });

    const error = await client
      .items(["6555320354"])
      .catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(AmazonCatalogError);
    expect(error).toMatchObject({
      code: "amazon_access_lost",
      status: 401,
    });
  });
});

describe("Amazon catalog discovery helpers", () => {
  it("collects metadata and commerce expiration boundaries", () => {
    expect(amazonCatalogExpirations([catalogItem()])).toEqual(
      expect.arrayContaining([
        OFFER_EXPIRES_AT,
        METADATA_EXPIRES_AT,
      ]),
    );
  });

  it("filters by text, category, format, price, discount and availability", () => {
    const matching = catalogItem();
    const other = catalogItem({
      asin: "6580309318",
      title: "Torto Arado",
      authors: ["Itamar Vieira Junior"],
      categories: ["Romance"],
      format: "hardcover",
      isbn10: "6580309318",
      detailPageUrl: "https://www.amazon.com.br/dp/6580309318",
      offer: currentOffer({
        priceAmount: 70,
        displayPrice: "R$ 70,00",
        savingsPercentage: 5,
        isAvailable: false,
      }),
      editions: [],
    });

    expect(
      filterAmazonItems(
        [other, matching],
        {
          query: "clarice",
          category: "literatura brasileira",
          formats: ["paperback"],
          minPrice: 20,
          maxPrice: 40,
          minimumDiscountPercentage: 20,
          availableOnly: true,
        },
        NOW,
      ).map((item) => item.asin),
    ).toEqual(["6555320354"]);
  });

  it("sorts prices and discounts while leaving unavailable values last", () => {
    const expensive = catalogItem({
      asin: "6580309318",
      title: "Caro",
      detailPageUrl: "https://www.amazon.com.br/dp/6580309318",
      offer: currentOffer({
        priceAmount: 60,
        displayPrice: "R$ 60,00",
        savingsPercentage: 40,
      }),
      editions: [],
    });
    const noPrice = catalogItem({
      asin: "8535930531",
      title: "Sem preço",
      detailPageUrl: "https://www.amazon.com.br/dp/8535930531",
      offer: null,
      editions: [],
    });
    const cheap = catalogItem({
      asin: "8535933395",
      title: "Barato",
      detailPageUrl: "https://www.amazon.com.br/dp/8535933395",
      offer: currentOffer({
        priceAmount: 20,
        displayPrice: "R$ 20,00",
        savingsPercentage: 10,
      }),
      editions: [],
    });

    expect(
      sortAmazonItems([expensive, noPrice, cheap], "price_asc", NOW).map(
        (item) => item.title,
      ),
    ).toEqual(["Barato", "Caro", "Sem preço"]);
    expect(
      sortAmazonItems([cheap, noPrice, expensive], "discount_desc", NOW).map(
        (item) => item.title,
      ),
    ).toEqual(["Caro", "Barato", "Sem preço"]);
  });

  it("prioritizes shelf interests and then fresh Amazon signals", () => {
    const interestMatch = catalogItem({
      title: "Afinidade",
      featured: false,
      salesRank: null,
      salesRankFetchedAt: null,
      salesRankExpiresAt: null,
    });
    const featured = catalogItem({
      asin: "6580309318",
      title: "Destaque",
      authors: ["Outra pessoa"],
      categories: ["Outra categoria"],
      detailPageUrl: "https://www.amazon.com.br/dp/6580309318",
      featured: true,
      salesRank: 1,
    });

    expect(
      recommendAmazonItems(
        [featured, interestMatch],
        {
          authors: ["Clarice Lispector"],
          categories: ["Literatura brasileira"],
          limit: 1,
        },
        NOW,
      )[0].title,
    ).toBe("Afinidade");
  });

  it("converts an Amazon item into the existing library draft shape", () => {
    const item = catalogItem();
    expect(itemToLibraryBook(item)).toEqual({
      source: "amazon",
      sourceId: "6555320354",
      title: "A hora da estrela",
      subtitle: "Edição comemorativa",
      authors: ["Clarice Lispector"],
      publisher: "Rocco",
      publishedDate: "2020-11-16",
      pageCount: 88,
      language: "pt",
      description: "Uma narrativa sobre Macabéa.",
      categories: ["Literatura brasileira", "Clássicos"],
      isbn10: "6555320354",
      isbn13: "9786555320350",
      coverUrl: "https://m.media-amazon.com/images/I/example.jpg",
    });
    expect(normalizeAmazonBook(item)).toEqual(itemToLibraryBook(item));
  });

  it("keeps the editorial bootstrap free of offers, ranks and fake prices", () => {
    expect(amazonBootstrapItems.length).toBeGreaterThan(0);
    for (const item of amazonBootstrapItems) {
      expect(item.offer).toBeNull();
      expect(item.salesRank).toBeNull();
      expect(item.editions.every((edition) => edition.offer === null)).toBe(
        true,
      );
      expect(isAmazonUrl(item.detailPageUrl)).toBe(true);
    }
  });
});
