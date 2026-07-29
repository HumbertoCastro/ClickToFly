import { describe, expect, it, vi } from "vitest";
import type {
  CatalogEdition,
  CatalogWork,
  RetailerDestination,
} from "../catalogTypes";
import {
  assessWorkIdentity,
  BookCatalogError,
  buildRetailerDestinations,
  buildRetailerSearchUrl,
  createBookCatalogAuthHeaderResolver,
  createBookCatalogClient,
  getBookCatalogConfig,
  identityBlockers,
  isbn10CheckDigit,
  isbn10To13,
  isbn13CheckDigit,
  isRetailerUrl,
  isValidIsbn,
  isValidIsbn10,
  isValidIsbn13,
  matchCatalogEdition,
  normalizeAuthor,
  normalizeIsbn,
  normalizeTitle,
  sanitizeCatalogEdition,
  sanitizeCatalogWork,
  sanitizeDescription,
  sanitizeRetailerDestination,
  shouldGroupWorks,
  textSimilarity,
} from "./bookCatalog";

const NOW = Date.parse("2026-07-29T12:00:00.000Z");
const EXPIRES_AT = "2026-07-30T12:00:00.000Z";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function work(overrides: Partial<CatalogWork> = {}): CatalogWork {
  return {
    workKey: "OL27448W",
    title: "A hora da estrela",
    authors: ["Clarice Lispector"],
    firstPublishedYear: 1977,
    description: "Uma narrativa sobre Macabéa.",
    subjects: ["Literatura brasileira"],
    languages: ["por"],
    coverUrl: "https://covers.openlibrary.org/b/id/123-L.jpg",
    editionCount: 18,
    ...overrides,
  };
}

function edition(overrides: Partial<CatalogEdition> = {}): CatalogEdition {
  return {
    editionKey: "OL123M",
    isbn10: "6580309318",
    isbn13: "9786580309313",
    publisher: "Todavia",
    publishedDate: "2019",
    language: "por",
    format: "paperback",
    pageCount: 264,
    coverUrl: "https://covers.openlibrary.org/b/id/456-L.jpg",
    ...overrides,
  };
}

function destination(
  overrides: Partial<RetailerDestination> = {},
): RetailerDestination {
  return {
    retailer: "amazon_br",
    editionKey: "OL123M",
    url: "https://www.amazon.com.br/s?k=9786580309313",
    kind: "search",
    affiliate: false,
    label: "Buscar na Amazon",
    ...overrides,
  };
}

function responseBase(operation: string) {
  return {
    operation,
    works: [work()],
    fetchedAt: "2026-07-29T12:00:00.000Z",
    expiresAt: EXPIRES_AT,
    stale: false,
    source: "open_library",
  };
}

describe("ISBN utilities", () => {
  it("normalizes and validates ISBN-10 and ISBN-13 checksums", () => {
    expect(normalizeIsbn(" ISBN-13: 978-65-80309-31-3 ")).toBe(
      "9786580309313",
    );
    expect(isbn10CheckDigit("658030931")).toBe("8");
    expect(isbn10CheckDigit("080442957")).toBe("X");
    expect(isbn13CheckDigit("978658030931")).toBe("3");
    expect(isValidIsbn10("6580309318")).toBe(true);
    expect(isValidIsbn10("0-8044-2957-X")).toBe(true);
    expect(isValidIsbn13("9786580309313")).toBe(true);
    expect(isValidIsbn("0-306-40615-2")).toBe(true);
  });

  it("rejects bad checksums and converts a valid ISBN-10", () => {
    expect(isValidIsbn10("6580309310")).toBe(false);
    expect(isValidIsbn13("9786580309310")).toBe(false);
    expect(isbn10To13("0-306-40615-2")).toBe("9780306406157");
    expect(isbn10To13("0306406150")).toBeNull();
  });
});

describe("representative edition matching", () => {
  const hardcover = edition({
    editionKey: "OL111M",
    isbn10: "6556927198",
    isbn13: "9786556927190",
  });
  const paperback = edition({
    editionKey: "OL222M",
    isbn10: "6580309318",
    isbn13: "9786580309313",
  });

  it("uses the exact ISBN instead of the first edition", () => {
    expect(
      matchCatalogEdition(
        { isbn13: "978-65-80309-31-3" },
        [hardcover, paperback],
      ),
    ).toEqual(paperback);
  });

  it("uses a known direct Amazon ASIN and never guesses", () => {
    const directDestination = destination({
      editionKey: paperback.editionKey,
      kind: "direct",
      affiliate: true,
      url: "https://www.amazon.com.br/Torto-arado/dp/6580309318?tag=example-20",
    });
    expect(
      matchCatalogEdition(
        { legacyAsins: ["6580309318"] },
        [hardcover, paperback],
        [directDestination],
      ),
    ).toEqual(paperback);
    expect(
      matchCatalogEdition(
        { isbn13: "9788535930535", legacyAsins: ["UNKNOWN001"] },
        [hardcover, paperback],
        [directDestination],
      ),
    ).toBeNull();
  });
});

