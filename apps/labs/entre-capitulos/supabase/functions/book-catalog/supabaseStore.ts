import type { BookCatalogConfig } from "./config.ts";
import {
  normalizeAuthor,
  normalizeTitle,
  textSimilarity,
} from "./identity.ts";
import { validIsbn } from "./isbn.ts";
import {
  safeHttpsUrl,
  text,
  texts,
} from "./sanitize.ts";
import { isAllowedRetailerUrl } from "./retailers.ts";
import type {
  BookCatalogCacheRow,
  BookCatalogCacheWrite,
  CatalogCollectionItemRow,
  CatalogCollectionRecord,
  CatalogCollectionRow,
  CatalogEdition,
  CatalogEditionRow,
  CatalogIdentityRuleRow,
  CatalogRetailerLinkRow,
  CatalogWork,
  CatalogWorkDetail,
  CatalogWorkRow,
  DirectRetailerLink,
  IdentityRule,
  RateLimitDecision,
  ResolveCatalogRequest,
  WorkCandidate,
} from "./types.ts";

type Fetcher = typeof fetch;

export interface CatalogStore {
  resolveClientKey(request: Request): Promise<string>;
  consumeClientQuota(clientKey: string): Promise<RateLimitDecision>;
  cleanupIfDue(now?: number): Promise<void>;
  getCache(cacheKey: string): Promise<BookCatalogCacheRow | null>;
  putCache(value: BookCatalogCacheWrite): Promise<void>;
  getIdentityRules(): Promise<IdentityRule[]>;
  getCanonicalWorkKey(workKey: string): Promise<string>;
  getCollection(slug: string): Promise<CatalogCollectionRecord | null>;
  getWork(
    workKey: string,
    editionPage: number,
  ): Promise<CatalogWorkDetail | null>;
  getDirectLinks(workKey: string): Promise<DirectRetailerLink[]>;
  persistOpenLibraryWorks(
    works: WorkCandidate[],
    editionsByWork?: Map<string, CatalogEdition[]>,
  ): Promise<void>;
  resolveLocal(
    request: ResolveCatalogRequest,
  ): Promise<CatalogWorkDetail | null>;
}

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
  return request.headers.get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

function mapWork(
  row: CatalogWorkRow,
  editionCount?: number,
): CatalogWork {
  const storedEditionCount = Number(row.edition_count);
  return {
    workKey: text(row.work_key, 120),
    title: text(row.title, 500),
    authors: texts(row.authors, 20, 300),
    firstPublishedYear:
      Number.isInteger(row.first_published_year)
        ? row.first_published_year
        : null,
    description: text(row.description, 8_000),
    subjects: texts(row.subjects, 50, 300),
    languages: texts(row.languages, 20, 20),
    coverUrl: safeHttpsUrl(row.cover_url),
    editionCount: Math.max(
      0,
      editionCount ??
        (Number.isFinite(storedEditionCount) ? storedEditionCount : 0),
    ),
  };
}

function mapEdition(row: CatalogEditionRow): CatalogEdition {
  const isbn10 = validIsbn(row.isbn_10);
  const isbn13 = validIsbn(row.isbn_13);
  return {
    editionKey: text(row.edition_key, 140),
    isbn10: isbn10.length === 10 ? isbn10 : "",
    isbn13: isbn13.length === 13 ? isbn13 : "",
    publisher: text(row.publisher, 300),
    publishedDate: text(row.published_date, 100),
    language: text(row.language, 20),
    format: text(row.format, 100),
    pageCount:
      Number.isInteger(row.page_count) && Number(row.page_count) > 0
        ? Number(row.page_count)
        : null,
    coverUrl: safeHttpsUrl(row.cover_url),
  };
}

interface CatalogWorkSourceIdentityRow {
  work_key: string;
  source_key: string;
}

interface CanonicalWorkComponent {
  canonicalWorkKey: string;
  memberWorkKeys: string[];
  sourceRows: CatalogWorkSourceIdentityRow[];
}

function identityPair(left: string, right: string): string {
  return [left, right].sort().join("\u0000");
}

