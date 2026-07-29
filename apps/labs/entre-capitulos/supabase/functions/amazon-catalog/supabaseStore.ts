import type { AmazonCatalogConfig } from "./config.ts";
import type {
  AmazonCacheRow,
  AmazonCatalogItem,
  AmazonCatalogRequest,
  CacheWrite,
  EditorialCollectionRow,
  EditorialItemRow,
  RateLimitDecision,
} from "./types.ts";

type Fetcher = typeof fetch;

export class SupabaseStoreError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
    this.name = "SupabaseStoreError";
  }
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function bearerToken(request: Request): string | null {
  const value = request.headers.get("authorization");
  return value?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

function normalizedText(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function isEditorialCollectionQuery(value: string): boolean {
  return new Set(["livro", "livros", "todos", "*"]).has(
    normalizedText(value),
  );
}

export function hasExpectedPartnerTag(
  value: string,
  expectedTag: string,
): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "amazon.com.br" ||
        url.hostname === "www.amazon.com.br") &&
      url.searchParams.get("tag") === expectedTag
    );
  } catch {
    return false;
  }
}

export class SupabaseStore {
  private lastCleanupAt = 0;

  constructor(
    private readonly config: AmazonCatalogConfig,
    private readonly fetcher: Fetcher = fetch,
  ) {
    if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
      throw new SupabaseStoreError(
        "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.",
        503,
      );
    }
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(
        `${this.config.supabaseUrl.replace(/\/$/, "")}${path}`,
        {
          ...init,
          headers: {
            apikey: this.config.supabaseServiceRoleKey,
            authorization: `Bearer ${this.config.supabaseServiceRoleKey}`,
            ...(init.headers ?? {}),
          },
        },
      );
    } catch {
      throw new SupabaseStoreError("Armazenamento interno indisponível.");
    }
    if (!response.ok) {
      throw new SupabaseStoreError(
        `Falha no armazenamento interno (${response.status}).`,
      );
    }
    if (response.status === 204) return undefined as T;
    const content = await response.text();
    return (content ? JSON.parse(content) : undefined) as T;
  }

  private rpc<T>(
    name: string,
    body: Record<string, unknown> = {},
  ): Promise<T> {
    return this.request<T>(`/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async resolveClientKey(request: Request): Promise<string> {
    const token = bearerToken(request);
    if (
      token &&
      this.config.supabaseAnonKey &&
      token !== this.config.supabaseAnonKey
    ) {
      try {
        const response = await this.fetcher(
          `${this.config.supabaseUrl.replace(/\/$/, "")}/auth/v1/user`,
          {
            headers: {
              apikey: this.config.supabaseAnonKey,
              authorization: `Bearer ${token}`,
            },
          },
        );
        if (response.ok) {
          const user = await response.json();
          if (typeof user?.id === "string" && user.id) {
            return sha256(`user:${user.id}`);
          }
        }
      } catch {
        // Fall back to the network identity below.
      }
    }

    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]
      ?.trim();
    const ip = request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-real-ip") ??
      forwarded ??
      "unknown";
    return sha256(`ip:${ip}`);
  }

  consumeClientQuota(
    clientKey: string,
  ): Promise<RateLimitDecision> {
    return this.rpc<RateLimitDecision>("consume_amazon_client_quota", {
      p_client_key: clientKey,
      p_limit: this.config.publicRequestsPerMinute,
      p_window_seconds: 60,
    });
  }

  acquireAmazonQuota(): Promise<RateLimitDecision> {
    return this.rpc<RateLimitDecision>("acquire_amazon_api_quota", {
      p_daily_limit: this.config.dailyApiLimit,
    });
  }

  async cleanupIfDue(now = Date.now()): Promise<void> {
    if (now - this.lastCleanupAt < 5 * 60 * 1000) return;
    await this.rpc("purge_expired_amazon_catalog_cache");
    this.lastCleanupAt = now;
  }

  async getCache(cacheKey: string): Promise<AmazonCacheRow | null> {
    const url = new URL(
      `${this.config.supabaseUrl.replace(/\/$/, "")}/rest/v1/amazon_catalog_cache`,
    );
    url.searchParams.set("cache_key", `eq.${cacheKey}`);
    url.searchParams.set("select", "*");
    url.searchParams.set("limit", "1");
    const rows = await this.request<AmazonCacheRow[]>(
      `${url.pathname}${url.search}`,
    );
    return rows[0] ?? null;
  }

  putCache(value: CacheWrite): Promise<void> {
    return this.request<void>(
      "/rest/v1/amazon_catalog_cache?on_conflict=cache_key",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(value),
      },
    );
  }

  private async editorialRows(): Promise<{
    collections: EditorialCollectionRow[];
    items: EditorialItemRow[];
  }> {
    const [collections, items] = await Promise.all([
      this.request<EditorialCollectionRow[]>(
        "/rest/v1/amazon_editorial_collections" +
          "?active=eq.true&select=id,slug,title,search_index,category,sort_order" +
          "&order=sort_order.asc&limit=100",
      ),
      this.request<EditorialItemRow[]>(
        "/rest/v1/amazon_editorial_items" +
          "?active=eq.true&select=asin,parent_asin,affiliate_url,title,authors," +
          "publisher,publication_date,format,category,sort_order," +
          "updated_at,collection_id&order=sort_order.asc&limit=500",
      ),
    ]);
    return { collections, items };
  }

  async getEditorialItems(
    request: AmazonCatalogRequest,
  ): Promise<AmazonCatalogItem[]> {
    const { collections, items } = await this.editorialRows();
    const byId = new Map(collections.map((collection) => [
      collection.id,
      collection,
    ]));
    const requestedAsins = new Set(request.asins ?? []);
    const query = normalizedText(request.query ?? "");
    const collectionQuery = isEditorialCollectionQuery(request.query ?? "");
    const category = normalizedText(request.category ?? "");

    const filtered = items.filter((item) => {
      const collection = byId.get(item.collection_id);
      if (!collection) return false;
      if (
        !this.config.partnerTag ||
        !hasExpectedPartnerTag(
          item.affiliate_url,
          this.config.partnerTag,
        )
      ) {
        return false;
      }

      if (request.operation === "items") return requestedAsins.has(item.asin);
      if (request.operation === "variations") {
        return item.asin === request.asin || item.parent_asin === request.asin;
      }
      if (collection.search_index !== request.searchIndex) return false;
      const haystack = normalizedText([
        item.title,
        ...item.authors,
        item.category,
        collection.title,
        collection.category,
      ].join(" "));
      return (collectionQuery || haystack.includes(query)) &&
        (!category || haystack.includes(category));
    }).sort((left, right) => {
      const leftCollection = byId.get(left.collection_id)!;
      const rightCollection = byId.get(right.collection_id)!;
      return leftCollection.sort_order - rightCollection.sort_order ||
        left.sort_order - right.sort_order;
    });

    const paged = request.operation === "search"
      ? filtered.slice((request.page - 1) * 10, request.page * 10)
      : filtered.slice(0, 10);

    return paged.map((item) => {
      const collection = byId.get(item.collection_id)!;
      const fetchedAt = item.updated_at;
      const categoryName = item.category || collection.category;
      return {
        asin: item.asin,
        parentAsin: item.parent_asin,
        title: item.title,
        authors: item.authors,
        publisher: item.publisher || null,
        publicationDate: item.publication_date || null,
        languages: ["pt_BR"],
        pageCount: null,
        isbn10: null,
        isbn13: null,
        format: item.format,
        categories: categoryName
          ? [{ id: collection.slug, name: categoryName, salesRank: null }]
          : [],
        imageUrl: null,
        detailPageUrl: item.affiliate_url,
        offer: null,
        salesRank: null,
        salesRankFetchedAt: null,
        salesRankExpiresAt: null,
        variationAttributes: [],
        featured: true,
        source: "sitestripe",
        fetchedAt,
        expiresAt: null,
      };
    });
  }
}
