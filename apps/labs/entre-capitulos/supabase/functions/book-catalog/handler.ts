import { makeCacheWrite, readCache } from "./cache.ts";
import type { BookCatalogConfig } from "./config.ts";
import { groupWorkCandidates } from "./identity.ts";
import { validIsbn } from "./isbn.ts";
import {
  OpenLibraryClient,
  OpenLibraryError,
} from "./openLibraryClient.ts";
import {
  cacheKeyForRequest,
  parseCatalogRequest,
  RequestValidationError,
  stableRequestDescriptor,
} from "./request.ts";
import { buildDestinations } from "./retailers.ts";
import {
  type CatalogStore,
  SupabaseStoreError,
} from "./supabaseStore.ts";
import type {
  CatalogEdition,
  CatalogRequest,
  CatalogResponse,
  CatalogWork,
  ResolveCatalogRequest,
  WorkCandidate,
} from "./types.ts";

export interface RuntimeDependencies {
  config: BookCatalogConfig;
  store: CatalogStore;
  openLibrary: OpenLibraryClient;
  now?: () => Date;
}

class CatalogNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogNotFoundError";
  }
}

class CatalogLocalFallbackError extends Error {
  constructor(readonly response: CatalogResponse) {
    super("A cópia bibliográfica local foi usada após uma falha temporária.");
    this.name = "CatalogLocalFallbackError";
  }
}

const inFlightCatalogRequests = new Map<string, Promise<CatalogResponse>>();

function requestOrigin(request: Request): string | null {
  return request.headers.get("origin")?.replace(/\/$/, "") ?? null;
}

function originAllowed(
  request: Request,
  config: BookCatalogConfig,
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

export async function bodyJson(request: Request): Promise<unknown> {
  const maximumBytes = 16_384;
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
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
  } catch (caught) {
    if (bytesRead > maximumBytes) {
      throw new RequestValidationError(
        "O corpo excede o limite de 16 KB.",
      );
    }
    if (caught instanceof RequestValidationError) throw caught;
    throw new RequestValidationError("O corpo deve conter JSON válido.");
  }
}

function publicWork(candidate: WorkCandidate): CatalogWork {
  return {
    workKey: candidate.workKey,
    title: candidate.title,
    authors: candidate.authors,
    firstPublishedYear: candidate.firstPublishedYear,
    description: candidate.description,
    subjects: candidate.subjects,
    languages: candidate.languages,
    coverUrl: candidate.coverUrl,
    editionCount: candidate.editionCount,
    ...(candidate.editorialText !== undefined
      ? { editorialText: candidate.editorialText }
      : {}),
    ...(candidate.badge !== undefined ? { badge: candidate.badge } : {}),
    ...(candidate.featured !== undefined
      ? { featured: candidate.featured }
      : {}),
  };
}

function candidateFor(
  work: CatalogWork,
  identifiers: string[] = [],
): WorkCandidate {
  return {
    ...work,
    sourceWorkKeys: [work.workKey],
    identifiers,
  };
}

function baseResponse(
  operation: CatalogResponse["operation"],
  now: Date,
  fields: Partial<CatalogResponse>,
): CatalogResponse {
  return {
    operation,
    works: [],
    fetchedAt: now.toISOString(),
    expiresAt: now.toISOString(),
    stale: false,
    source: "open_library",
    ...fields,
  };
}

async function searchOperation(
  request: Extract<CatalogRequest, { operation: "search" }>,
  dependencies: RuntimeDependencies,
  now: Date,
): Promise<CatalogResponse> {
  const [result, rules] = await Promise.all([
    dependencies.openLibrary.search(request),
    dependencies.store.getIdentityRules(),
  ]);
  const grouped = groupWorkCandidates(result.works, rules);
  const editionsByWork = new Map<string, CatalogEdition[]>();
  for (const work of grouped) {
    const representativeEditions: CatalogEdition[] = [];
    const seenEditions = new Set<string>();
    for (const sourceKey of new Set([work.workKey, ...work.sourceWorkKeys])) {
      const edition = result.representativeEditions.get(sourceKey);
      if (edition) {
        const identity = edition.isbn13 || edition.isbn10 ||
          edition.editionKey;
        if (!seenEditions.has(identity)) {
          seenEditions.add(identity);
          representativeEditions.push(edition);
        }
      }
    }
    if (representativeEditions.length) {
      editionsByWork.set(work.workKey, representativeEditions);
    }
  }
  await dependencies.store.persistOpenLibraryWorks(grouped, editionsByWork);
  return baseResponse("search", now, {
    works: grouped.map(publicWork),
    pagination: {
      page: request.page,
      pageSize: 18,
      total: result.total,
      hasMore: request.page * 18 < result.total,
    },
  });
}

