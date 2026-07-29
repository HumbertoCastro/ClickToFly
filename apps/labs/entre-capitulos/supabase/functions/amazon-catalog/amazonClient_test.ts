/* global Deno */

import {
  CreatorsApiClient,
  CreatorsApiError,
} from "./amazonClient.ts";
import type { AmazonCatalogConfig } from "./config.ts";
import { parseCatalogRequest } from "./request.ts";
import {
  assert,
  assertEquals,
  assertRejects,
} from "./testAssertions.ts";

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

function response(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

Deno.test("uses OAuth 3.1 and reuses the token until near expiry", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const queue = [
    response({ access_token: "token-1", expires_in: 3600 }),
    response({ itemsResult: { items: [] } }),
    response({ itemsResult: { items: [] } }),
  ];
  const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
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

  assertEquals(calls.length, 3);
  assertEquals(calls[0].url, "https://api.amazon.com/auth/o2/token");
  assertEquals(JSON.parse(String(calls[0].init?.body)), {
    grant_type: "client_credentials",
    client_id: "client",
    client_secret: "secret",
    scope: "creatorsapi::default",
  });
  const apiHeaders = new Headers(calls[1].init?.headers);
  assertEquals(apiHeaders.get("authorization"), "Bearer token-1");
  assertEquals(apiHeaders.get("x-marketplace"), "www.amazon.com.br");
  const apiBody = JSON.parse(String(calls[1].init?.body));
  assertEquals(apiBody.marketplace, "www.amazon.com.br");
  assertEquals(apiBody.partnerTag, "entre-20");
  assertEquals(apiBody.itemIds, ["B0ABC12345"]);
  assert(
    apiBody.resources.includes("offersV2.listings.price"),
    "Creators request must include the supported offer price resource",
  );
  assertEquals(
    apiBody.resources.includes("offersV2.listings.violatesMAP"),
    false,
  );
});

Deno.test("invalidates the token after Amazon returns 401", async () => {
  const urls: string[] = [];
  const queue = [
    response({ access_token: "token-1", expires_in: 3600 }),
    response({ code: "UnauthorizedException" }, 401),
    response({ access_token: "token-2", expires_in: 3600 }),
    response({ itemsResult: { items: [] } }),
  ];
  const fetcher = (async (input: string | URL | Request) => {
    urls.push(String(input));
    return queue.shift()!;
  }) as typeof fetch;
  const client = new CreatorsApiClient(config(), fetcher);
  const request = parseCatalogRequest({
    operation: "items",
    asins: ["B0ABC12345"],
  });

  await assertRejects(
    () => client.request(request),
    (error) => error instanceof CreatorsApiError && error.status === 401,
  );
  await client.request(request);
  assertEquals(
    urls.filter((url) => url.includes("/auth/o2/token")).length,
    2,
  );
});

Deno.test("preserves throttling and access-loss status", async () => {
  for (const status of [429, 403]) {
    const queue = [
      response({ access_token: "token", expires_in: 3600 }),
      response(
        { code: status === 429 ? "ThrottleException" : "AccessDeniedException" },
        status,
        status === 429 ? { "retry-after": "7" } : undefined,
      ),
    ];
    const fetcher = (async () => queue.shift()!) as typeof fetch;
    const client = new CreatorsApiClient(config(), fetcher);
    const request = parseCatalogRequest({
      operation: "variations",
      asin: "B0ABC12345",
    });
    await assertRejects(
      () => client.request(request),
      (error) => {
        assert(error instanceof CreatorsApiError);
        assertEquals(error.status, status);
        if (status === 429) assertEquals(error.retryAfterSeconds, 7);
        return true;
      },
    );
  }
});
