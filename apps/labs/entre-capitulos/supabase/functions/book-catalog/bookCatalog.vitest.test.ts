import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { makeCacheWrite } from "./cache.ts";
import {
  type BookCatalogConfig,
  readConfig,
} from "./config.ts";
import { handleCatalogRequest } from "./handler.ts";
import {
  compareWorkIdentity,
  groupWorkCandidates,
  normalizeAuthor,
  normalizeTitle,
} from "./identity.ts";
import {
  isValidIsbn10,
  isValidIsbn13,
  isbn10To13,
} from "./isbn.ts";
import {
  normalizeSearchDocument,
  OpenLibraryClient,
  OpenLibraryError,
  OpenLibraryRequestGate,
} from "./openLibraryClient.ts";
import {
  parseCatalogRequest,
  RequestValidationError,
} from "./request.ts";
import {
  buildDestinations,
  buildRetailerSearchUrl,
  isAllowedRetailerUrl,
} from "./retailers.ts";
import {
  type CatalogStore,
  SupabaseStore,
} from "./supabaseStore.ts";
import type {
  BookCatalogCacheRow,
  BookCatalogCacheWrite,
  CatalogCollectionRecord,
  CatalogEdition,
  CatalogResponse,
  CatalogWork,
  CatalogWorkDetail,
  DirectRetailerLink,
  IdentityRule,
  RateLimitDecision,
  WorkCandidate,
} from "./types.ts";

function config(
  overrides: Partial<BookCatalogConfig> = {},
): BookCatalogConfig {
  return {
    allowedOrigins: new Set(["http://localhost:5173"]),
    allowNoOrigin: false,
    publicRequestsPerMinute: 60,
    supabaseUrl: "https://project.supabase.co",
    supabaseServiceRoleKey: "service-role-secret",
    supabaseAnonKey: "anon-key",
    openLibraryBaseUrl: "https://openlibrary.org",
    openLibraryContactEmail: "feedback@hcwebsolutions.com.br",
    openLibraryUserAgent:
      "EntreCapitulos/1.0 (feedback@hcwebsolutions.com.br)",
    openLibraryTimeoutMs: 8_000,
    ...overrides,
  };
}

function work(
  overrides: Partial<WorkCandidate> = {},
): WorkCandidate {
  return {
    workKey: "OL1W",
    title: "Torto Arado",
    authors: ["Itamar Vieira Junior"],
    firstPublishedYear: 2019,
    description: "",
    subjects: ["Literatura brasileira"],
    languages: ["pt"],
    coverUrl: "",
    editionCount: 1,
    sourceWorkKeys: ["OL1W"],
    identifiers: ["9786580309313"],
    ...overrides,
  };
}

function edition(
  overrides: Partial<CatalogEdition> = {},
): CatalogEdition {
  return {
    editionKey: "OL1M",
    isbn10: "6580309318",
    isbn13: "9786580309313",
    publisher: "Todavia",
    publishedDate: "2019",
    language: "pt",
    format: "paperback",
    pageCount: 264,
    coverUrl: "",
    ...overrides,
  };
}

function response(
  overrides: Partial<CatalogResponse> = {},
): CatalogResponse {
  return {
    operation: "search",
    works: [],
    fetchedAt: "2026-07-29T12:00:00.000Z",
    expiresAt: "2026-07-30T12:00:00.000Z",
    stale: false,
    source: "open_library",
    ...overrides,
  };
}

const immediateOpenLibraryGate = {
  async wait(): Promise<void> {},
};

class FakeStore implements CatalogStore {
  quota: RateLimitDecision = { allowed: true };
  cache: BookCatalogCacheRow | null = null;
  writes: BookCatalogCacheWrite[] = [];
  persisted: WorkCandidate[][] = [];
  persistedEditions: Map<string, CatalogEdition[]>[] = [];
  rules: IdentityRule[] = [];
  collection: CatalogCollectionRecord | null = null;
  detail: CatalogWorkDetail | null = null;
  links: DirectRetailerLink[] = [];

  async resolveClientKey(): Promise<string> {
    return "a".repeat(64);
  }

  async consumeClientQuota(): Promise<RateLimitDecision> {
    return this.quota;
  }

  async cleanupIfDue(): Promise<void> {}

  async getCache(): Promise<BookCatalogCacheRow | null> {
    return this.cache;
  }

  async putCache(value: BookCatalogCacheWrite): Promise<void> {
    this.writes.push(value);
  }