async function collectionOperation(
  request: Extract<CatalogRequest, { operation: "collection" }>,
  dependencies: RuntimeDependencies,
  now: Date,
): Promise<CatalogResponse> {
  const result = await dependencies.store.getCollection(request.slug);
  if (!result) {
    throw new CatalogNotFoundError("Coleção editorial não encontrada.");
  }
  return baseResponse("collection", now, {
    collection: result.collection,
    works: result.works,
    pagination: {
      page: 1,
      pageSize: result.works.length,
      total: result.works.length,
      hasMore: false,
    },
  });
}

async function workOperation(
  request: Extract<CatalogRequest, { operation: "work" }>,
  dependencies: RuntimeDependencies,
  now: Date,
): Promise<CatalogResponse> {
  const canonicalWorkKey = await dependencies.store.getCanonicalWorkKey(
    request.workKey,
  );
  const local = await dependencies.store.getWork(
    canonicalWorkKey,
    request.editionPage,
  );
  let detail = local;
  if (/^OL[0-9]+W$/.test(request.workKey)) {
    try {
      const external = await dependencies.openLibrary.work(
        request.workKey,
        request.editionPage,
      );
      const canonicalExternalWork = {
        ...external.work,
        workKey: canonicalWorkKey,
      };
      const candidate = {
        ...candidateFor(
          canonicalExternalWork,
          external.editions.flatMap((edition) => [
            edition.isbn10,
            edition.isbn13,
          ]).filter(Boolean),
        ),
        sourceWorkKeys: [...new Set([
          canonicalWorkKey,
          request.workKey,
          external.work.workKey,
        ])],
      };
      await dependencies.store.persistOpenLibraryWorks(
        [candidate],
        new Map([[canonicalWorkKey, external.editions]]),
      );
      const seenEditions = new Set<string>();
      const editions = [
        ...(local?.editions ?? []),
        ...external.editions,
      ].filter((edition) => {
        const identity = edition.isbn13 || edition.isbn10 ||
          edition.editionKey;
        if (seenEditions.has(identity)) return false;
        seenEditions.add(identity);
        return true;
      }).slice(0, 12);
      const totalEditions = Math.max(
        local?.totalEditions ?? 0,
        external.totalEditions +
          (local?.editions.filter((edition) =>
            edition.editionKey.startsWith("manual:")
          ).length ?? 0),
        editions.length,
      );
      detail = {
        work: {
          ...canonicalExternalWork,
          ...(local?.work ?? {}),
          workKey: canonicalWorkKey,
          authors: local?.work.authors.length
            ? local.work.authors
            : external.work.authors,
          description:
            local?.work.description || external.work.description,
          subjects: [...new Set([
            ...(local?.work.subjects ?? []),
            ...external.work.subjects,
          ])],
          languages: [...new Set([
            ...(local?.work.languages ?? []),
            ...external.work.languages,
          ])],
          coverUrl: local?.work.coverUrl || external.work.coverUrl,
          editionCount: totalEditions,
        },
        editions,
        totalEditions,
        memberWorkKeys: [...new Set([
          ...(local?.memberWorkKeys ?? []),
          canonicalWorkKey,
          request.workKey,
        ])],
      };
    } catch (caught) {
      if (
        local &&
        caught instanceof OpenLibraryError &&
        caught.temporary
      ) {
        const links = await dependencies.store.getDirectLinks(
          local.work.workKey,
        );
        throw new CatalogLocalFallbackError({
          ...baseResponse("work", now, {
            works: [local.work],
            work: local.work,
            editions: local.editions,
            destinations: buildDestinations(
              local.work,
              local.editions,
              links,
            ),
            pagination: {
              page: request.editionPage,
              pageSize: 12,
              total: local.totalEditions,
              hasMore: request.editionPage * 12 < local.totalEditions,
            },
          }),
          stale: true,
        });
      }
      if (!(local && caught instanceof OpenLibraryError && caught.status === 404)) {
        throw caught;
      }
    }
  }
  if (!detail) {
    throw new CatalogNotFoundError("Obra não encontrada.");
  }
  const links = await dependencies.store.getDirectLinks(detail.work.workKey);
  return baseResponse("work", now, {
    works: [detail.work],
    work: detail.work,
    editions: detail.editions,
    destinations: buildDestinations(detail.work, detail.editions, links),
    pagination: {
      page: request.editionPage,
      pageSize: 12,
      total: detail.totalEditions,
      hasMore: request.editionPage * 12 < detail.totalEditions,
    },
  });
}

async function localResolveResponse(
  request: ResolveCatalogRequest,
  dependencies: RuntimeDependencies,
  now: Date,
): Promise<CatalogResponse | null> {
  const detail = await dependencies.store.resolveLocal(request);
  if (!detail) return null;
  const links = await dependencies.store.getDirectLinks(detail.work.workKey);
  return baseResponse("resolve", now, {
    works: [detail.work],
    work: detail.work,
    editions: detail.editions,
    destinations: buildDestinations(detail.work, detail.editions, links),
  });
}

