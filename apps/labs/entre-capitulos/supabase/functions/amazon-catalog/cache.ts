import {
  COMMERCE_TTL_MS,
  METADATA_TTL_MS,
} from "./normalize.ts";
import type {
  AmazonCacheRow,
  AmazonCatalogItem,
  AmazonOperation,
  CacheWrite,
  CommerceCacheValue,
} from "./types.ts";

function future(value: string | null, now: Date): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > now.getTime();
}

function earliestCommerceExpiry(
  items: AmazonCatalogItem[],
  fallback: Date,
): Date {
  const expiries = items.flatMap((item) => [
    item.offer?.expiresAt,
    item.salesRankExpiresAt,
  ]).filter((value): value is string => !!value)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);
  return new Date(expiries.length ? Math.min(fallback.getTime(), ...expiries) : fallback);
}

export function makeCacheWrite(
  cacheKey: string,
  operation: AmazonOperation,
  items: AmazonCatalogItem[],
  fetchedAt = new Date(),
): CacheWrite {
  const metadataExpiry = new Date(fetchedAt.getTime() + METADATA_TTL_MS);
  const commerceExpiry = earliestCommerceExpiry(
    items,
    new Date(fetchedAt.getTime() + COMMERCE_TTL_MS),
  );
  const commerce: Record<string, CommerceCacheValue> = {};
  const metadata = items.map((item) => {
    commerce[item.asin] = {
      offer: item.offer,
      salesRank: item.salesRank,
      salesRankFetchedAt: item.salesRankFetchedAt,
      salesRankExpiresAt: item.salesRankExpiresAt,
    };
    return {
      ...item,
      categories: item.categories.map((category) => ({
        ...category,
        salesRank: null,
      })),
      offer: null,
      salesRank: null,
      salesRankFetchedAt: null,
      salesRankExpiresAt: null,
      fetchedAt: fetchedAt.toISOString(),
      expiresAt: metadataExpiry.toISOString(),
    };
  });

  return {
    cache_key: cacheKey,
    operation,
    metadata_payload: metadata,
    metadata_fetched_at: fetchedAt.toISOString(),
    metadata_expires_at: metadataExpiry.toISOString(),
    commerce_payload: commerce,
    commerce_fetched_at: fetchedAt.toISOString(),
    commerce_expires_at: commerceExpiry.toISOString(),
  };
}

export interface FreshCache {
  items: AmazonCatalogItem[];
  fetchedAt: string;
  expiresAt: string;
}

export function readFreshCache(
  row: AmazonCacheRow | null,
  now = new Date(),
): FreshCache | null {
  if (
    !row ||
    !Array.isArray(row.metadata_payload) ||
    !future(row.metadata_expires_at, now) ||
    !row.commerce_payload ||
    !future(row.commerce_expires_at, now)
  ) {
    return null;
  }

  const commerce = row.commerce_payload as Record<string, CommerceCacheValue>;
  const items = (row.metadata_payload as AmazonCatalogItem[]).map((item) => {
    const volatile = commerce[item.asin];
    return volatile
      ? {
        ...item,
        offer: volatile.offer,
        salesRank: volatile.salesRank,
        salesRankFetchedAt: volatile.salesRankFetchedAt,
        salesRankExpiresAt: volatile.salesRankExpiresAt,
      }
      : item;
  });

  return {
    items,
    fetchedAt: row.commerce_fetched_at ?? row.metadata_fetched_at!,
    expiresAt: row.commerce_expires_at!,
  };
}