describe("work identity", () => {
  it("normalizes edition markers, accents and inverted author names", () => {
    expect(normalizeTitle("A Hora da Estrela — 2ª edição comemorativa")).toBe(
      "hora da estrela",
    );
    expect(normalizeAuthor("Lispector, Clarice")).toBe(
      normalizeAuthor("Clarice Lispector"),
    );
    expect(
      textSimilarity("Grande Sertão: Veredas", "Grande Sertao Vereda"),
    ).toBeGreaterThanOrEqual(0.86);
  });

  it("groups by Work key or a shared valid ISBN before fuzzy rules", () => {
    expect(
      assessWorkIdentity(
        {
          workKey: "/works/OL1W",
          title: "Adaptação de um clássico",
          authors: ["Pessoa A"],
        },
        {
          workKey: "OL1W",
          title: "Outro título",
          authors: ["Pessoa B"],
        },
      ),
    ).toMatchObject({ match: true, method: "work_key", confidence: 1 });

    expect(
      assessWorkIdentity(
        {
          title: "Título editorial A",
          authors: ["Pessoa A"],
          isbns: ["9786580309313"],
        },
        {
          title: "Título editorial B",
          authors: ["Pessoa B"],
          isbns: ["978-65-80309-31-3"],
        },
      ),
    ).toMatchObject({ match: true, method: "isbn" });
  });

  it("groups matching authors with exact or >= 0.86 similar titles", () => {
    const exact = assessWorkIdentity(
      {
        title: "A Hora da Estrela",
        authors: ["Clarice Lispector"],
      },
      {
        title: "Hora da estrela — edição comemorativa",
        authors: ["Lispector, Clarice"],
      },
    );
    expect(exact).toMatchObject({
      match: true,
      method: "normalized_title",
      confidence: 1,
    });

    const fuzzy = assessWorkIdentity(
      {
        title: "Grande Sertão: Veredas",
        authors: ["João Guimarães Rosa"],
      },
      {
        title: "Grande Sertao Vereda",
        authors: ["Rosa, Joao Guimaraes"],
      },
    );
    expect(fuzzy.match).toBe(true);
    expect(fuzzy.method).toBe("fuzzy_title");
    expect(fuzzy.confidence).toBeGreaterThanOrEqual(0.86);
  });

  it("blocks special editions, conflicting volumes and translations", () => {
    expect(identityBlockers("Box Livro de atividades — Volume II")).toEqual(
      expect.arrayContaining(["box", "livro_de_atividades", "volume:2"]),
    );
    expect(
      shouldGroupWorks(
        {
          title: "Dom Casmurro",
          authors: ["Machado de Assis"],
        },
        {
          title: "Dom Casmurro: guia de leitura",
          authors: ["Machado de Assis"],
        },
      ),
    ).toBe(false);
    expect(
      assessWorkIdentity(
        {
          title: "Crônicas de Gelo e Fogo — Volume 1",
          authors: ["George Martin"],
        },
        {
          title: "Crônicas de Gelo e Fogo — Volume 2",
          authors: ["George Martin"],
        },
      ),
    ).toMatchObject({ match: false, method: "blocked" });
    expect(
      shouldGroupWorks(
        {
          title: "The Blindness",
          authors: ["José Saramago"],
        },
        {
          title: "Ensaio sobre a cegueira",
          authors: ["Saramago, Jose"],
        },
      ),
    ).toBe(false);
  });
});