async function resolveOperation(
  request: ResolveCatalogRequest,
  dependencies: RuntimeDependencies,
  now: Date,
): Promise<CatalogResponse> {
  const local = await localResolveResponse(request, dependencies, now);
  if (local) return local;

  const legacyIsbn = request.legacyAsin
    ? validIsbn(request.legacyAsin)
    : "";
  const result = await dependencies.openLibrary.resolve({
    isbn: request.isbn ?? (legacyIsbn || undefined),
    title: request.title,
    author: request.author,
  });
  if (!result.work) {
    return baseResponse("resolve", now, {
      work: null,
      editions: [],
      destinations: [],
    });
  }
  const externalWorkKey = result.work.workKey;
  const canonicalWorkKey = await dependencies.store.getCanonicalWorkKey(
    externalWorkKey,
  );
  const canonicalWork = {
    ...result.work,
    workKey: canonicalWorkKey,
    sourceWorkKeys: [...new Set([
      canonicalWorkKey,
      externalWorkKey,
      ...result.work.sourceWorkKeys,
    ])],
  };
  await dependencies.store.persistOpenLibraryWorks(
    [canonicalWork],
    new Map([[canonicalWorkKey, result.editions]]),
  );
  const work = publicWork(canonicalWork);
  const links = await dependencies.store.getDirectLinks(work.workKey);
  return baseResponse("resolve", now, {
    works: [work],
    work,
    editions: result.editions,
    destinations: buildDestinations(work, result.editions, links),
  });
}

async function executeOperation(
  request: CatalogRequest,
  dependencies: RuntimeDependencies,
  now: Date,
): Promise<CatalogResponse> {
  if (request.operation === "search") {
    return searchOperation(request, dependencies, now);
  }
  if (request.operation === "collection") {
    return collectionOperation(request, dependencies, now);
  }
  if (request.operation === "work") {
    return workOperation(request, dependencies, now);
  }
  return resolveOperation(request, dependencies, now);
}

function staleAllowed(caught: unknown): boolean {
  return (
    caught instanceof CatalogLocalFallbackError ||
    (caught instanceof OpenLibraryError && caught.temporary) ||
    caught instanceof SupabaseStoreError
  );
}

function executeWithSingleFlight(
  cacheKey: string,
  request: CatalogRequest,
  descriptor: Record<string, unknown>,
  dependencies: RuntimeDependencies,
  now: Date,
): Promise<CatalogResponse> {
  const existing = inFlightCatalogRequests.get(cacheKey);
  if (existing) return existing;

  const execution = (async () => {
    const response = await executeOperation(request, dependencies, now);
    const cacheWrite = makeCacheWrite(
      cacheKey,
      request.operation,
      descriptor,
      response,
      now,
    );
    await dependencies.store.putCache(cacheWrite);
    return cacheWrite.response_payload;
  })();
  inFlightCatalogRequests.set(cacheKey, execution);
  void execution.finally(() => {
    if (inFlightCatalogRequests.get(cacheKey) === execution) {
      inFlightCatalogRequests.delete(cacheKey);
    }
  }).catch(() => undefined);
  return execution;
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
    const quota = await store.consumeClientQuota(clientKey);
    if (!quota.allowed) {
      return error(
        request,
        429,
        "client_rate_limited",
        "Muitas consultas em pouco tempo. Tente novamente em instantes.",
        quota.retryAfterSeconds ?? 60,
      );
    }

    const catalogRequest = parseCatalogRequest(await bodyJson(request));
    await store.cleanupIfDue(now.getTime()).catch(() => undefined);
    const descriptor = stableRequestDescriptor(catalogRequest);
    const cacheKey = await cacheKeyForRequest(catalogRequest);
    const cached = readCache(await store.getCache(cacheKey), now);
    if (cached?.fresh) return json(request, cached.response);

    try {
      const response = await executeWithSingleFlight(
        cacheKey,
        catalogRequest,
        descriptor,
        dependencies,
        now,
      );
      return json(request, response);
    } catch (caught) {
      if (cached && staleAllowed(caught)) {
        return json(request, cached.response);
      }
      if (caught instanceof CatalogLocalFallbackError) {
        return json(request, caught.response);
      }
      throw caught;
    }
  } catch (caught) {
    if (caught instanceof RequestValidationError) {
      return error(request, 400, caught.code, caught.message);
    }
    if (caught instanceof CatalogNotFoundError) {
      return error(request, 404, "catalog_not_found", caught.message);
    }
    if (caught instanceof OpenLibraryError) {
      if (caught.status === 404) {
        return error(
          request,
          404,
          "open_library_not_found",
          "A obra não foi encontrada na Open Library.",
        );
      }
      if (caught.status === 429) {
        return error(
          request,
          503,
          "open_library_rate_limited",
          "A Open Library limitou temporariamente as consultas.",
          caught.retryAfterSeconds ?? 1,
        );
      }
      return error(
        request,
        caught.status === 408 ? 504 : 502,
        "open_library_unavailable",
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