function canonicalComponentFor(
  requestedWorkKey: string,
  rules: IdentityRule[],
  sourceRows: CatalogWorkSourceIdentityRow[],
): CanonicalWorkComponent {
  const nodes = new Set<string>([requestedWorkKey]);
  for (const rule of rules) {
    nodes.add(rule.workKeyA);
    nodes.add(rule.workKeyB);
  }
  for (const source of sourceRows) {
    nodes.add(source.work_key);
    nodes.add(source.source_key);
  }

  const parent = new Map([...nodes].map((node) => [node, node]));
  const find = (node: string): string => {
    const current = parent.get(node) ?? node;
    if (current === node) return node;
    const root = find(current);
    parent.set(node, root);
    return root;
  };
  const separatedPairs = new Set(
    rules
      .filter((rule) => rule.action === "separate")
      .map((rule) => identityPair(rule.workKeyA, rule.workKeyB)),
  );
  const membersOf = (root: string): string[] =>
    [...nodes].filter((node) => find(node) === root);
  const union = (left: string, right: string): void => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot === rightRoot) return;
    const leftMembers = membersOf(leftRoot);
    const rightMembers = membersOf(rightRoot);
    if (
      leftMembers.some((leftMember) =>
        rightMembers.some((rightMember) =>
          separatedPairs.has(identityPair(leftMember, rightMember))
        )
      )
    ) {
      return;
    }
    const [root, child] = [leftRoot, rightRoot].sort();
    parent.set(child, root);
  };

  for (
    const source of [...sourceRows].sort((left, right) =>
      `${left.work_key}:${left.source_key}`.localeCompare(
        `${right.work_key}:${right.source_key}`,
      )
    )
  ) {
    union(source.work_key, source.source_key);
  }
  for (
    const rule of rules
      .filter((candidate) => candidate.action === "merge")
      .sort((left, right) =>
        identityPair(left.workKeyA, left.workKeyB).localeCompare(
          identityPair(right.workKeyA, right.workKeyB),
        )
      )
  ) {
    union(rule.workKeyA, rule.workKeyB);
  }

  const requestedRoot = find(requestedWorkKey);
  const memberWorkKeys = membersOf(requestedRoot).sort();
  const ownership = new Map<string, number>();
  for (const source of sourceRows) {
    if (
      memberWorkKeys.includes(source.work_key) &&
      memberWorkKeys.includes(source.source_key)
    ) {
      ownership.set(source.work_key, (ownership.get(source.work_key) ?? 0) + 1);
    }
  }
  const canonicalWorkKey = [...memberWorkKeys].sort((left, right) =>
    (ownership.get(right) ?? 0) - (ownership.get(left) ?? 0) ||
    left.localeCompare(right)
  )[0] ?? requestedWorkKey;

  return {
    canonicalWorkKey,
    memberWorkKeys,
    sourceRows,
  };
}

export class SupabaseStore implements CatalogStore {
  private lastCleanupAt = 0;