describe("catalog sanitization and retailer destinations", () => {
  it("removes markup, unsafe URLs and invalid edition identifiers", () => {
    expect(
      sanitizeDescription(
        "<p>Uma história &amp; memória.</p><script>alert(1)</script>",
      ),
    ).toBe("Uma história & memória.");

    expect(
      sanitizeCatalogWork({
        ...work(),
        description: "<p>Texto&nbsp;seguro</p>",
        subjects: ["Clássicos", "clássicos", "", 123],
        coverUrl: "javascript:alert(1)",
      }),
    ).toMatchObject({
      description: "Texto seguro",
      subjects: ["Clássicos"],
      coverUrl: "",
    });

    expect(
      sanitizeCatalogEdition({
        ...edition(),
        isbn10: "6580309310",
        isbn13: "9786580309310",
        pageCount: -1,
      }),
    ).toMatchObject({ isbn10: "", isbn13: "", pageCount: null });
  });

  it("builds neutral retailer searches using ISBN-13 first", () => {
    const input = {
      editionKey: "OL123M",
      isbn13: "978-65-80309-31-3",
      isbn10: "6580309318",
      title: "Torto Arado",
      authors: ["Itamar Vieira Junior"],
    };
    expect(buildRetailerSearchUrl("amazon_br", input)).toBe(
      "https://www.amazon.com.br/s?k=9786580309313",
    );
    expect(buildRetailerSearchUrl("estante_virtual", input)).toBe(
      "https://www.estantevirtual.com.br/busca?q=9786580309313",
    );
    expect(buildRetailerSearchUrl("mercado_livre", input)).toBe(
      "https://lista.mercadolivre.com.br/9786580309313",
    );
    const destinations = buildRetailerDestinations(input);
    expect(destinations.map((item) => item.retailer)).toEqual([
      "amazon_br",
      "estante_virtual",
      "mercado_livre",
    ]);
    expect(destinations.map((item) => item.label)).toEqual([
      "Buscar na loja",
      "Buscar na loja",
      "Buscar na loja",
    ]);
  });

  it("falls back to title plus author and validates direct-link allowlists", () => {
    expect(
      buildRetailerSearchUrl("amazon_br", {
        title: "A hora da estrela",
        authors: ["Clarice Lispector"],
      }),
    ).toContain("A%20hora%20da%20estrela%20Clarice%20Lispector");

    const affiliateUrl =
      "https://www.amazon.com.br/dp/6555320354?tag=entrecapitu04-20";
    expect(isRetailerUrl("amazon_br", affiliateUrl)).toBe(true);
    expect(
      sanitizeRetailerDestination({
        ...destination(),
        url: affiliateUrl,
        kind: "direct",
        affiliate: true,
        label: "",
      }),
    ).toEqual({
      retailer: "amazon_br",
      editionKey: "OL123M",
      url: affiliateUrl,
      kind: "direct",
      affiliate: true,
      label: "Ver esta edição na loja",
    });
    expect(
      isRetailerUrl(
        "amazon_br",
        "https://amazon.com.br.example.net/dp/6555320354",
      ),
    ).toBe(false);
    expect(
      sanitizeRetailerDestination({
        ...destination(),
        url: "javascript:alert(1)",
      }),
    ).toBeNull();
  });
});