  async getIdentityRules(): Promise<IdentityRule[]> {
    return this.rules;
  }

  async getCanonicalWorkKey(workKey: string): Promise<string> {
    return workKey;
  }

  async getCollection(): Promise<CatalogCollectionRecord | null> {
    return this.collection;
  }

  async getWork(): Promise<CatalogWorkDetail | null> {
    return this.detail;
  }

  async getDirectLinks(): Promise<DirectRetailerLink[]> {
    return this.links;
  }

  async persistOpenLibraryWorks(
    works: WorkCandidate[],
    editionsByWork = new Map<string, CatalogEdition[]>(),
  ): Promise<void> {
    this.persisted.push(works);
    this.persistedEditions.push(editionsByWork);
  }

  async resolveLocal(): Promise<CatalogWorkDetail | null> {
    return this.detail;
  }
}

function request(
  body: unknown,
  overrides: {
    origin?: string | null;
    method?: string;
    contentLength?: string;
  } = {},
): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (overrides.origin !== null) {
    headers.set("origin", overrides.origin ?? "http://localhost:5173");
  }
  if (overrides.contentLength) {
    headers.set("content-length", overrides.contentLength);
  }
  return new Request("https://project.supabase.co/functions/v1/book-catalog", {
    method: overrides.method ?? "POST",
    headers,
    body: overrides.method === "GET" || overrides.method === "OPTIONS"
      ? undefined
      : typeof body === "string"
        ? body
        : JSON.stringify(body),
  });
}

async function jsonBody(value: Response): Promise<Record<string, any>> {
  return await value.json() as Record<string, any>;
}

describe("configuration and request validation", () => {
  it("identifies the app and keeps the public quota at 60/minute", () => {
    const values: Record<string, string> = {
      OPEN_LIBRARY_CONTACT_EMAIL: "feedback@hcwebsolutions.com.br",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "secret",
    };
    const result = readConfig((name) => values[name]);
    expect(result.openLibraryUserAgent).toContain(
      "feedback@hcwebsolutions.com.br",
    );
    expect(result.publicRequestsPerMinute).toBe(60);
    expect(result.allowedOrigins.has("http://localhost:5173")).toBe(true);
  });

  it("requires an identifiable Open Library contact", () => {
    expect(() => readConfig(() => undefined)).toThrow(
      "OPEN_LIBRARY_CONTACT_EMAIL",
    );
  });

  it("parses all four operations and canonicalizes identifiers", () => {
    expect(parseCatalogRequest({
      operation: "search",
      query: "  Saramago  ",
      page: 2,
      language: "pt",
      subject: "Ficção",
      sort: "newest",
    })).toEqual({
      operation: "search",
      query: "Saramago",
      page: 2,
      language: "pt",
      subject: "Ficção",
      sort: "newest",
    });
    expect(parseCatalogRequest({
      operation: "collection",
      slug: "Em-Destaque",
    })).toEqual({ operation: "collection", slug: "em-destaque" });
    expect(parseCatalogRequest({
      operation: "work",
      workKey: "/works/OL24141556W",
    })).toEqual({
      operation: "work",
      workKey: "OL24141556W",
      editionPage: 1,
    });
    expect(parseCatalogRequest({
      operation: "resolve",
      isbn: "978-85-359-3053-5",
    })).toEqual({
      operation: "resolve",
      isbn: "9788535930535",
    });
  });

  it("rejects invalid ISBNs, pages and empty resolve requests", () => {
    expect(() => parseCatalogRequest({
      operation: "resolve",
      isbn: "9788535930534",
    })).toThrow(RequestValidationError);
    expect(() => parseCatalogRequest({
      operation: "search",
      query: "livro",
      page: 0,
    })).toThrow("page");
    expect(() => parseCatalogRequest({ operation: "resolve" })).toThrow(
      "resolve requer",
    );
  });
});

