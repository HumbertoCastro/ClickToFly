import { describe, expect, it } from "vitest";
import richFixture from "./fixtures/creators-items.json";
import partialFixture from "./fixtures/creators-partial.json";
import {
  buildCreatorsPayload,
  CreatorsApiClient,
  CreatorsApiError,
} from "./amazonClient";
import { makeCacheWrite, readFreshCache } from "./cache";
import {
  readConfig,
  type AmazonCatalogConfig,
} from "./config";
import { bodyJson } from "./handler";
import { normalizeAmazonResponse } from "./normalize";
import {
  parseCatalogRequest,
  RequestValidationError,
} from "./request";
import {
  hasExpectedPartnerTag,
  isEditorialCollectionQuery,
} from "./supabaseStore";

function config(): AmazonCatalogConfig {
  return {
    mode: "creators",
    allowedOrigins: new Set(["http://localhost:5173"]),
    allowNoOrigin: false,
    publicRequestsPerMinute: 60,
    dailyApiLimit: 8640,
    supabaseUrl: "https://project.supabase.co",
    supabaseServiceRoleKey: "service-role",
    supabaseAnonKey: "anon",
    creatorsClientId: "client",
    creatorsClientSecret: "secret",
    partnerTag: "entre-20",
    creatorsTokenUrl: "https://api.amazon.com/auth/o2/token",
    creatorsApiBaseUrl: "https://creatorsapi.amazon",
  };
}