describe("book catalog client", () => {
  it("derives the Edge endpoint and Supabase headers from public config", () => {
    expect(
      getBookCatalogConfig({
        VITE_SUPABASE_URL: "https://project.supabase.co/",
        VITE_SUPABASE_ANON_KEY: "public-anon-key",
      }),
    ).toEqual({
      endpoint:
        "https://project.supabase.co/functions/v1/book-catalog",
      headers: {
        apikey: "public-anon-key",
        Authorization: "Bearer public-anon-key",
      },
    });
    expect(() => getBookCatalogConfig({})).toThrowError(
      expect.objectContaining({ code: "missing_endpoint" }),
    );
    expect(() =>
      getBookCatalogConfig({
        VITE_BOOK_CATALOG_ENDPOINT: "http://example.com/function",
      }),
    ).toThrowError(expect.objectContaining({ code: "invalid_endpoint" }));
  });

  it("creates a session Authorization resolver", async () => {
    const resolver = createBookCatalogAuthHeaderResolver(
      async () => "session-token",
    );
    await expect(resolver()).resolves.toEqual({
      Authorization: "Bearer session-token",
    });
    await expect(
      createBookCatalogAuthHeaderResolver(() => null)(),
    ).resolves.toEqual({});
  });

  it("posts search operations, sanitizes results and caches defensive copies", async () => {
    const fetchImpl = vi.fn(async (_input, init) => {
      expect(init?.headers).toMatchObject({
        apikey: "anon-key",
        Authorization: "Bearer session-token",
        "Content-Type": "application/json",
      });
      expect(JSON.parse(String(init?.body))).toEqual({
        operation: "search",
        query: "Saramago",
        page: 2,
        language: "por",
        subject: "Romance",
        sort: "newest",
      });
      return jsonResponse({
        ...responseBase("search"),
        works: [
          {
            ...work(),
            description: "<p>Descrição &amp; memória.</p>",
            coverUrl: "javascript:alert(1)",
          },
          { title: "Sem chave" },
        ],
        pagination: {
          page: 2,
          pageSize: 18,
          total: 20,
          hasMore: true,
        },
      });
    });
    const client = createBookCatalogClient({
      endpoint:
        "https://project.supabase.co/functions/v1/book-catalog",
      headers: {
        apikey: "anon-key",
        Authorization: "Bearer anon-key",
      },
      resolveHeaders: async () => ({
        Authorization: "Bearer session-token",
      }),
      fetchImpl: fetchImpl as typeof fetch,
      now: () => NOW,
    });
    const params = {
      query: " Saramago ",
      page: 2,
      language: "por",
      subject: "Romance",
      sort: "newest" as const,
    };

    const first = await client.search(params);
    expect(first).toMatchObject({
      operation: "search",
      stale: false,
      source: "open_library",
      pagination: { page: 2, pageSize: 18, total: 20, hasMore: true },
    });
    expect(first.works).toHaveLength(1);
    expect(first.works[0]).toMatchObject({
      description: "Descrição & memória.",
      coverUrl: "",
    });
    first.works[0].title = "Mutação local";

    const cached = await client.search(params);
    expect(cached.works[0].title).toBe("A hora da estrela");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("normalizes work details and filters unsafe retailer links", async () => {
    const client = createBookCatalogClient({
      endpoint:
        "https://project.supabase.co/functions/v1/book-catalog",
      headers: {},
      now: () => NOW,
      fetchImpl: async (_input, init) => {
        expect(JSON.parse(String(init?.body))).toEqual({
          operation: "work",
          workKey: "OL27448W",
          editionPage: 3,
        });
        return jsonResponse({
          ...responseBase("work"),
          work: work(),
          editions: [edition(), { publisher: "Sem chave" }],
          destinations: [
            destination(),
            {
              ...destination(),
              retailer: "mercado_livre",
              url: "https://evil.example/redirect",
            },
          ],
          pagination: {
            page: 3,
            pageSize: 12,
            total: 25,
            hasMore: true,
          },
        });
      },
    });

    const result = await client.work("/works/OL27448W", 3);
    expect(result.work.workKey).toBe("OL27448W");
    expect(result.editions).toHaveLength(1);
    expect(result.destinations).toEqual([destination()]);
  });

  it("loads a curated collection through the same neutral contract", async () => {
    const client = createBookCatalogClient({
      endpoint:
        "https://project.supabase.co/functions/v1/book-catalog",
      headers: {},
      now: () => NOW,
      fetchImpl: async (_input, init) => {
        expect(JSON.parse(String(init?.body))).toEqual({
          operation: "collection",
          slug: "escolhas-da-casa",
        });
        return jsonResponse({
          ...responseBase("collection"),
          collection: {
            slug: "escolhas-da-casa",
            title: "Escolhas da casa",
            description: "<p>Leituras para conversar.</p>",
          },
          pagination: {
            page: 1,
            pageSize: 18,
            total: 1,
            hasMore: false,
          },
        });
      },
    });

    await expect(client.collection("ESCOLHAS-DA-CASA")).resolves.toMatchObject({
      operation: "collection",
      collection: {
        slug: "escolhas-da-casa",
        title: "Escolhas da casa",
        description: "Leituras para conversar.",
      },
      works: [expect.objectContaining({ workKey: "OL27448W" })],
    });
  });

  it("allows resolve to return no match", async () => {
    const client = createBookCatalogClient({
      endpoint:
        "https://project.supabase.co/functions/v1/book-catalog",
      headers: {},
      now: () => NOW,
      fetchImpl: async (_input, init) => {
        expect(JSON.parse(String(init?.body))).toEqual({
          operation: "resolve",
          isbn: "9786580309313",
        });
        return jsonResponse({
          ...responseBase("resolve"),
          works: [],
          work: null,
          editions: [],
          destinations: [],
        });
      },
    });

    await expect(
      client.resolve({ isbn: "978-65-80309-31-3" }),
    ).resolves.toMatchObject({
      operation: "resolve",
      work: null,
      works: [],
    });
  });

  it("validates requests before fetch and surfaces typed HTTP errors", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: "catalog_rate_limited",
            message: "Muitas consultas.",
            retryAfterSeconds: 30,
          },
        },
        429,
      ),
    );
    const client = createBookCatalogClient({
      endpoint:
        "https://project.supabase.co/functions/v1/book-catalog",
      headers: {},
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(client.search({ query: " " })).rejects.toMatchObject({
      code: "invalid_query",
    });
    await expect(
      client.resolve({ isbn: "9786580309310" }),
    ).rejects.toMatchObject({ code: "invalid_isbn" });
    expect(fetchImpl).not.toHaveBeenCalled();

    const error = await client
      .collection("destaques")
      .catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(BookCatalogError);
    expect(error).toMatchObject({
      code: "catalog_rate_limited",
      status: 429,
      retryAfterSeconds: 30,
      message: "Muitas consultas.",
    });
  });
});