describe("ISBN and work identity", () => {
  it("validates both ISBN checksums and corrects the Saramago ISBN-13", () => {
    expect(isValidIsbn10("8535930531")).toBe(true);
    expect(isValidIsbn13("9788535930535")).toBe(true);
    expect(isValidIsbn13("9788535930534")).toBe(false);
    expect(isbn10To13("8535930531")).toBe("9788535930535");
  });

  it("normalizes edition markers and author name order", () => {
    expect(normalizeTitle("A Hora da Estrela — edição comemorativa 2020"))
      .toBe("a hora da estrela");
    expect(normalizeAuthor("Lispector, Clarice")).toBe(
      normalizeAuthor("Clarice Lispector"),
    );
  });

  it("groups exact and fuzzy duplicates from the same author", () => {
    const exact = compareWorkIdentity(
      work({ workKey: "OL1W", sourceWorkKeys: ["OL1W"] }),
      work({
        workKey: "OL2W",
        sourceWorkKeys: ["OL2W"],
        title: "Torto Arado — edição especial",
        identifiers: [],
      }),
    );
    const fuzzy = compareWorkIdentity(
      work({ identifiers: [] }),
      work({
        workKey: "OL2W",
        sourceWorkKeys: ["OL2W"],
        title: "Torto Ardo",
        identifiers: [],
      }),
    );
    expect(exact.method).toBe("exact");
    expect(exact.matches).toBe(true);
    expect(fuzzy.method).toBe("fuzzy");
    expect(fuzzy.matches).toBe(true);
  });

  it("never merges conflicting volumes, adaptations or translations", () => {
    expect(compareWorkIdentity(
      work({ title: "Saga volume 1", identifiers: [] }),
      work({
        workKey: "OL2W",
        sourceWorkKeys: ["OL2W"],
        title: "Saga volume 2",
        identifiers: [],
      }),
    ).method).toBe("volume_conflict");
    expect(compareWorkIdentity(
      work({ identifiers: [] }),
      work({
        workKey: "OL2W",
        sourceWorkKeys: ["OL2W"],
        title: "Torto Arado adaptação",
        identifiers: [],
      }),
    ).method).toBe("blocked_variant");
    expect(compareWorkIdentity(
      work({ identifiers: [], languages: ["pt"] }),
      work({
        workKey: "OL2W",
        sourceWorkKeys: ["OL2W"],
        identifiers: [],
        languages: ["en"],
      }),
    ).method).toBe("language_conflict");
  });

  it("applies manual rules before the algorithm and preserves edition counts", () => {
    const left = work({ identifiers: [], languages: ["pt"] });
    const right = work({
      workKey: "OL2W",
      sourceWorkKeys: ["OL2W"],
      identifiers: [],
      languages: ["en"],
      editionCount: 2,
    });
    const grouped = groupWorkCandidates([left, right], [{
      action: "merge",
      workKeyA: "OL1W",
      workKeyB: "OL2W",
      editionKey: null,
      method: "manual",
      confidence: 1,
    }]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].editionCount).toBe(3);
    expect(compareWorkIdentity(left, right, [{
      action: "separate",
      workKeyA: "OL1W",
      workKeyB: "OL2W",
      editionKey: null,
      method: "manual",
      confidence: 1,
    }]).method).toBe("manual_separate");
  });

  it("does not turn an edition-specific separation into a work-wide rule", () => {
    const left = work({ identifiers: [] });
    const right = work({
      workKey: "OL2W",
      sourceWorkKeys: ["OL2W"],
      identifiers: [],
    });
    expect(compareWorkIdentity(left, right, [{
      action: "separate",
      workKeyA: "OL1W",
      workKeyB: "OL2W",
      editionKey: "OL2M",
      method: "manual",
      confidence: 1,
    }]).method).toBe("exact");
  });

  it("uses a shared valid ISBN as edition-level evidence", () => {
    const result = compareWorkIdentity(
      work(),
      work({
        workKey: "OL2W",
        sourceWorkKeys: ["OL2W"],
        title: "Outro título",
        authors: ["Outra pessoa"],
      }),
    );
    expect(result).toEqual({
      matches: true,
      method: "shared_isbn",
      confidence: 1,
    });
  });
});

