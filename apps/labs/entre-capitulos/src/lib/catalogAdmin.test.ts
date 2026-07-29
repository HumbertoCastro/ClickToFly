import { describe, expect, it } from "vitest";
import type {
  AdminCatalogEdition,
  AdminCatalogWork,
} from "./catalogAdmin";
import {
  buildIdentitySuggestions,
  CatalogAdminError,
  CatalogAdminReadOnlyError,
  collectionSlug,
  createManualCatalogKey,
  createReadOnlyCatalogAdminClient,
  splitCatalogTerms,
  validateDirectRetailerLink,
  validateManualEdition,
  validateManualWork,
} from "./catalogAdmin";

const now = "2026-07-29T12:00:00.000Z";

function work(
  overrides: Partial<AdminCatalogWork> = {},
): AdminCatalogWork {
  return {
    workKey: "manual:grande-sertao:um",
    title: "Grande Sertão: Veredas",
    authors: ["João Guimarães Rosa"],
    firstPublishedYear: 1956,
    description: "",
    subjects: [],
    languages: ["por"],
    coverUrl: "",
    editionCount: 1,
    source: "manual",
    primaryEditionKey: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function edition(
  overrides: Partial<AdminCatalogEdition> = {},
): AdminCatalogEdition {
  return {
    editionKey: "manual:edicao:um",
    workKey: "manual:grande-sertao:um",
    isbn10: "6580309318",
    isbn13: "9786580309313",
    publisher: "Editora",
    publishedDate: "2024",
    language: "por",
    format: "Brochura",
    pageCount: 320,
    coverUrl: "",
    source: "manual",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("catalog admin input helpers", () => {
  it("normalizes collection slugs, lists and valid manual keys", () => {
    expect(collectionSlug("  Ficção & Memória  ")).toBe(
      "ficcao-memoria",
    );
    expect(
      splitCatalogTerms("Romance, memória; Romance\nLiteratura brasileira"),
    ).toEqual(["Romance", "memória", "Literatura brasileira"]);
    expect(createManualCatalogKey("work", "A Hora da Estrela", "Teste 01")).toMatch(
      /^manual:[a-z0-9][a-z0-9:_-]{2,95}$/,
    );
    expect(
      createManualCatalogKey("edition", "Edição comemorativa", "Teste 02"),
    ).toMatch(/^manual:[a-z0-9][a-z0-9:_-]{2,110}$/);
  });

  it("validates manual works and requires authors", () => {
    expect(
      validateManualWork({
        title: "  Torto Arado ",
        authors: [" Itamar Vieira Junior "],
        firstPublishedYear: 2019,
        coverUrl: "https://example.com/capa.webp",
        subjects: [" Romance "],
        languages: [" POR "],
      }),
    ).toMatchObject({
      title: "Torto Arado",
      authors: ["Itamar Vieira Junior"],
      firstPublishedYear: 2019,
      subjects: ["Romance"],
      languages: ["por"],
    });
    expect(() =>
      validateManualWork({
        title: "Sem autoria",
        authors: [],
      }),
    ).toThrowError("Informe ao menos uma autoria.");
    expect(() =>
      validateManualWork({
        title: "Capa insegura",
        authors: ["Autoria"],
        coverUrl: "javascript:alert(1)",
      }),
    ).toThrowError("URL HTTPS");
  });

  it("checks edition ISBNs and derives ISBN-13 from ISBN-10", () => {
    expect(
      validateManualEdition({
        workKey: "OL24141556W",
        isbn10: "6580309318",
        pageCount: 264,
      }),
    ).toMatchObject({
      workKey: "OL24141556W",
      isbn10: "6580309318",
      isbn13: "9786580309313",
      pageCount: 264,
    });
    expect(() =>
      validateManualEdition({
        workKey: "OL24141556W",
        isbn13: "9786580309310",
      }),
    ).toThrowError("checksum válido");
    expect(() =>
      validateManualEdition({
        workKey: "OL24141556W",
        pageCount: 0,
      }),
    ).toThrowError("páginas deve ser positiva");
  });

  it("enforces the retailer allowlists and keeps the affiliate marker", () => {
    expect(
      validateDirectRetailerLink({
        workKey: "OL24141556W",
        editionKey: "OL35663926M",
        retailer: "amazon_br",
        url: "https://www.amazon.com.br/dp/6580309318?tag=entrecapitu04-20",
        affiliate: true,
      }),
    ).toEqual({
      workKey: "OL24141556W",
      editionKey: "OL35663926M",
      retailer: "amazon_br",
      url: "https://www.amazon.com.br/dp/6580309318?tag=entrecapitu04-20",
      affiliate: true,
    });
    expect(() =>
      validateDirectRetailerLink({
        workKey: "OL24141556W",
        retailer: "amazon_br",
        url: "https://amazon.com.br.example.net/dp/6580309318",
      }),
    ).toThrowError("amazon.com.br");
  });
});

describe("catalog identity review", () => {
  it("exposes automatic method and confidence without deleting editions", () => {
    const works = [
      work(),
      work({
        workKey: "manual:grande-sertao:dois",
        title: "Grande Sertao Vereda",
      }),
    ];
    const editions = [
      edition(),
      edition({
        editionKey: "manual:edicao:dois",
        workKey: "manual:grande-sertao:dois",
        isbn10: "",
        isbn13: "",
      }),
    ];
    const suggestions = buildIdentitySuggestions({ works, editions });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].decision).toMatchObject({
      match: true,
      method: "fuzzy_title",
    });
    expect(suggestions[0].decision.confidence).toBeGreaterThanOrEqual(0.86);
    expect(editions).toHaveLength(2);
  });

  it("surfaces volume conflicts as an editorial blocker", () => {
    const suggestions = buildIdentitySuggestions({
      works: [
        work({ title: "Crônicas de Gelo e Fogo — Volume 1" }),
        work({
          workKey: "manual:cronicas:dois",
          title: "Crônicas de Gelo e Fogo — Volume 2",
        }),
      ],
      editions: [],
    });
    expect(suggestions[0].decision).toMatchObject({
      match: false,
      method: "blocked",
    });
  });
});

describe("read-only curation", () => {
  it("loads demonstrative data and rejects every remote mutation", async () => {
    const client = createReadOnlyCatalogAdminClient();
    const snapshot = await client.loadSnapshot();
    expect(client).toMatchObject({ mode: "readonly", readOnly: true });
    expect(snapshot.works.length).toBeGreaterThan(0);
    expect(snapshot.collections[0]).toMatchObject({
      slug: "em-destaque",
      published: true,
    });
    expect(snapshot.retailerLinks).toHaveLength(4);
    expect(snapshot.retailerLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          retailer: "amazon_br",
          kind: "direct",
          affiliate: true,
        }),
      ]),
    );
    await expect(
      client.createManualWork({
        title: "Obra",
        authors: ["Autoria"],
      }),
    ).rejects.toBeInstanceOf(CatalogAdminReadOnlyError);
    await expect(
      client.saveRetailerLink({
        workKey: "OL24141556W",
        retailer: "amazon_br",
        url: "https://www.amazon.com.br/dp/6580309318",
      }),
    ).rejects.toBeInstanceOf(CatalogAdminError);
  });
});