  constructor(
    private readonly config: BookCatalogConfig,
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

  private patchRow(
    table: string,
    field: string,
    value: string,
    body: Record<string, unknown>,
  ): Promise<void> {
    if (!Object.keys(body).length) return Promise.resolve();
    const url = new URL(
      `${this.config.supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}`,
    );
    url.searchParams.set(field, `eq.${value}`);
    return this.request<void>(`${url.pathname}${url.search}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });
  }

  private async rows<T>(
    table: string,
    parameters: Record<string, string | number | undefined>,
  ): Promise<T[]> {
    const url = new URL(
      `${this.config.supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}`,
    );
    for (const [key, value] of Object.entries(parameters)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return this.request<T[]>(`${url.pathname}${url.search}`);
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
        // Fall through to the network identity.
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

  consumeClientQuota(clientKey: string): Promise<RateLimitDecision> {
    return this.rpc<RateLimitDecision>(
      "consume_book_catalog_client_quota",
      {
        p_client_key: clientKey,
        p_limit: this.config.publicRequestsPerMinute,
        p_window_seconds: 60,
      },
    );
  }

  async cleanupIfDue(now = Date.now()): Promise<void> {
    if (now - this.lastCleanupAt < 5 * 60 * 1_000) return;
    await this.rpc("purge_expired_book_catalog_cache");
    this.lastCleanupAt = now;
  }

  async getCache(cacheKey: string): Promise<BookCatalogCacheRow | null> {
    const rows = await this.rows<BookCatalogCacheRow>("book_catalog_cache", {
      cache_key: `eq.${cacheKey}`,
      select: "*",
      limit: 1,
    });
    return rows[0] ?? null;
  }

  putCache(value: BookCatalogCacheWrite): Promise<void> {
    return this.request<void>(
      "/rest/v1/book_catalog_cache?on_conflict=cache_key",
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

  async getIdentityRules(): Promise<IdentityRule[]> {
    const rows = await this.rows<CatalogIdentityRuleRow>(
      "catalog_identity_rules",
      {
        active: "eq.true",
        edition_key: "is.null",
        select:
          "action,work_key_a,work_key_b,edition_key,method,confidence",
        order: "work_key_a.asc,work_key_b.asc,action.asc",
        limit: 1_000,
      },
    );
    return rows.map((row) => ({
      action: row.action,
      workKeyA: row.work_key_a,
      workKeyB: row.work_key_b,
      editionKey: row.edition_key,
      method: row.method,
      confidence: Number(row.confidence),
    }));
  }

  private async canonicalComponent(
    workKey: string,
  ): Promise<CanonicalWorkComponent> {
    const [rules, sourceRows] = await Promise.all([
      this.getIdentityRules(),
      this.rows<CatalogWorkSourceIdentityRow>("catalog_work_sources", {
        source: "eq.open_library",
        select: "work_key,source_key",
        order: "work_key.asc,source_key.asc",
        limit: 5_000,
      }),
    ]);
    return canonicalComponentFor(workKey, rules, sourceRows);
  }

  async getCanonicalWorkKey(workKey: string): Promise<string> {
    return (await this.canonicalComponent(workKey)).canonicalWorkKey;
  }

  private allWorks(): Promise<CatalogWorkRow[]> {
    return this.rows<CatalogWorkRow>("catalog_works", {
      select:
        "work_key,title,authors,first_published_year,description,subjects,languages,edition_count,cover_url",
      limit: 1_000,
    });
  }

  private editionsFor(workKey: string): Promise<CatalogEditionRow[]> {
    return this.rows<CatalogEditionRow>("catalog_editions", {
      work_key: `eq.${workKey}`,
      select:
        "edition_key,work_key,isbn_10,isbn_13,publisher,published_date,language,format,page_count,cover_url",
      order: "published_date.desc,edition_key.asc",
      limit: 1_000,
    });
  }

  private editionsForWorks(workKeys: string[]): Promise<CatalogEditionRow[]> {
    if (workKeys.length === 1) return this.editionsFor(workKeys[0]);
    return this.rows<CatalogEditionRow>("catalog_editions", {
      work_key: `in.(${workKeys.join(",")})`,
      select:
        "edition_key,work_key,isbn_10,isbn_13,publisher,published_date,language,format,page_count,cover_url",
      order: "published_date.desc,edition_key.asc",
      limit: 5_000,
    });
  }

  async getCollection(
    slug: string,
  ): Promise<CatalogCollectionRecord | null> {
    const collections = await this.rows<CatalogCollectionRow>(
      "catalog_collections",
      {
        slug: `eq.${slug}`,
        published: "eq.true",
        select:
          "id,slug,title,description,badge,featured,sort_order",
        limit: 1,
      },
    );
    const collection = collections[0];
    if (!collection) return null;
    const [items, workRows, editionRows] = await Promise.all([
      this.rows<CatalogCollectionItemRow>("catalog_collection_items", {
        collection_id: `eq.${collection.id}`,
        select:
          "collection_id,work_key,edition_key,editorial_text,badge,featured,sort_order",
        order: "sort_order.asc",
        limit: 500,
      }),
      this.allWorks(),
      this.rows<CatalogEditionRow>("catalog_editions", {
        select:
          "edition_key,work_key,isbn_10,isbn_13,publisher,published_date,language,format,page_count,cover_url",
        limit: 1_000,
      }),
    ]);
    const worksByKey = new Map(workRows.map((row) => [row.work_key, row]));
    const editionCounts = new Map<string, number>();
    for (const row of editionRows) {
      editionCounts.set(
        row.work_key,
        (editionCounts.get(row.work_key) ?? 0) + 1,
      );
    }
    const works = items.flatMap((item) => {
      const row = worksByKey.get(item.work_key);
      if (!row) return [];
      return [{
        ...mapWork(
          row,
          Math.max(
            Number(row.edition_count) || 0,
            editionCounts.get(row.work_key) ?? 0,
          ),
        ),
        editorialText: text(item.editorial_text, 2_000),
        badge: text(item.badge, 100),
        featured: item.featured,
      }];
    });
    return {
      collection: {
        slug: collection.slug,
        title: text(collection.title, 120),
        description: text(collection.description, 2_000),
        badge: text(collection.badge, 100),
        featured: collection.featured,
      },
      works,
    };
  }

  async getWork(
    workKey: string,
    editionPage: number,
  ): Promise<CatalogWorkDetail | null> {
    const component = await this.canonicalComponent(workKey);
    const [works, editionRows] = await Promise.all([
      this.rows<CatalogWorkRow>("catalog_works", {
        work_key: `in.(${component.memberWorkKeys.join(",")})`,
        select:
          "work_key,title,authors,first_published_year,description,subjects,languages,edition_count,cover_url",
        limit: component.memberWorkKeys.length,
      }),
      this.editionsForWorks(component.memberWorkKeys),
    ]);
    if (!works.length) return null;

    const canonicalRow = works.find(
      (row) => row.work_key === component.canonicalWorkKey,
    ) ?? works.sort((left, right) =>
      left.work_key.localeCompare(right.work_key)
    )[0];
    const aliasesCoveredByCanonical = new Set(
      component.sourceRows
        .filter((row) => row.work_key === component.canonicalWorkKey)
        .map((row) => row.source_key),
    );
    const declaredEditionCount = works.reduce((total, row) => {
      if (row.work_key === canonicalRow.work_key) {
        return total + Math.max(0, Number(row.edition_count) || 0);
      }
      return aliasesCoveredByCanonical.has(row.work_key)
        ? total
        : total + Math.max(0, Number(row.edition_count) || 0);
    }, 0);
    const seenEditions = new Set<string>();
    const allEditions = editionRows
      .map(mapEdition)
      .filter((edition) => {
        const identity = edition.isbn13 || edition.isbn10 ||
          edition.editionKey;
        if (seenEditions.has(identity)) return false;
        seenEditions.add(identity);
        return true;
      });
    const totalEditions = Math.max(
      declaredEditionCount,
      allEditions.length,
    );
    const baseWork = mapWork(canonicalRow, totalEditions);
    const otherRows = works.filter((row) => row !== canonicalRow);
    const mergedWork: CatalogWork = {
      ...baseWork,
      workKey: component.canonicalWorkKey,
      authors: [...new Set([
        ...baseWork.authors,
        ...otherRows.flatMap((row) => texts(row.authors, 20, 300)),
      ])].slice(0, 20),
      firstPublishedYear: [
        baseWork.firstPublishedYear,
        ...otherRows.map((row) => row.first_published_year),
      ].filter((year): year is number => Number.isInteger(year))
        .sort((left, right) => left - right)[0] ?? null,
      description: baseWork.description ||
        otherRows.map((row) => text(row.description, 8_000))
          .sort((left, right) => right.length - left.length)[0] || "",
      subjects: [...new Set([
        ...baseWork.subjects,
        ...otherRows.flatMap((row) => texts(row.subjects, 50, 300)),
      ])].slice(0, 50),
      languages: [...new Set([
        ...baseWork.languages,
        ...otherRows.flatMap((row) => texts(row.languages, 20, 20)),
      ])].slice(0, 20),
      coverUrl: baseWork.coverUrl ||
        otherRows.map((row) => safeHttpsUrl(row.cover_url)).find(Boolean) || "",
      editionCount: totalEditions,
    };
    const start = (editionPage - 1) * 12;
    return {
      work: mergedWork,
      editions: allEditions.slice(start, start + 12),
      totalEditions,
      memberWorkKeys: component.memberWorkKeys,
    };
  }

  async getDirectLinks(workKey: string): Promise<DirectRetailerLink[]> {
    const component = await this.canonicalComponent(workKey);
    const rows = await this.rows<CatalogRetailerLinkRow>(
      "catalog_retailer_links",
      {
        work_key: `in.(${component.memberWorkKeys.join(",")})`,
        active: "eq.true",
        select:
          "work_key,edition_key,retailer,url,affiliate,label,legacy_asin",
        limit: 500,
      },
    );
    return rows.flatMap((row) => {
      if (!isAllowedRetailerUrl(row.retailer, row.url)) return [];
      return [{
        workKey: component.canonicalWorkKey,
        editionKey: row.edition_key,
        retailer: row.retailer,
        url: row.url,
        affiliate: row.affiliate,
        label: text(row.label, 200),
        legacyAsin: row.legacy_asin,
      }];
    });
  }

  async persistOpenLibraryWorks(
    works: WorkCandidate[],
    editionsByWork = new Map<string, CatalogEdition[]>(),
  ): Promise<void> {
    if (!works.length) return;
    const workRows = works.map((work) => ({
      work_key: work.workKey,
      title: text(work.title, 500) || "Obra sem título",
      authors: texts(work.authors, 20, 300),
      first_published_year:
        Number.isInteger(work.firstPublishedYear) &&
          Number(work.firstPublishedYear) >= 1000 &&
          Number(work.firstPublishedYear) <= 2200
          ? Number(work.firstPublishedYear)
          : null,
      description: text(work.description, 8_000),
      subjects: texts(work.subjects, 50, 300),
      languages: texts(work.languages, 20, 20),
      edition_count: Math.max(0, work.editionCount),
      cover_url: safeHttpsUrl(work.coverUrl),
      source: "open_library",
    }));
    const sourceRows = works.flatMap((work) =>
      [...new Set([work.workKey, ...work.sourceWorkKeys])]
        .filter((sourceKey) => /^OL[0-9]+W$/.test(sourceKey))
        .map((sourceKey) => ({
          work_key: work.workKey,
          source: "open_library",
          source_key: sourceKey,
          alias_title: text(work.title, 500),
          alias_authors: texts(work.authors, 20, 300),
        }))
    );
    const editionRows = works.flatMap((work) =>
      (editionsByWork.get(work.workKey) ?? []).map((edition) => ({
        edition_key: edition.editionKey,
        work_key: work.workKey,
        source: edition.editionKey.startsWith("OL")
          ? "open_library"
          : "manual",
        isbn_10: validIsbn(edition.isbn10),
        isbn_13: validIsbn(edition.isbn13),
        publisher: text(edition.publisher, 300),
        published_date: text(edition.publishedDate, 100),
        language: text(edition.language, 20),
        format: text(edition.format, 100),
        page_count:
          Number.isSafeInteger(edition.pageCount) &&
            Number(edition.pageCount) > 0
            ? Number(edition.pageCount)
            : null,
        cover_url: safeHttpsUrl(edition.coverUrl),
      }))
    );

    const insertIgnoringDuplicates = (
      table: string,
      body: unknown[],
      conflict: string,
    ): Promise<void> => {
      if (!body.length) return Promise.resolve();
      return this.request<void>(
        `/rest/v1/${table}?on_conflict=${encodeURIComponent(conflict)}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            prefer: "resolution=ignore-duplicates,return=minimal",
          },
          body: JSON.stringify(body),
        },
      );
    };

    await insertIgnoringDuplicates(
      "catalog_works",
      workRows,
      "work_key",
    );
    await Promise.all([
      insertIgnoringDuplicates(
        "catalog_work_sources",
        sourceRows,
        "source,source_key",
      ),
      insertIgnoringDuplicates(
        "catalog_editions",
        editionRows,
        "edition_key",
      ),
    ]);

    const workKeys = works.map((work) => work.workKey);
    const editionKeys = editionRows.map((row) => row.edition_key);
    const [storedWorks, storedEditions] = await Promise.all([
      this.rows<CatalogWorkRow & { source: string }>("catalog_works", {
        work_key: `in.(${workKeys.join(",")})`,
        select:
          "work_key,title,authors,first_published_year,description,subjects,languages,edition_count,cover_url,source",
        limit: workKeys.length,
      }),
      editionKeys.length
        ? this.rows<CatalogEditionRow & { source: string }>(
          "catalog_editions",
          {
            edition_key: `in.(${editionKeys.join(",")})`,
            select:
              "edition_key,work_key,isbn_10,isbn_13,publisher,published_date,language,format,page_count,cover_url,source",
            limit: editionKeys.length,
          },
        )
        : Promise.resolve([]),
    ]);
    const incomingWorks = new Map(
      workRows.map((row) => [row.work_key, row]),
    );
    const incomingEditions = new Map(
      editionRows.map((row) => [row.edition_key, row]),
    );

    const workEnrichment = storedWorks.flatMap((stored) => {
      const incoming = incomingWorks.get(stored.work_key);
      if (!incoming || stored.source !== "open_library") return [];
      const patch: Record<string, unknown> = {};
      if (
        (!stored.title || stored.title === "Obra sem título") &&
        incoming.title
      ) {
        patch.title = incoming.title;
      }
      if (!stored.authors?.length && incoming.authors.length) {
        patch.authors = incoming.authors;
      }
      if (
        stored.first_published_year === null &&
        incoming.first_published_year !== null
      ) {
        patch.first_published_year = incoming.first_published_year;
      }
      if (!stored.description && incoming.description) {
        patch.description = incoming.description;
      }
      if (!stored.subjects?.length && incoming.subjects.length) {
        patch.subjects = incoming.subjects;
      }
      if (!stored.languages?.length && incoming.languages.length) {
        patch.languages = incoming.languages;
      }
      if (!stored.cover_url && incoming.cover_url) {
        patch.cover_url = incoming.cover_url;
      }
      if (
        Number(incoming.edition_count) > Number(stored.edition_count || 0)
      ) {
        patch.edition_count = incoming.edition_count;
      }
      return [[stored.work_key, patch] as const];
    });

    const editionEnrichment = storedEditions.flatMap((stored) => {
      const incoming = incomingEditions.get(stored.edition_key);
      if (!incoming || stored.source !== "open_library") return [];
      const patch: Record<string, unknown> = {};
      for (const field of [
        "isbn_10",
        "isbn_13",
        "publisher",
        "published_date",
        "language",
        "format",
        "cover_url",
      ] as const) {
        if (!stored[field] && incoming[field]) {
          patch[field] = incoming[field];
        }
      }
      if (stored.page_count === null && incoming.page_count !== null) {
        patch.page_count = incoming.page_count;
      }
      return [[stored.edition_key, patch] as const];
    });

    await Promise.all([
      ...workEnrichment.map(([workKey, patch]) =>
        this.patchRow(
          "catalog_works",
          "work_key",
          workKey,
          patch,
        )
      ),
      ...editionEnrichment.map(([editionKey, patch]) =>
        this.patchRow(
          "catalog_editions",
          "edition_key",
          editionKey,
          patch,
        )
      ),
    ]);
  }

  private async workKeyForResolve(
    request: ResolveCatalogRequest,
  ): Promise<string | null> {
    if (request.legacyAsin) {
      const [sources, links] = await Promise.all([
        this.rows<{ work_key: string }>("catalog_work_sources", {
          source: "eq.legacy_amazon",
          source_key: `eq.${request.legacyAsin}`,
          select: "work_key",
          limit: 1,
        }),
        this.rows<{ work_key: string }>("catalog_retailer_links", {
          legacy_asin: `eq.${request.legacyAsin}`,
          active: "eq.true",
          select: "work_key",
          limit: 1,
        }),
      ]);
      const workKey = sources[0]?.work_key ?? links[0]?.work_key;
      if (workKey) return workKey;
    }

    if (request.isbn) {
      const field = request.isbn.length === 13 ? "isbn_13" : "isbn_10";
      const editions = await this.rows<{ work_key: string }>(
        "catalog_editions",
        {
          [field]: `eq.${request.isbn}`,
          select: "work_key",
          limit: 1,
        },
      );
      if (editions[0]?.work_key) return editions[0].work_key;
    }

    if (!request.title && !request.author) return null;
    const works = await this.allWorks();
    const requestedTitle = normalizeTitle(request.title ?? "");
    const requestedAuthor = normalizeAuthor(request.author ?? "");
    const ranked = works.map((work) => {
      const titleScore = requestedTitle
        ? textSimilarity(requestedTitle, normalizeTitle(work.title))
        : 1;
      const authorScore = requestedAuthor
        ? Math.max(
          0,
          ...work.authors.map((author) =>
            textSimilarity(requestedAuthor, normalizeAuthor(author))
          ),
        )
        : 1;
      return { work, score: Math.min(titleScore, authorScore) };
    }).sort((left, right) => right.score - left.score);
    return ranked[0]?.score >= 0.86 ? ranked[0].work.work_key : null;
  }

  async resolveLocal(
    request: ResolveCatalogRequest,
  ): Promise<CatalogWorkDetail | null> {
    const workKey = await this.workKeyForResolve(request);
    return workKey ? this.getWork(workKey, 1) : null;
  }
}