describe("retailer destinations", () => {
  const catalogWork: CatalogWork = work();

  it("builds the three neutral searches in the required order", () => {
    const destinations = buildDestinations(catalogWork, [edition()]);
    expect(destinations.map((item) => item.retailer)).toEqual([
      "amazon_br",
      "estante_virtual",
      "mercado_livre",
    ]);
    expect(destinations.every((item) => item.kind === "search")).toBe(true);
    expect(destinations.every((item) => item.label === "Buscar na loja"))
      .toBe(true);
    expect(destinations[0].url).toContain("9786580309313");
  });

  it("encodes title/author fallback and enforces each domain allowlist", () => {
    expect(
      buildRetailerSearchUrl("amazon_br", "A hora da estrela Clarice"),
    ).toContain("A%20hora%20da%20estrela%20Clarice");
    expect(isAllowedRetailerUrl(
      "estante_virtual",
      "https://www.estantevirtual.com.br/busca?q=livro",
    )).toBe(true);
    expect(isAllowedRetailerUrl(
      "amazon_br",
      "https://amazon.com.br.evil.example/dp/123",
    )).toBe(false);
    expect(isAllowedRetailerUrl(
      "mercado_livre",
      "javascript:alert(1)",
    )).toBe(false);
  });

  it("returns a direct SiteStripe link byte-for-byte with affiliate metadata", () => {
    const siteStripe =
      "https://www.amazon.com.br/dp/6555320354?&linkCode=ll2&tag=entrecapitu04-20&linkId=d885554379d966ba9e5e36d4a6761d9b&ref_=as_li_ss_tl";
    const destinations = buildDestinations(catalogWork, [edition()], [{
      workKey: catalogWork.workKey,
      editionKey: "OL1M",
      retailer: "amazon_br",
      url: siteStripe,
      affiliate: true,
      label: "Ver esta edição na Amazon",
      legacyAsin: "6555320354",
    }]);
    expect(destinations[0]).toMatchObject({
      url: siteStripe,
      kind: "direct",
      affiliate: true,
      label: "Ver esta edição na Amazon",
    });
  });
});

describe("Open Library normalization and requests", () => {
  it("sanitizes metadata, identifiers and cover URLs", () => {
    const result = normalizeSearchDocument({
      key: "/works/OL24141556W",
      title: "<b>Torto</b> Arado",
      author_name: ["Itamar Vieira Junior"],
      first_publish_year: 2019,
      edition_count: 4,
      cover_i: 12369648,
      language: ["por"],
      subject: ["<script>bad()</script> Literatura"],
      isbn: ["9786580309313", "9780000000000"],
      editions: {
        docs: [{
          key: "/books/OL35663926M",
          isbn: ["6580309318", "9786580309313"],
          publisher: ["Todavia"],
          language: ["por"],
          cover_i: 12369648,
        }],
      },
    });
    expect(result?.work.workKey).toBe("OL24141556W");
    expect(result?.work.title).toBe("Torto Arado");
    expect(result?.work.languages).toEqual(["pt"]);
    expect(result?.work.coverUrl).toBe(
      "https://covers.openlibrary.org/b/id/12369648-L.jpg",
    );
    expect(result?.edition?.editionKey).toBe("OL35663926M");
    expect(result?.edition?.isbn13).toBe("9786580309313");
  });

  it("maps invalid years and page counts to null before persistence", () => {
    const result = normalizeSearchDocument({
      key: "/works/OL1W",
      title: "Dados antigos",
      first_publish_year: 0,
      edition_count: null,
      editions: {
        docs: [{
          key: "/books/OL1M",
          number_of_pages: 0,
        }],
      },
    });
    expect(result?.work.firstPublishedYear).toBeNull();
    expect(result?.work.editionCount).toBe(0);
    expect(result?.edition?.pageCount).toBeNull();
  });

  it("paces all process requests at the identified three-per-second rate", async () => {
    let now = 0;
    const waits: number[] = [];
    const gate = new OpenLibraryRequestGate(
      334,
      () => now,
      async (milliseconds) => {
        waits.push(milliseconds);
        now += milliseconds;
      },
    );
    await Promise.all([gate.wait(), gate.wait(), gate.wait()]);
    expect(waits).toEqual([334, 334]);
    expect(now).toBe(668);
  });

  it("uses 18 works per page, contact headers and safe query parameters", async () => {
    let captured: URL | undefined;
    let headers: Headers | undefined;
    const requestGate = { wait: vi.fn().mockResolvedValue(undefined) };
    const client = new OpenLibraryClient(
      config(),
      async (input, init) => {
        captured = new URL(String(input));
        headers = new Headers(init?.headers);
        return Response.json({ numFound: 0, docs: [] });
      },
      requestGate,
    );
    const result = await client.search({
      operation: "search",
      query: "Saramago",
      page: 2,
      language: "pt",
      subject: "Ficção",
      sort: "oldest",
    });
    expect(result.total).toBe(0);
    expect(captured?.searchParams.get("limit")).toBe("18");
    expect(captured?.searchParams.get("q")).toContain("language:por");
    expect(captured?.searchParams.get("sort")).toBe("old");
    expect(captured?.searchParams.get("email")).toBe(
      "feedback@hcwebsolutions.com.br",
    );
    expect(headers?.get("user-agent")).toContain("EntreCapitulos");
    expect(requestGate.wait).toHaveBeenCalledTimes(1);
  });

  it("uses the canonical /works key query and paginates 12 editions", async () => {
    const calls: URL[] = [];
    const client = new OpenLibraryClient(
      config(),
      async (input) => {
        const url = new URL(String(input));
        calls.push(url);
        if (url.pathname.endsWith("/editions.json")) {
          return Response.json({
            size: 13,
            entries: [{
              key: "/books/OL1M",
              isbn_13: ["9786580309313"],
              publishers: ["Todavia"],
              languages: [{ key: "/languages/por" }],
            }],
          });
        }
        if (url.pathname === "/search.json") {
          return Response.json({
            docs: [{
              key: "/works/OL24141556W",
              title: "Torto Arado",
              author_name: ["Itamar Vieira Junior"],
              first_publish_year: 2019,
              edition_count: 13,
            }],
          });
        }
        return Response.json({
            key: "/works/OL24141556W",
            title: "Torto Arado",
            description: "<p>Uma história.</p>",
            covers: [12369648],
            subjects: ["Ficção"],
          });
      },
      immediateOpenLibraryGate,
    );
    const result = await client.work("OL24141556W", 2);
    const editionsCall = calls.find((url) =>
      url.pathname.endsWith("/editions.json")
    );
    const searchCall = calls.find((url) => url.pathname === "/search.json");
    expect(editionsCall?.searchParams.get("limit")).toBe("12");
    expect(editionsCall?.searchParams.get("offset")).toBe("12");
    expect(searchCall?.searchParams.get("q")).toBe(
      "key:/works/OL24141556W",
    );
    expect(result.work.description).toBe("Uma história.");
    expect(result.totalEditions).toBe(13);
  });
});