function jsonResponse(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("Amazon catalog edge modules", () => {
  it("defaults to disabled and requires the expected tag for SiteStripe", () => {
    const base = {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    };
    expect(readConfig((name) => base[name as keyof typeof base]).mode).toBe(
      "disabled",
    );
    const explicitSiteStripe: Record<string, string> = {
      ...base,
      AMAZON_CATALOG_MODE: "sitestripe",
    };
    expect(() =>
      readConfig((name) => explicitSiteStripe[name])
    ).toThrow();

    const withTag: Record<string, string> = {
      ...base,
      AMAZON_PARTNER_TAG: "entre-20",
    };
    expect(readConfig((name) => withTag[name]).mode).toBe("sitestripe");
  });

  it("normalizes current offers, partial responses and book metadata", () => {
    const now = new Date("2026-07-28T12:00:00.000Z");
    const items = normalizeAmazonResponse("items", richFixture, now);
    const partial = normalizeAmazonResponse("items", partialFixture, now);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      asin: "B0ABC12345",
      format: "paperback",
      pageCount: 320,
      isbn10: "6580309311",
      isbn13: "9786580309313",
      salesRank: 42,
      offer: {
        amount: 39.9,
        currency: "BRL",
        seller: "Livraria Parceira",
        availability: "IN_STOCK",
        isAvailable: true,
        condition: "New",
        isPrimeExclusive: true,
        savingsPercentage: 33,
      },
    });
    expect(items[1].format).toBe("kindle");
    expect(partial).toHaveLength(1);
    expect(partial[0]).toMatchObject({
      asin: "B0PARTIAL1",
      title: "Livro na Amazon",
      offer: null,
    });
    expect(normalizeAmazonResponse(
      "items",
      richFixture,
      now,
      "outra-tag-20",
    )).toHaveLength(0);

    const mapFixture = structuredClone(richFixture) as unknown as {
      itemsResult: {
        items: Array<{
          offersV2: {
            listings: Array<Record<string, unknown>>;
          };
        }>;
      };
    };
    mapFixture.itemsResult.items[0].offersV2.listings[0].violatesMAP = true;
    expect(
      normalizeAmazonResponse("items", mapFixture, now)[0].offer,
    ).toBeNull();

    const futureDealFixture = structuredClone(
      richFixture,
    ) as typeof mapFixture;
    futureDealFixture.itemsResult.items[0].offersV2.listings[0].dealDetails = {
      accessType: "PRIME_EXCLUSIVE",
      badge: "Oferta futura",
      startTime: "2026-07-28T12:30:00.000Z",
      endTime: "2026-07-28T13:30:00.000Z",
    };
    const beforeDeal = normalizeAmazonResponse(
      "items",
      futureDealFixture,
      now,
    )[0].offer;
    expect(beforeDeal).toMatchObject({
      isPrimeExclusive: false,
      dealBadge: null,
      dealStartsAt: null,
      dealEndsAt: null,
      expiresAt: "2026-07-28T12:30:00.000Z",
    });

    const duringDeal = normalizeAmazonResponse(
      "items",
      futureDealFixture,
      new Date("2026-07-28T12:31:00.000Z"),
    )[0].offer;
    expect(duringDeal).toMatchObject({
      isPrimeExclusive: true,
      dealBadge: "Oferta futura",
      dealStartsAt: "2026-07-28T12:30:00.000Z",
      dealEndsAt: "2026-07-28T13:30:00.000Z",
      expiresAt: "2026-07-28T13:30:00.000Z",
    });
  });

  it("rejects invalid ASINs and batches above ten", () => {
    expect(() => parseCatalogRequest({
      operation: "items",
      asins: ["invalid"],
    })).toThrow(RequestValidationError);
    expect(() => parseCatalogRequest({
      operation: "items",
      asins: Array.from({ length: 11 }, (_, index) =>
        `B${String(index).padStart(9, "0")}`
      ),
    })).toThrow(RequestValidationError);
  });

  it("uses only operation-supported Creators API parameters", () => {
    const search = buildCreatorsPayload(
      parseCatalogRequest({
        operation: "search",
        query: "Clarice Lispector",
      }),
      "entre-20",
    ).body;
    const items = buildCreatorsPayload(
      parseCatalogRequest({
        operation: "items",
        asins: ["B0ABC12345"],
      }),
      "entre-20",
    ).body;
    const variations = buildCreatorsPayload(
      parseCatalogRequest({
        operation: "variations",
        asin: "B0ABC12345",
      }),
      "entre-20",
    ).body;

    expect(search.availability).toBe("Available");
    expect(items).not.toHaveProperty("availability");
    expect(variations).not.toHaveProperty("availability");
    for (const payload of [search, items, variations]) {
      expect(payload.resources).not.toContain(
        "offersV2.listings.violatesMAP",
      );
      expect(payload.resources).toContain("offersV2.listings.price");
    }
  });

  it("rejects a chunked request body above 16 KB", async () => {
    const request = new Request("https://edge.test", {
      method: "POST",
      body: JSON.stringify({ query: "x".repeat(17_000) }),
    });
    request.headers.delete("content-length");

    await expect(bodyJson(request)).rejects.toThrow(
      "O corpo excede o limite de 16 KB.",
    );
  });

  it("treats the bookstore sentinel as an unfiltered editorial query", () => {
    expect(isEditorialCollectionQuery("livro")).toBe(true);
    expect(isEditorialCollectionQuery(" Livros ")).toBe(true);
    expect(isEditorialCollectionQuery("todos")).toBe(true);
    expect(isEditorialCollectionQuery("*")).toBe(true);
    expect(isEditorialCollectionQuery("Torto Arado")).toBe(false);
  });

  it("accepts only the configured SiteStripe partner tag", () => {
    expect(
      hasExpectedPartnerTag(
        "https://www.amazon.com.br/dp/B0ABC12345?tag=entre-20&linkCode=ogi",
        "entre-20",
      ),
    ).toBe(true);
    expect(
      hasExpectedPartnerTag(
        "https://www.amazon.com.br/dp/B0ABC12345?tag=outra-20",
        "entre-20",
      ),
    ).toBe(false);
  });

  it("expires commerce in one hour and metadata in 24 hours", () => {
    const now = new Date("2026-07-28T12:00:00.000Z");
    const items = normalizeAmazonResponse("items", richFixture, now);
    const cache = makeCacheWrite("items:test", "items", items, now);

    expect(cache.commerce_expires_at).toBe("2026-07-28T13:00:00.000Z");
    expect(cache.metadata_expires_at).toBe("2026-07-29T12:00:00.000Z");
    expect(cache.metadata_payload[0].offer).toBeNull();
    expect(cache.metadata_payload[0].categories[0].salesRank).toBeNull();
    expect(cache.commerce_payload.B0ABC12345.offer?.amount).toBe(39.9);
    expect(readFreshCache(
      cache,
      new Date("2026-07-28T12:59:59.000Z"),
    )?.items[0].offer?.amount).toBe(39.9);
    expect(readFreshCache(
      cache,
      new Date("2026-07-28T13:00:00.000Z"),
    )).toBeNull();
    expect(cache).not.toHaveProperty("priceHistory");
  });

  it("uses Creators OAuth 3.1 and reuses a valid token", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const queue = [
      jsonResponse({ access_token: "token-1", expires_in: 3600 }),
      jsonResponse({ itemsResult: { items: [] } }),
      jsonResponse({ itemsResult: { items: [] } }),
    ];
    const fetcher = (async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      calls.push({ url: String(input), init });
      return queue.shift()!;
    }) as typeof fetch;
    const client = new CreatorsApiClient(config(), fetcher, () => 1_000);
    const request = parseCatalogRequest({
      operation: "items",
      asins: ["B0ABC12345"],
    });

    await client.request(request);
    await client.request(request);

    expect(calls).toHaveLength(3);
    expect(calls[0].url).toBe("https://api.amazon.com/auth/o2/token");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      grant_type: "client_credentials",
      client_id: "client",
      client_secret: "secret",
      scope: "creatorsapi::default",
    });
    const headers = new Headers(calls[1].init?.headers);
    expect(headers.get("authorization")).toBe("Bearer token-1");
    expect(headers.get("x-marketplace")).toBe("www.amazon.com.br");
    expect(JSON.parse(String(calls[1].init?.body))).toMatchObject({
      marketplace: "www.amazon.com.br",
      partnerTag: "entre-20",
      itemIds: ["B0ABC12345"],
    });
  });

  it.each([
    [401, "UnauthorizedException"],
    [403, "AccessDeniedException"],
    [429, "ThrottleException"],
  ])("preserves upstream status %i", async (status, code) => {
    const queue = [
      jsonResponse({ access_token: "token", expires_in: 3600 }),
      jsonResponse(
        { code },
        status,
        status === 429 ? { "retry-after": "7" } : undefined,
      ),
    ];
    const client = new CreatorsApiClient(
      config(),
      (async () => queue.shift()!) as typeof fetch,
    );
    const request = parseCatalogRequest({
      operation: "variations",
      asin: "B0ABC12345",
    });

    await expect(client.request(request)).rejects.toMatchObject({
      status,
      ...(status === 429 ? { retryAfterSeconds: 7 } : {}),
    } satisfies Partial<CreatorsApiError>);
  });

  it("drops a rejected token before the following request", async () => {
    const urls: string[] = [];
    const queue = [
      jsonResponse({ access_token: "token-1", expires_in: 3600 }),
      jsonResponse({ code: "UnauthorizedException" }, 401),
      jsonResponse({ access_token: "token-2", expires_in: 3600 }),
      jsonResponse({ itemsResult: { items: [] } }),
    ];
    const client = new CreatorsApiClient(
      config(),
      (async (input: string | URL | Request) => {
        urls.push(String(input));
        return queue.shift()!;
      }) as typeof fetch,
    );
    const request = parseCatalogRequest({
      operation: "items",
      asins: ["B0ABC12345"],
    });

    await expect(client.request(request)).rejects.toBeInstanceOf(
      CreatorsApiError,
    );
    await client.request(request);
    expect(urls.filter((url) => url.includes("/auth/o2/token"))).toHaveLength(2);
  });
});
