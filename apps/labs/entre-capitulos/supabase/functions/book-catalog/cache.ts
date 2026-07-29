import type {
  BookCatalogCacheRow,
  BookCatalogCacheWrite,
  CatalogOperation,
  CatalogResponse,
} from "./types.ts";

const HOUR = 60 * 60 * 1_000;

export function cacheTtl(operation: CatalogOperation): number {
  return operation === "work" || operation === "resolve"
    ? 7 * 24 * HOUR
    : 24 * HOUR;
}

export function staleTtl(operation: CatalogOperation): number {
  return operation === "work" || operation === "resolve"
    ? 30 * 24 * HOUR
    : 7 * 24 * HOUR;
}

export function makeCacheWrite(
  cacheKey: string,
  operation: CatalogOperation,
  requestDescriptor: Record<string, unknown>,
  response: CatalogResponse,
  now = new Date(),
): BookCatalogCacheWrite {
  const expiresAt = new Date(now.getTime() + cacheTtl(operation));
  const staleUntil = new Date(expiresAt.getTime() + staleTtl(operation));
  return {
    cache_key: cacheKey,
    operation,
    request_descriptor: requestDescriptor,
    response_payload: {
      ...response,
      fetchedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      stale: false,
    },
    fetched_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    stale_until: staleUntil.toISOString(),
  };
}

export interface CacheHit {
  response: CatalogResponse;
  fresh: boolean;
}

export function readCache(
  row: BookCatalogCacheRow | null,
  now = new Date(),
): CacheHit | null {
  if (!row || !row.response_payload) return null;
  const expiresAt = new Date(row.expires_at).getTime();
  const staleUntil = new Date(row.stale_until).getTime();
  if (
    !Number.isFinite(expiresAt) ||
    !Number.isFinite(staleUntil) ||
    staleUntil <= now.getTime()
  ) {
    return null;
  }
  const fresh = expiresAt > now.getTime();
  return {
    fresh,
    response: {
      ...row.response_payload,
      fetchedAt: row.fetched_at,
      expiresAt: row.expires_at,
      stale: !fresh,
      source: "open_library",
    },
  };
}