describe("conservative catalog persistence", () => {
  it("fills empty Open Library fields without replacing curated values", async () => {
    const patches: Array<{ path: string; body: Record<string, unknown> }> = [];
    const store = new SupabaseStore(config(), async (input, init) => {
      const url = new URL(String(input));
      const method = init?.method ?? "GET";
      if (method === "GET" && url.pathname.endsWith("/catalog_works")) {
        return Response.json([{
          work_key: "OL1W",
          title: "Título da curadoria",
          authors: [],
          first_published_year: null,
          description: "",
          subjects: [],
          languages: [],
          edition_count: 1,
          cover_url: "https://storage.example/curated.webp",
          source: "open_library",
        }]);
      }
      if (method === "GET" && url.pathname.endsWith("/catalog_editions")) {
        return Response.json([{
          edition_key: "OL1M",
          work_key: "OL1W",
          isbn_10: "",
          isbn_13: "",
          publisher: "",
          published_date: "",
          language: "",
          format: "",
          page_count: null,
          cover_url: "",
          source: "open_library",
        }]);
      }
      if (method === "PATCH") {
        patches.push({
          path: url.pathname,
          body: JSON.parse(String(init?.body)) as Record<string, unknown>,
        });
      }
      return new Response(null, { status: 204 });
    });

    await store.persistOpenLibraryWorks([
      work({
        title: "Título externo",
        authors: ["Autora Real"],
        firstPublishedYear: 1999,
        description: "Sinopse real.",
        subjects: ["Ficção"],
        languages: ["pt"],
        coverUrl: "https://covers.openlibrary.org/b/id/1-L.jpg",
        editionCount: 12,
      }),
    ], new Map([["OL1W", [edition({
      publisher: "Editora",
      publishedDate: "2024",
      coverUrl: "https://covers.openlibrary.org/b/id/2-L.jpg",
    })]]]));

    const workPatch = patches.find((item) =>
      item.path.endsWith("/catalog_works")
    )?.body;
    expect(workPatch).toMatchObject({
      authors: ["Autora Real"],
      first_published_year: 1999,
      description: "Sinopse real.",
      subjects: ["Ficção"],
      languages: ["pt"],
      edition_count: 12,
    });
    expect(workPatch).not.toHaveProperty("title");
    expect(workPatch).not.toHaveProperty("cover_url");
    expect(patches.find((item) =>
      item.path.endsWith("/catalog_editions")
    )?.body).toMatchObject({
      isbn_10: "6580309318",
      isbn_13: "9786580309313",
      publisher: "Editora",
      published_date: "2024",
      page_count: 264,
    });
  });
});

