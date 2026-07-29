import { CreatorsApiClient, CreatorsApiError } from "./amazonClient.ts";
import { makeCacheWrite, readFreshCache } from "./cache.ts";
import type { AmazonCatalogConfig } from "./config.ts";
import { normalizeAmazonResponse } from "./normalize.ts";
import {
  cacheKeyForRequest,
  parseCatalogRequest,
  RequestValidationError,
} from "./request.ts";
import { SupabaseStore, SupabaseStoreError } from "./supabaseStore.ts";
import type {
  AmazonCatalogResponse,
  AmazonOperation,
} from "./types.ts";

export interface RuntimeDependencies {
  config: AmazonCatalogConfig;
  store: SupabaseStore;
  amazon: CreatorsApiClient | null;
  now?: () => Date;
}

function requestOrigin(request: Request): string | null {
  return request.headers.get("origin")?.replace(/\/$/, "") ?? null;
}

function originAllowed(
  request: Request,
  config: AmazonCatalogConfig,
): boolean {
  const origin = requestOrigin(request);
  return origin
    ? config.allowedOrigins.has(origin)
    : config.allowNoOrigin;
}

function corsHeaders(request: Request): Headers {
  const headers = new Headers({
    "access-control-allow-headers":
      "authorization, apikey, content-type, x-client-info",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
    "cache-control": "no-store",
    vary: "Origin",
  });
  const origin = requestOrigin(request);
  if (origin) headers.set("access-control-allow-origin", origin);
  return headers;
}

function json(
  request: Request,
  body: unknown,
  status = 200,
  retryAfterSeconds?: number,
): Response {
  const headers = corsHeaders(request);
  headers.set("content-type", "application/json; charset=utf-8");
  if (retryAfterSeconds) {
    headers.set("retry-after", String(Math.max(1, retryAfterSeconds)));
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function error(
  request: Request,
  status: number,
  code: string,
  message: string,
  retryAfterSeconds?: number,
): Response {
  return json(request, {
    error: {
      code,
      message,
      ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
    },
  }, status, retryAfterSeconds);
}

function response(
  operation: AmazonOperation,
  mode: AmazonCatalogConfig["mode"],
  items: AmazonCatalogResponse["items"],
  fetchedAt: string,
  expiresAt: string | null,
): AmazonCatalogResponse {
  return {
    operation,
    mode,
    items,
    fetchedAt,
    expiresAt,
    source: "amazon.com.br",
  };
}

export async function bodyJson(request: Request): Promise<unknown> {
  const maximumBytes = 16_384;
  const size = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(size) && size > maximumBytes) {
    throw new RequestValidationError("O corpo excede o limite de 16 KB.");
  }

  const reader = request.body?.getReader();
  if (!reader) {
    throw new RequestValidationError("O corpo deve conter JSON válido.");
  }
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maximumBytes) {
        await reader.cancel();
        throw new RequestValidationError(
          "O corpo excede o limite de 16 KB.",
        );
      }
      chunks.push(value);
    }
    const body = new Uint8Array(bytesRead);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    if (bytesRead > maximumBytes) {
      throw new RequestValidationError("O corpo excede o limite de 16 KB.");
    }
    throw new RequestValidationError("O corpo deve conter JSON válido.");
  }
}

export async function handleCatalogRequest(
  request: Request,
  dependencies: RuntimeDependencies,
): Promise<Response> {
  const { config, store } = dependencies;
  const now = dependencies.now?.() ?? new Date();

  if (!originAllowed(request, config)) {
    return error(
      request,
      403,
      "origin_not_allowed",
      "Origem não autorizada para consultar o catálogo.",
    );
  }
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return error(
      request,
      405,
      "method_not_allowed",
      "Use POST para consultar o catálogo.",
    );
  }

  try {
    const clientKey = await store.resolveClientKey(request);
    const clientQuota = await store.consumeClientQuota(clientKey);
    if (!clientQuota.allowed) {
      return error(
        request,
        429,
        "client_rate_limited",
        "Muitas consultas em pouco tempo. Tente novamente em instantes.",
        clientQuota.retryAfterSeconds ?? 60,
      );
    }

    const catalogRequest = parseCatalogRequest(await bodyJson(request));
    await store.cleanupIfDue(now.getTime()).catch(() => undefined);
    if (config.mode === "disabled") {
      return json(
        request,
        response(
          catalogRequest.operation,
          config.mode,
          [],
          now.toISOString(),
          null,
        ),
      );
    }

    if (config.mode === "sitestripe") {
      const items = await store.getEditorialItems(catalogRequest);
      const fetchedAt = items.length
        ? items.map((item) => item.fetchedAt).sort().at(-1)!
        : now.toISOString();
      return json(
        request,
        response(
          catalogRequest.operation,
          config.mode,
          items,
          fetchedAt,
          null,
        ),
      );
    }

    const cacheKey = await cacheKeyForRequest(catalogRequest);
    const cached = readFreshCache(await store.getCache(cacheKey), now);
    if (cached) {
      return json(
        request,
        response(
          catalogRequest.operation,
          config.mode,
          cached.items,
          cached.fetchedAt,
          cached.expiresAt,
        ),
      );
    }

    const amazonQuota = await store.acquireAmazonQuota();
    if (!amazonQuota.allowed) {
      return error(
        request,
        429,
        "amazon_rate_limited",
        "O limite seguro de consultas à Amazon foi atingido.",
        amazonQuota.retryAfterSeconds ?? 1,
      );
    }

    if (!dependencies.amazon) {
      throw new Error("Cliente Amazon indisponível no modo creators.");
    }
    const raw = await dependencies.amazon.request(catalogRequest);
    const items = normalizeAmazonResponse(
      catalogRequest.operation,
      raw,
      now,
      config.partnerTag!,
    );
    const cacheWrite = makeCacheWrite(
      cacheKey,
      catalogRequest.operation,
      items,
      now,
    );
    await store.putCache(cacheWrite);

    return json(
      request,
      response(
        catalogRequest.operation,
        config.mode,
        items,
        cacheWrite.commerce_fetched_at,
        cacheWrite.commerce_expires_at,
      ),
    );
  } catch (caught) {
    if (caught instanceof RequestValidationError) {
      return error(request, 400, caught.code, caught.message);
    }
    if (caught instanceof CreatorsApiError) {
      if (caught.status === 429) {
        return error(
          request,
          429,
          "amazon_rate_limited",
          caught.message,
          caught.retryAfterSeconds ?? 1,
        );
      }
      if (caught.status === 401 || caught.status === 403) {
        return error(
          request,
          503,
          "amazon_access_unavailable",
          "A integração Amazon precisa ser reautorizada.",
        );
      }
      return error(
        request,
        502,
        "amazon_request_failed",
        caught.message,
        caught.retryAfterSeconds,
      );
    }
    if (caught instanceof SupabaseStoreError) {
      return error(
        request,
        caught.status,
        "catalog_storage_unavailable",
        "O catálogo está temporariamente indisponível.",
      );
    }
    return error(
      request,
      500,
      "internal_error",
      "Não foi possível concluir a consulta.",
    );
  }
}