describe("persistent canonical identity", () => {
  it("resolves a merged alias and aggregates editions under one canonical work", async () => {
    let identityRulesQuery: URL | undefined;
    const store = new SupabaseStore(config(), async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/catalog_identity_rules")) {
        identityRulesQuery = url;
        return Response.json([{
          action: "merge",
          work_key_a: "OL1W",
          work_key_b: "OL2W",
          edition_key: null,
          method: "manual",
          confidence: 1,
        }]);
      }
      if (url.pathname.endsWith("/catalog_work_sources")) {
        return Response.json([
          { work_key: "OL1W", source_key: "OL1W" },
          { work_key: "OL2W", source_key: "OL2W" },
        ]);
      }
      if (url.pathname.endsWith("/catalog_works")) {
        return Response.json([
          {
            work_key: "OL1W",
            title: "Obra canônica",
            authors: ["Autora"],
            first_published_year: 2001,
            description: "Descrição editorial.",
            subjects: ["Ficção"],
            languages: ["pt"],
            edition_count: 1,
            cover_url: "",
          },
          {
            work_key: "OL2W",
            title: "Obra canonica",
            authors: ["Autora"],
            first_published_year: 2002,
            description: "",
            subjects: [],
            languages: ["pt"],
            edition_count: 1,
            cover_url: "",
          },
        ]);
      }
      if (url.pathname.endsWith("/catalog_editions")) {
        return Response.json([
          {
            edition_key: "OL1M",
            work_key: "OL1W",
            isbn_10: "6580309318",
            isbn_13: "9786580309313",
            publisher: "Editora A",
            published_date: "2001",
            language: "pt",
            format: "paperback",
            page_count: 200,
            cover_url: "",
          },
          {
            edition_key: "OL2M",
            work_key: "OL2W",
            isbn_10: "6555320354",
            isbn_13: "9786555320350",
            publisher: "Editora B",
            published_date: "2002",
            language: "pt",
            format: "hardcover",
            page_count: 240,
            cover_url: "",
          },
        ]);
      }
      return Response.json([]);
    });

    const detail = await store.getWork("OL2W", 1);
    expect(identityRulesQuery?.searchParams.get("edition_key")).toBe("is.null");
    expect(detail?.work.workKey).toBe("OL1W");
    expect(detail?.memberWorkKeys).toEqual(["OL1W", "OL2W"]);
    expect(detail?.editions.map((item) => item.editionKey)).toEqual([
      "OL1M",
      "OL2M",
    ]);
    expect(detail?.totalEditions).toBe(2);
  });
});

describe("HTTP handler", () => {
  it("groups a search page, persists it before returning and writes cache", async () => {
    const store = new FakeStore();
    const search = vi.fn().mockResolvedValue({
      works: [
        work({ identifiers: [] }),
        work({
          workKey: "OL2W",
          sourceWorkKeys: ["OL2W"],
          title: "Torto Arado edição especial",
          identifiers: [],
        }),
      ],
      representativeEditions: new Map([
        ["OL1W", edition()],
        ["OL2W", edition({
          editionKey: "OL2M",
          isbn10: "6555320354",
          isbn13: "9786555320350",
        })],
      ]),
      total: 20,
    });
    const result = await handleCatalogRequest(
      request({
        operation: "search",
        query: "Torto Arado",
        page: 1,
      }),
      {
        config: config(),
        store,
        openLibrary: { search } as unknown as OpenLibraryClient,
        now: () => new Date("2026-07-29T12:00:00.000Z"),
      },
    );
    const body = await jsonBody(result);
    expect(result.status).toBe(200);
    expect(body.works).toHaveLength(1);
    expect(body.works[0].sourceWorkKeys).toBeUndefined();
    expect(body.pagination).toEqual({
      page: 1,
      pageSize: 18,
      total: 20,
      hasMore: true,
    });
    expect(store.persisted).toHaveLength(1);
    expect(
      store.persistedEditions[0].get("OL1W")?.map((item) =>
        item.editionKey
      ),
    ).toEqual(["OL1M", "OL2M"]);
    expect(store.writes).toHaveLength(1);
    expect(body.expiresAt).toBe("2026-07-30T12:00:00.000Z");
    expect(result.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:5173",
    );
  });

  it("serves fresh internal cache without calling Open Library", async () => {
    const store = new FakeStore();
    const cachedResponse = response({ works: [work()] });
    store.cache = {
      cache_key: "search:key",
      operation: "search",
      request_descriptor: {},
      response_payload: cachedResponse,
      fetched_at: "2026-07-29T12:00:00.000Z",
      expires_at: "2026-07-30T12:00:00.000Z",
      stale_until: "2026-08-06T12:00:00.000Z",
    };
    const search = vi.fn();
    const result = await handleCatalogRequest(
      request({ operation: "search", query: "livros", page: 1 }),
      {
        config: config(),
        store,
        openLibrary: { search } as unknown as OpenLibraryClient,
        now: () => new Date("2026-07-29T13:00:00.000Z"),
      },
    );
    expect(result.status).toBe(200);
    expect(search).not.toHaveBeenCalled();
    expect((await jsonBody(result)).stale).toBe(false);
  });

  it("returns stale cache when Open Library has a temporary failure", async () => {
    const store = new FakeStore();
    store.cache = {
      cache_key: "search:key",
      operation: "search",
      request_descriptor: {},
      response_payload: response({ works: [work()] }),
      fetched_at: "2026-07-28T10:00:00.000Z",
      expires_at: "2026-07-29T10:00:00.000Z",
      stale_until: "2026-08-05T10:00:00.000Z",
    };
    const result = await handleCatalogRequest(
      request({ operation: "search", query: "livros", page: 1 }),
      {
        config: config(),
        store,
        openLibrary: {
          search: vi.fn().mockRejectedValue(
            new OpenLibraryError("upstream failed", 503),
          ),
        } as unknown as OpenLibraryClient,
        now: () => new Date("2026-07-29T12:00:00.000Z"),
      },
    );
    expect(result.status).toBe(200);
    expect((await jsonBody(result)).stale).toBe(true);
  });

  it("marks the local work fallback stale and does not cache it as fresh", async () => {
    const store = new FakeStore();
    store.detail = {
      work: work(),
      editions: [edition()],
      totalEditions: 1,
      memberWorkKeys: ["OL1W"],
    };
    const result = await handleCatalogRequest(
      request({ operation: "work", workKey: "OL1W", editionPage: 1 }),
      {
        config: config(),
        store,
        openLibrary: {
          work: vi.fn().mockRejectedValue(
            new OpenLibraryError("upstream failed", 503),
          ),
        } as unknown as OpenLibraryClient,
        now: () => new Date("2026-07-29T12:00:00.000Z"),
      },
    );
    const body = await jsonBody(result);
    expect(result.status).toBe(200);
    expect(body.stale).toBe(true);
    expect(body.work.workKey).toBe("OL1W");
    expect(store.writes).toHaveLength(0);
  });

  it("coalesces concurrent cache misses for the same request", async () => {
    const store = new FakeStore();
    const search = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        works: [work()],
        representativeEditions: new Map([["OL1W", edition()]]),
        total: 1,
      };
    });
    const dependencies = {
      config: config(),
      store,
      openLibrary: { search } as unknown as OpenLibraryClient,
      now: () => new Date("2026-07-29T12:00:00.000Z"),
    };
    const [first, second] = await Promise.all([
      handleCatalogRequest(
        request({ operation: "search", query: "Torto Arado", page: 1 }),
        dependencies,
      ),
      handleCatalogRequest(
        request({ operation: "search", query: "Torto Arado", page: 1 }),
        dependencies,
      ),
    ]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(search).toHaveBeenCalledTimes(1);
    expect(store.persisted).toHaveLength(1);
    expect(store.writes).toHaveLength(1);
  });

  it("maps upstream 429/5xx and client rate limiting without leaking secrets", async () => {
    const store = new FakeStore();
    const upstream = await handleCatalogRequest(
      request({ operation: "search", query: "livros", page: 1 }),
      {
        config: config(),
        store,
        openLibrary: {
          search: vi.fn().mockRejectedValue(
            new OpenLibraryError("limited", 429, 3),
          ),
        } as unknown as OpenLibraryClient,
      },
    );
    const upstreamBody = await jsonBody(upstream);
    expect(upstream.status).toBe(503);
    expect(upstream.headers.get("retry-after")).toBe("3");
    expect(upstreamBody.error.code).toBe("open_library_rate_limited");
    expect(JSON.stringify(upstreamBody)).not.toContain("service-role-secret");

    const limitedStore = new FakeStore();
    limitedStore.quota = { allowed: false, retryAfterSeconds: 42 };
    const limited = await handleCatalogRequest(
      request({ operation: "search", query: "livros", page: 1 }),
      {
        config: config(),
        store: limitedStore,
        openLibrary: {} as OpenLibraryClient,
      },
    );
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("42");
  });

  it("enforces CORS, methods and the 16 KB streaming body limit", async () => {
    const store = new FakeStore();
    const forbidden = await handleCatalogRequest(
      request(
        { operation: "search", query: "livros" },
        { origin: "https://evil.example" },
      ),
      {
        config: config(),
        store,
        openLibrary: {} as OpenLibraryClient,
      },
    );
    expect(forbidden.status).toBe(403);

    const wrongMethod = await handleCatalogRequest(
      request({}, { method: "GET" }),
      {
        config: config(),
        store,
        openLibrary: {} as OpenLibraryClient,
      },
    );
    expect(wrongMethod.status).toBe(405);

    const oversized = await handleCatalogRequest(
      request("{}".padEnd(16_385, " "), { contentLength: "16385" }),
      {
        config: config(),
        store,
        openLibrary: {} as OpenLibraryClient,
      },
    );
    expect(oversized.status).toBe(400);
    expect((await jsonBody(oversized)).error.message).toContain("16 KB");
  });
});

describe("migration contract", () => {
  const amazonSeed = readFileSync(
    new URL(
      "../../migrations/202607290001_amazon_editorial_seed.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const migration = readFileSync(
    new URL(
      "../../migrations/202607290002_open_library_catalog.sql",
      import.meta.url,
    ),
    "utf8",
  );

  it("adds every catalog table, the bucket, RLS and service-only RPCs", () => {
    for (const name of [
      "catalog_works",
      "catalog_work_sources",
      "catalog_editions",
      "catalog_identity_rules",
      "catalog_collections",
      "catalog_collection_items",
      "catalog_retailer_links",
      "book_catalog_cache",
      "book_catalog_client_rate_limits",
    ]) {
      expect(migration).toContain(`create table if not exists public.${name}`);
    }
    expect(migration).toContain("'catalog-covers'");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("consume_book_catalog_client_quota");
    expect(migration).toContain(
      "revoke all on public.book_catalog_cache from anon, authenticated",
    );
  });

  it("keeps automatic ingestion from evicting editorial caches", () => {
    expect(migration).toContain("auth.role() = 'service_role'");
    expect(migration).toContain("'catalog_work_sources'");
    expect(migration).toContain("delete from public.book_catalog_cache");
  });

  it("enforces deterministic identity rules and edition/work consistency", () => {
    expect(migration).toContain(
      "catalog_identity_rules_active_pair_unique",
    );
    expect(migration).toContain(
      "resolve_catalog_identity_rule_conflicts",
    );
    expect(migration).toContain(
      "foreign key (work_key, primary_edition_key)",
    );
    expect(migration).toContain(
      "foreign key (work_key, edition_key)",
    );
    expect(migration).toContain(
      "foreign key (catalog_work_key, catalog_edition_key)",
    );
  });

  it("preserves all SiteStripe URLs literally and fixes the invalid ISBN", () => {
    const pattern = /https:\/\/www\.amazon\.com\.br\/[^'\r\n]+/g;
    expect(migration.match(pattern)).toEqual(amazonSeed.match(pattern));
    expect(migration).toContain("'9788535930535'");
    expect(migration).not.toContain("'9788535930534'");
  });

  it("keeps the two Torto Arado editions distinct under one work", () => {
    expect(migration).toContain("'OL35663926M'");
    expect(migration).toContain("'manual:isbn:9786556927190'");
    expect(
      migration.match(/'OL24141556W'/g)?.length,
    ).toBeGreaterThan(4);
  });

  it("uses bounded cache TTLs for every operation", () => {
    const workCache = makeCacheWrite(
      "work:key",
      "work",
      {},
      response({ operation: "work" }),
      new Date("2026-07-29T12:00:00.000Z"),
    );
    const resolveCache = makeCacheWrite(
      "resolve:key",
      "resolve",
      {},
      response({ operation: "resolve" }),
      new Date("2026-07-29T12:00:00.000Z"),
    );
    const searchCache = makeCacheWrite(
      "search:key",
      "search",
      {},
      response({ operation: "search" }),
      new Date("2026-07-29T12:00:00.000Z"),
    );
    expect(workCache.expires_at).toBe("2026-08-05T12:00:00.000Z");
    expect(resolveCache.expires_at).toBe("2026-08-05T12:00:00.000Z");
    expect(workCache.stale_until).toBe("2026-09-04T12:00:00.000Z");
    expect(resolveCache.stale_until).toBe("2026-09-04T12:00:00.000Z");
    expect(searchCache.expires_at).toBe("2026-07-30T12:00:00.000Z");
  });
});
