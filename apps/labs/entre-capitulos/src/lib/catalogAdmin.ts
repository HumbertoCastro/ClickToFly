import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  CatalogEdition,
  CatalogIdentityDecision,
  CatalogRetailer,
  CatalogWork,
} from "../catalogTypes";
import {
  assessWorkIdentity,
  isRetailerUrl,
  isValidIsbn10,
  isValidIsbn13,
  isbn10To13,
  normalizeIsbn,
} from "./bookCatalog";
import {
  isDemoMode,
  isSupabaseConfigured,
  supabaseConfig,
} from "./repository";
import { runtimeBookCatalogClient } from "./catalogRuntime";
import {
  demoAmazonOverrides,
  demoCatalogEditions,
  demoCatalogWorks,
} from "../data/catalogDemo";

const COVER_BUCKET = "catalog-covers";
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type IdentityRuleAction = "merge" | "separate";
type IdentityRuleMethod =
  | "manual"
  | "same_work_key"
  | "shared_isbn"
  | "exact"
  | "fuzzy";

export interface AdminCatalogWork extends CatalogWork {
  source: "open_library" | "manual";
  primaryEditionKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCatalogEdition extends CatalogEdition {
  workKey: string;
  source: "open_library" | "manual";
  createdAt: string;
  updatedAt: string;
}

export interface AdminCatalogCollection {
  id: string;
  slug: string;
  title: string;
  description: string;
  badge: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCatalogCollectionItem {
  id: string;
  collectionId: string;
  workKey: string;
  editionKey: string | null;
  editorialText: string;
  badge: string;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCatalogIdentityRule {
  id: string;
  action: IdentityRuleAction;
  workKeyA: string;
  workKeyB: string;
  editionKey: string | null;
  method: IdentityRuleMethod;
  confidence: number;
  note: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCatalogRetailerLink {
  id: string;
  workKey: string;
  editionKey: string | null;
  retailer: CatalogRetailer;
  url: string;
  kind: "direct";
  affiliate: boolean;
  label: string;
  legacyAsin: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogAdminSnapshot {
  works: AdminCatalogWork[];
  editions: AdminCatalogEdition[];
  collections: AdminCatalogCollection[];
  collectionItems: AdminCatalogCollectionItem[];
  identityRules: AdminCatalogIdentityRule[];
  retailerLinks: AdminCatalogRetailerLink[];
}

export interface ManualWorkInput {
  title: string;
  authors: string[];
  firstPublishedYear?: number | null;
  description?: string;
  subjects?: string[];
  languages?: string[];
  coverUrl?: string;
}

export interface ManualEditionInput {
  workKey: string;
  isbn10?: string;
  isbn13?: string;
  publisher?: string;
  publishedDate?: string;
  language?: string;
  format?: string;
  pageCount?: number | null;
  coverUrl?: string;
}

export interface CollectionInput {
  slug: string;
  title: string;
  description?: string;
  badge?: string;
  featured?: boolean;
  published?: boolean;
}

export interface CollectionItemInput {
  collectionId: string;
  workKey: string;
  editionKey?: string | null;
  editorialText?: string;
  badge?: string;
  featured?: boolean;
}

export interface IdentityRuleInput {
  action: IdentityRuleAction;
  workKeyA: string;
  workKeyB: string;
  editionKey?: string | null;
  method?: IdentityRuleMethod;
  confidence?: number;
  note?: string;
}

export interface RetailerLinkInput {
  workKey: string;
  editionKey?: string | null;
  retailer: CatalogRetailer;
  url: string;
  affiliate?: boolean;
}

export interface CatalogIdentitySuggestion {
  workA: AdminCatalogWork;
  workB: AdminCatalogWork;
  decision: CatalogIdentityDecision;
}

export interface CatalogAdminClient {
  readonly mode: "supabase" | "readonly";
  readonly readOnly: boolean;
  loadSnapshot(): Promise<CatalogAdminSnapshot>;
  importOpenLibraryWork(workKey: string): Promise<string>;
  createManualWork(input: ManualWorkInput): Promise<string>;
  createManualEdition(input: ManualEditionInput): Promise<string>;
  setPrimaryEdition(workKey: string, editionKey: string): Promise<void>;
  uploadCover(
    workKey: string,
    editionKey: string | null,
    file: File,
  ): Promise<string>;
  saveCollection(
    input: CollectionInput,
    collectionId?: string,
  ): Promise<string>;
  setCollectionPublished(
    collectionId: string,
    published: boolean,
  ): Promise<void>;
  setCollectionFeatured(
    collectionId: string,
    featured: boolean,
  ): Promise<void>;
  moveCollection(collectionId: string, direction: -1 | 1): Promise<void>;
  saveCollectionItem(
    input: CollectionItemInput,
    itemId?: string,
  ): Promise<string>;
  moveCollectionItem(itemId: string, direction: -1 | 1): Promise<void>;
  removeCollectionItem(itemId: string): Promise<void>;
  recordIdentityRule(input: IdentityRuleInput): Promise<string>;
  saveRetailerLink(input: RetailerLinkInput): Promise<string>;
  setRetailerLinkActive(linkId: string, active: boolean): Promise<void>;
}

export class CatalogAdminError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "CatalogAdminError";
  }
}

export class CatalogAdminReadOnlyError extends CatalogAdminError {
  constructor() {
    super(
      "A curadoria está em modo demonstrativo. Entre no ambiente Supabase autenticado para salvar alterações.",
    );
    this.name = "CatalogAdminReadOnlyError";
  }
}

type UnknownRow = Record<string, unknown>;

function text(value: unknown, max = 10_000) {
  return typeof value === "string"
    ? value.split("\u0000").join("").trim().slice(0, max)
    : "";
}

function nullableText(value: unknown, max = 10_000) {
  const parsed = text(value, max);
  return parsed || null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => text(item, 500))
    .filter((item, index, items) => item && items.indexOf(item) === index);
}

function integer(value: unknown, fallback = 0) {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function timestamp(value: unknown) {
  return text(value, 80) || new Date().toISOString();
}

function slugPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function collectionSlug(value: string) {
  return slugPart(value);
}

export function splitCatalogTerms(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(
      (item, index, items) =>
        item.length > 0 &&
        items.findIndex(
          (candidate) =>
            candidate.toLocaleLowerCase("pt-BR") ===
            item.toLocaleLowerCase("pt-BR"),
        ) === index,
    );
}

export function createManualCatalogKey(
  kind: "work" | "edition",
  label: string,
  entropy = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
) {
  const readable = slugPart(label) || kind;
  const maximum = kind === "work" ? 96 : 111;
  return `manual:${readable}:${slugPart(entropy) || "local"}`.slice(0, maximum);
}

function validHttpsUrl(value: string) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

export function validateManualWork(input: ManualWorkInput): ManualWorkInput {
  const title = text(input.title, 500);
  const authors = input.authors
    .map((author) => text(author, 300))
    .filter(Boolean);
  const year = input.firstPublishedYear ?? null;
  const coverUrl = text(input.coverUrl, 2_000);

  if (!title) throw new CatalogAdminError("Informe o título da obra.");
  if (authors.length === 0) {
    throw new CatalogAdminError("Informe ao menos uma autoria.");
  }
  if (
    year !== null &&
    (!Number.isInteger(year) || year < 1000 || year > 2200)
  ) {
    throw new CatalogAdminError(
      "O ano da primeira publicação deve ficar entre 1000 e 2200.",
    );
  }
  if (!validHttpsUrl(coverUrl)) {
    throw new CatalogAdminError("A capa deve usar uma URL HTTPS válida.");
  }

  return {
    title,
    authors,
    firstPublishedYear: year,
    description: text(input.description, 20_000),
    subjects: (input.subjects ?? []).map((item) => text(item, 300)).filter(Boolean),
    languages: (input.languages ?? [])
      .map((item) => text(item, 35).toLocaleLowerCase("pt-BR"))
      .filter(Boolean),
    coverUrl,
  };
}

export function validateManualEdition(
  input: ManualEditionInput,
): ManualEditionInput {
  const workKey = text(input.workKey, 160);
  const isbn10 = normalizeIsbn(input.isbn10 ?? "");
  let isbn13 = normalizeIsbn(input.isbn13 ?? "");
  const coverUrl = text(input.coverUrl, 2_000);
  const pageCount = input.pageCount ?? null;

  if (!workKey) throw new CatalogAdminError("Escolha a obra desta edição.");
  if (isbn10 && !isValidIsbn10(isbn10)) {
    throw new CatalogAdminError("O ISBN-10 não possui um checksum válido.");
  }
  if (isbn13 && !isValidIsbn13(isbn13)) {
    throw new CatalogAdminError("O ISBN-13 não possui um checksum válido.");
  }
  if (isbn10 && !isbn13) isbn13 = isbn10To13(isbn10) ?? "";
  if (
    pageCount !== null &&
    (!Number.isInteger(pageCount) || pageCount < 1)
  ) {
    throw new CatalogAdminError("A quantidade de páginas deve ser positiva.");
  }
  if (!validHttpsUrl(coverUrl)) {
    throw new CatalogAdminError("A capa deve usar uma URL HTTPS válida.");
  }

  return {
    workKey,
    isbn10,
    isbn13,
    publisher: text(input.publisher, 500),
    publishedDate: text(input.publishedDate, 80),
    language: text(input.language, 35).toLocaleLowerCase("pt-BR"),
    format: text(input.format, 120),
    pageCount,
    coverUrl,
  };
}

export function validateDirectRetailerLink(
  input: RetailerLinkInput,
): RetailerLinkInput {
  const workKey = text(input.workKey, 160);
  const editionKey = nullableText(input.editionKey, 160);
  const url = text(input.url, 2_000);
  if (!workKey) throw new CatalogAdminError("Escolha a obra do link.");
  if (!isRetailerUrl(input.retailer, url)) {
    const retailerLabels: Record<CatalogRetailer, string> = {
      amazon_br: "amazon.com.br",
      estante_virtual: "estantevirtual.com.br",
      mercado_livre: "mercadolivre.com.br",
    };
    throw new CatalogAdminError(
      `Use uma URL HTTPS válida de ${retailerLabels[input.retailer]}.`,
    );
  }
  return {
    workKey,
    editionKey,
    retailer: input.retailer,
    url,
    affiliate: Boolean(input.affiliate),
  };
}

function mapWork(row: UnknownRow): AdminCatalogWork {
  return {
    workKey: text(row.work_key, 160),
    title: text(row.title, 500),
    authors: stringArray(row.authors),
    firstPublishedYear:
      row.first_published_year === null ||
      row.first_published_year === undefined
        ? null
        : integer(row.first_published_year),
    description: text(row.description),
    subjects: stringArray(row.subjects),
    languages: stringArray(row.languages),
    coverUrl: text(row.cover_url, 2_000),
    editionCount: integer(row.edition_count),
    source: row.source === "manual" ? "manual" : "open_library",
    primaryEditionKey: nullableText(row.primary_edition_key, 160),
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  };
}

function mapEdition(row: UnknownRow): AdminCatalogEdition {
  return {
    editionKey: text(row.edition_key, 160),
    workKey: text(row.work_key, 160),
    isbn10: text(row.isbn_10, 10),
    isbn13: text(row.isbn_13, 13),
    publisher: text(row.publisher, 500),
    publishedDate: text(row.published_date, 80),
    language: text(row.language, 35),
    format: text(row.format, 120),
    pageCount:
      row.page_count === null || row.page_count === undefined
        ? null
        : integer(row.page_count),
    coverUrl: text(row.cover_url, 2_000),
    source: row.source === "manual" ? "manual" : "open_library",
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  };
}

function mapCollection(row: UnknownRow): AdminCatalogCollection {
  return {
    id: text(row.id, 80),
    slug: text(row.slug, 120),
    title: text(row.title, 120),
    description: text(row.description),
    badge: text(row.badge, 120),
    featured: Boolean(row.featured),
    published: Boolean(row.published),
    sortOrder: integer(row.sort_order),
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  };
}

function mapCollectionItem(row: UnknownRow): AdminCatalogCollectionItem {
  return {
    id: text(row.id, 80),
    collectionId: text(row.collection_id, 80),
    workKey: text(row.work_key, 160),
    editionKey: nullableText(row.edition_key, 160),
    editorialText: text(row.editorial_text),
    badge: text(row.badge, 120),
    featured: Boolean(row.featured),
    sortOrder: integer(row.sort_order),
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  };
}

function mapIdentityRule(row: UnknownRow): AdminCatalogIdentityRule {
  const method = text(row.method, 40) as IdentityRuleMethod;
  return {
    id: text(row.id, 80),
    action: row.action === "separate" ? "separate" : "merge",
    workKeyA: text(row.work_key_a, 160),
    workKeyB: text(row.work_key_b, 160),
    editionKey: nullableText(row.edition_key, 160),
    method,
    confidence: Number(row.confidence) || 0,
    note: text(row.note),
    active: row.active !== false,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  };
}

function mapRetailerLink(row: UnknownRow): AdminCatalogRetailerLink {
  return {
    id: text(row.id, 80),
    workKey: text(row.work_key, 160),
    editionKey: nullableText(row.edition_key, 160),
    retailer: text(row.retailer, 40) as CatalogRetailer,
    url: text(row.url, 2_000),
    kind: "direct",
    affiliate: Boolean(row.affiliate),
    label: text(row.label, 200) || "Ver esta edição na loja",
    legacyAsin: nullableText(row.legacy_asin, 10),
    active: row.active !== false,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  };
}

function withEditionCounts(
  works: AdminCatalogWork[],
  editions: AdminCatalogEdition[],
) {
  const counts = new Map<string, number>();
  for (const edition of editions) {
    counts.set(edition.workKey, (counts.get(edition.workKey) ?? 0) + 1);
  }
  return works.map((work) => ({
    ...work,
    editionCount: counts.get(work.workKey) ?? 0,
  }));
}

function demoSnapshot(): CatalogAdminSnapshot {
  const now = new Date().toISOString();
  const editions = Object.entries(demoCatalogEditions).flatMap(
    ([workKey, workEditions]) =>
      workEditions.map((edition) => ({
        ...edition,
        workKey,
        source: edition.editionKey.startsWith("OL")
          ? ("open_library" as const)
          : ("manual" as const),
        createdAt: now,
        updatedAt: now,
      })),
  );
  const works = demoCatalogWorks.map((work) => ({
    ...work,
    source: "open_library" as const,
    primaryEditionKey:
      demoCatalogEditions[work.workKey]?.[0]?.editionKey ?? null,
    createdAt: now,
    updatedAt: now,
    editionCount: editions.filter(
      (edition) => edition.workKey === work.workKey,
    ).length,
  }));
  const collectionId = "demo-collection-destaques";
  const editionWorkKeys = new Map(
    editions.map((edition) => [edition.editionKey, edition.workKey]),
  );
  return {
    works,
    editions,
    collections: [
      {
        id: collectionId,
        slug: "em-destaque",
        title: "Escolhas da casa",
        description:
          "Obras que abriram conversas e continuam circulando entre nossas estantes.",
        badge: "Curadoria da casa",
        featured: true,
        published: true,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
    collectionItems: works.map((work, index) => ({
      id: `demo-item-${index + 1}`,
      collectionId,
      workKey: work.workKey,
      editionKey: work.primaryEditionKey,
      editorialText:
        index === 0
          ? "Uma história sobre terra, memória e o que se transmite entre gerações."
          : "",
      badge: index === 0 ? "Comece por aqui" : "",
      featured: index === 0,
      sortOrder: index,
      createdAt: now,
      updatedAt: now,
    })),
    identityRules: [
      {
        id: "demo-rule-torto-arado",
        action: "merge",
        workKeyA: works[0].workKey,
        workKeyB: works[1].workKey,
        editionKey: null,
        method: "manual",
        confidence: 1,
        note: "Exemplo visual de uma decisão editorial; não representa uma união real.",
        active: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    retailerLinks: Object.entries(demoAmazonOverrides).flatMap(
      ([editionKey, url], index) => {
        const workKey = editionWorkKeys.get(editionKey);
        if (!workKey) return [];
        return [
          {
            id: `demo-retailer-link-${index + 1}`,
            workKey,
            editionKey,
            retailer: "amazon_br" as const,
            url,
            kind: "direct" as const,
            affiliate: true,
            label: "Ver esta edição na loja",
            legacyAsin: new URL(url).pathname.match(/\/dp\/([A-Z0-9]{10})/i)?.[1] ?? null,
            active: true,
            createdAt: now,
            updatedAt: now,
          },
        ];
      },
    ),
  };
}

export function buildIdentitySuggestions(
  snapshot: Pick<CatalogAdminSnapshot, "works" | "editions">,
  minimumConfidence = 0.7,
): CatalogIdentitySuggestion[] {
  const works = snapshot.works.slice(0, 150);
  const isbnsByWork = new Map<string, string[]>();
  for (const edition of snapshot.editions) {
    const values = isbnsByWork.get(edition.workKey) ?? [];
    if (edition.isbn10) values.push(edition.isbn10);
    if (edition.isbn13) values.push(edition.isbn13);
    isbnsByWork.set(edition.workKey, values);
  }

  const suggestions: CatalogIdentitySuggestion[] = [];
  for (let leftIndex = 0; leftIndex < works.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < works.length;
      rightIndex += 1
    ) {
      const workA = works[leftIndex];
      const workB = works[rightIndex];
      const decision = assessWorkIdentity(
        {
          workKey: workA.workKey,
          title: workA.title,
          authors: workA.authors,
          isbns: isbnsByWork.get(workA.workKey) ?? [],
        },
        {
          workKey: workB.workKey,
          title: workB.title,
          authors: workB.authors,
          isbns: isbnsByWork.get(workB.workKey) ?? [],
        },
      );
      if (
        decision.match ||
        decision.method === "blocked" ||
        decision.confidence >= minimumConfidence
      ) {
        suggestions.push({ workA, workB, decision });
      }
    }
  }
  return suggestions.sort(
    (left, right) => right.decision.confidence - left.decision.confidence,
  );
}

function ensureRows<T>(
  response: { data: T[] | null; error: { message: string } | null },
  label: string,
) {
  if (response.error) {
    throw new CatalogAdminError(
      `${label}: ${response.error.message}. Confirme se a migration do catálogo foi aplicada.`,
    );
  }
  return response.data ?? [];
}

function ensureMutation(
  response: { error: { message: string } | null },
  label: string,
) {
  if (response.error) {
    throw new CatalogAdminError(`${label}: ${response.error.message}`);
  }
}

class SupabaseCatalogAdminClient implements CatalogAdminClient {
  readonly mode = "supabase" as const;
  readonly readOnly = false;

  constructor(private readonly client: SupabaseClient) {}

  async loadSnapshot(): Promise<CatalogAdminSnapshot> {
    const [
      worksResponse,
      editionsResponse,
      collectionsResponse,
      itemsResponse,
      identityResponse,
      retailerResponse,
    ] = await Promise.all([
      this.client.from("catalog_works").select("*").order("title"),
      this.client
        .from("catalog_editions")
        .select("*")
        .order("published_date", { ascending: false }),
      this.client
        .from("catalog_collections")
        .select("*")
        .order("sort_order")
        .order("created_at"),
      this.client
        .from("catalog_collection_items")
        .select("*")
        .order("sort_order")
        .order("created_at"),
      this.client
        .from("catalog_identity_rules")
        .select("*")
        .order("created_at", { ascending: false }),
      this.client
        .from("catalog_retailer_links")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    const editions = ensureRows(
      editionsResponse,
      "Não foi possível carregar as edições",
    ).map((row) => mapEdition(row as UnknownRow));
    const works = withEditionCounts(
      ensureRows(
        worksResponse,
        "Não foi possível carregar as obras",
      ).map((row) => mapWork(row as UnknownRow)),
      editions,
    );

    return {
      works,
      editions,
      collections: ensureRows(
        collectionsResponse,
        "Não foi possível carregar as coleções",
      ).map((row) => mapCollection(row as UnknownRow)),
      collectionItems: ensureRows(
        itemsResponse,
        "Não foi possível carregar os itens das coleções",
      ).map((row) => mapCollectionItem(row as UnknownRow)),
      identityRules: ensureRows(
        identityResponse,
        "Não foi possível carregar as regras de identidade",
      ).map((row) => mapIdentityRule(row as UnknownRow)),
      retailerLinks: ensureRows(
        retailerResponse,
        "Não foi possível carregar os links cadastrados",
      ).map((row) => mapRetailerLink(row as UnknownRow)),
    };
  }

  async importOpenLibraryWork(workKey: string) {
    const result = await runtimeBookCatalogClient.work(workKey);
    const { work } = result;
    const editionsByKey = new Map(
      result.editions.map((edition) => [edition.editionKey, edition]),
    );
    let editionPage = result.pagination.page + 1;
    let hasMore = result.pagination.hasMore;
    // Keep an editorial import below the public quota while covering up to
    // sixty representative editions. Further pages are persisted lazily when
    // the detail view requests them.
    while (hasMore && editionPage <= 5) {
      const page = await runtimeBookCatalogClient.work(workKey, editionPage);
      for (const edition of page.editions) {
        editionsByKey.set(edition.editionKey, edition);
      }
      hasMore = page.pagination.hasMore;
      editionPage += 1;
    }
    const editions = [...editionsByKey.values()];
    const primaryEdition =
      editions.find((edition) => edition.coverUrl && edition.isbn13) ??
      editions.find((edition) => edition.coverUrl) ??
      editions[0] ??
      null;

    ensureMutation(
      await this.client.from("catalog_works").upsert(
        {
          work_key: work.workKey,
          title: work.title,
          authors: work.authors,
          first_published_year: work.firstPublishedYear,
          description: work.description,
          subjects: work.subjects,
          languages: work.languages,
          cover_url: work.coverUrl,
          source: "open_library",
          primary_edition_key: null,
        },
        { onConflict: "work_key" },
      ),
      "Não foi possível importar a obra",
    );

    ensureMutation(
      await this.client.from("catalog_work_sources").upsert(
        {
          work_key: work.workKey,
          source: "open_library",
          source_key: work.workKey,
          alias_title: work.title,
          alias_authors: work.authors,
        },
        { onConflict: "source,source_key" },
      ),
      "Não foi possível registrar a origem da obra",
    );

    if (editions.length > 0) {
      ensureMutation(
        await this.client.from("catalog_editions").upsert(
          editions.map((edition) => ({
            edition_key: edition.editionKey,
            work_key: work.workKey,
            source: edition.editionKey.startsWith("OL")
              ? "open_library"
              : "manual",
            isbn_10: edition.isbn10,
            isbn_13: edition.isbn13,
            publisher: edition.publisher,
            published_date: edition.publishedDate,
            language: edition.language,
            format: edition.format,
            page_count: edition.pageCount,
            cover_url: edition.coverUrl,
          })),
          { onConflict: "edition_key" },
        ),
        "A obra foi importada, mas suas edições não puderam ser salvas",
      );
    }

    if (primaryEdition) {
      ensureMutation(
        await this.client
          .from("catalog_works")
          .update({
            primary_edition_key: primaryEdition.editionKey,
            cover_url: primaryEdition.coverUrl || work.coverUrl,
          })
          .eq("work_key", work.workKey),
        "Não foi possível escolher a edição principal",
      );
    }
    return work.workKey;
  }

  async createManualWork(input: ManualWorkInput) {
    const validated = validateManualWork(input);
    const workKey = createManualCatalogKey("work", validated.title);
    ensureMutation(
      await this.client.from("catalog_works").insert({
        work_key: workKey,
        title: validated.title,
        authors: validated.authors,
        first_published_year: validated.firstPublishedYear ?? null,
        description: validated.description ?? "",
        subjects: validated.subjects ?? [],
        languages: validated.languages ?? [],
        cover_url: validated.coverUrl ?? "",
        source: "manual",
      }),
      "Não foi possível criar a obra manual",
    );
    return workKey;
  }

  async createManualEdition(input: ManualEditionInput) {
    const validated = validateManualEdition(input);
    const editionKey = createManualCatalogKey(
      "edition",
      `${validated.publisher || "edicao"}-${validated.isbn13 || validated.isbn10 || validated.publishedDate || "manual"}`,
    );
    ensureMutation(
      await this.client.from("catalog_editions").insert({
        edition_key: editionKey,
        work_key: validated.workKey,
        source: "manual",
        isbn_10: validated.isbn10 ?? "",
        isbn_13: validated.isbn13 ?? "",
        publisher: validated.publisher ?? "",
        published_date: validated.publishedDate ?? "",
        language: validated.language ?? "",
        format: validated.format ?? "",
        page_count: validated.pageCount ?? null,
        cover_url: validated.coverUrl ?? "",
      }),
      "Não foi possível criar a edição manual",
    );
    return editionKey;
  }

  async setPrimaryEdition(workKey: string, editionKey: string) {
    const editionResponse = await this.client
      .from("catalog_editions")
      .select("cover_url")
      .eq("work_key", workKey)
      .eq("edition_key", editionKey)
      .maybeSingle();
    if (editionResponse.error) {
      throw new CatalogAdminError(
        `Não foi possível conferir a edição: ${editionResponse.error.message}`,
      );
    }
    if (!editionResponse.data) {
      throw new CatalogAdminError("A edição não pertence à obra escolhida.");
    }
    const coverUrl = text(
      (editionResponse.data as UnknownRow).cover_url,
      2_000,
    );
    ensureMutation(
      await this.client
        .from("catalog_works")
        .update({
          primary_edition_key: editionKey,
          ...(coverUrl ? { cover_url: coverUrl } : {}),
        })
        .eq("work_key", workKey),
      "Não foi possível definir a edição principal",
    );
  }

  async uploadCover(workKey: string, editionKey: string | null, file: File) {
    if (!ALLOWED_COVER_TYPES.has(file.type)) {
      throw new CatalogAdminError(
        "Envie uma capa JPEG, PNG, WebP ou AVIF.",
      );
    }
    if (file.size < 1 || file.size > MAX_COVER_BYTES) {
      throw new CatalogAdminError("A capa deve ter no máximo 5 MB.");
    }
    const extension =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type.split("/")[1]?.replace(/[^a-z0-9]/g, "") || "image";
    const safeWorkKey = workKey.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeEditionKey = (editionKey ?? "work").replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );
    const path = `${safeWorkKey}/${safeEditionKey}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`;
    const upload = await this.client.storage
      .from(COVER_BUCKET)
      .upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });
    if (upload.error) {
      throw new CatalogAdminError(
        `Não foi possível enviar a capa: ${upload.error.message}`,
      );
    }
    const publicUrl = this.client.storage
      .from(COVER_BUCKET)
      .getPublicUrl(path).data.publicUrl;

    const update = editionKey
      ? await this.client
          .from("catalog_editions")
          .update({ cover_url: publicUrl })
          .eq("work_key", workKey)
          .eq("edition_key", editionKey)
      : await this.client
          .from("catalog_works")
          .update({ cover_url: publicUrl })
          .eq("work_key", workKey);
    if (update.error) {
      await this.client.storage.from(COVER_BUCKET).remove([path]);
      throw new CatalogAdminError(
        `A capa foi enviada, mas não pôde ser associada: ${update.error.message}`,
      );
    }
    if (editionKey) {
      const workResponse = await this.client
        .from("catalog_works")
        .select("primary_edition_key")
        .eq("work_key", workKey)
        .maybeSingle();
      if (workResponse.error) {
        throw new CatalogAdminError(
          `A capa foi associada à edição, mas a obra não pôde ser conferida: ${workResponse.error.message}`,
        );
      }
      if (
        text(
          (workResponse.data as UnknownRow | null)?.primary_edition_key,
          160,
        ) === editionKey
      ) {
        ensureMutation(
          await this.client
            .from("catalog_works")
            .update({ cover_url: publicUrl })
            .eq("work_key", workKey),
          "A capa da edição foi enviada, mas a capa principal não pôde ser sincronizada",
        );
      }
    }
    return publicUrl;
  }

  async saveCollection(input: CollectionInput, collectionId?: string) {
    const slug = collectionSlug(input.slug || input.title);
    const title = text(input.title, 120);
    if (!slug) throw new CatalogAdminError("Informe um slug válido.");
    if (!title) throw new CatalogAdminError("Informe o título da coleção.");

    if (collectionId) {
      ensureMutation(
        await this.client
          .from("catalog_collections")
          .update({
            slug,
            title,
            description: text(input.description),
            badge: text(input.badge, 120),
            featured: Boolean(input.featured),
            published: Boolean(input.published),
          })
          .eq("id", collectionId),
        "Não foi possível atualizar a coleção",
      );
      return collectionId;
    }

    const orderResponse = await this.client
      .from("catalog_collections")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (orderResponse.error) {
      throw new CatalogAdminError(
        `Não foi possível calcular a posição da coleção: ${orderResponse.error.message}`,
      );
    }
    const sortOrder =
      integer((orderResponse.data as UnknownRow | null)?.sort_order, -1) + 1;
    const response = await this.client
      .from("catalog_collections")
      .insert({
        slug,
        title,
        description: text(input.description),
        badge: text(input.badge, 120),
        featured: Boolean(input.featured),
        published: Boolean(input.published),
        sort_order: sortOrder,
      })
      .select("id")
      .single();
    if (response.error || !response.data) {
      throw new CatalogAdminError(
        `Não foi possível criar a coleção: ${response.error?.message ?? "resposta vazia"}`,
      );
    }
    return text((response.data as UnknownRow).id, 80);
  }

  async setCollectionPublished(collectionId: string, published: boolean) {
    ensureMutation(
      await this.client
        .from("catalog_collections")
        .update({ published })
        .eq("id", collectionId),
      "Não foi possível alterar a publicação",
    );
  }

  async setCollectionFeatured(collectionId: string, featured: boolean) {
    ensureMutation(
      await this.client
        .from("catalog_collections")
        .update({ featured })
        .eq("id", collectionId),
      "Não foi possível alterar o destaque",
    );
  }

  async moveCollection(collectionId: string, direction: -1 | 1) {
    const snapshot = await this.loadSnapshot();
    const collections = [...snapshot.collections].sort(
      (left, right) => left.sortOrder - right.sortOrder,
    );
    const index = collections.findIndex((item) => item.id === collectionId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= collections.length) {
      return;
    }
    [collections[index], collections[targetIndex]] = [
      collections[targetIndex],
      collections[index],
    ];
    ensureMutation(
      await this.client.from("catalog_collections").upsert(
        collections.map((item, sortOrder) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          description: item.description,
          badge: item.badge,
          featured: item.featured,
          published: item.published,
          sort_order: sortOrder,
        })),
        { onConflict: "id" },
      ),
      "Não foi possível reordenar as coleções",
    );
  }

  async saveCollectionItem(input: CollectionItemInput, itemId?: string) {
    if (!input.collectionId || !input.workKey) {
      throw new CatalogAdminError("Escolha uma coleção e uma obra.");
    }
    if (itemId) {
      ensureMutation(
        await this.client
          .from("catalog_collection_items")
          .update({
            collection_id: input.collectionId,
            work_key: input.workKey,
            edition_key: input.editionKey || null,
            editorial_text: text(input.editorialText),
            badge: text(input.badge, 120),
            featured: Boolean(input.featured),
          })
          .eq("id", itemId),
        "Não foi possível atualizar o item editorial",
      );
      return itemId;
    }

    const positionResponse = await this.client
      .from("catalog_collection_items")
      .select("sort_order")
      .eq("collection_id", input.collectionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (positionResponse.error) {
      throw new CatalogAdminError(
        `Não foi possível calcular a posição da obra: ${positionResponse.error.message}`,
      );
    }
    const sortOrder =
      integer((positionResponse.data as UnknownRow | null)?.sort_order, -1) + 1;
    const response = await this.client
      .from("catalog_collection_items")
      .insert({
        collection_id: input.collectionId,
        work_key: input.workKey,
        edition_key: input.editionKey || null,
        editorial_text: text(input.editorialText),
        badge: text(input.badge, 120),
        featured: Boolean(input.featured),
        sort_order: sortOrder,
      })
      .select("id")
      .single();
    if (response.error || !response.data) {
      throw new CatalogAdminError(
        `Não foi possível adicionar a obra: ${response.error?.message ?? "resposta vazia"}`,
      );
    }
    return text((response.data as UnknownRow).id, 80);
  }

  async moveCollectionItem(itemId: string, direction: -1 | 1) {
    const snapshot = await this.loadSnapshot();
    const selected = snapshot.collectionItems.find(
      (item) => item.id === itemId,
    );
    if (!selected) return;
    const items = snapshot.collectionItems
      .filter((item) => item.collectionId === selected.collectionId)
      .sort((left, right) => left.sortOrder - right.sortOrder);
    const index = items.findIndex((item) => item.id === itemId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return;
    [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
    ensureMutation(
      await this.client.from("catalog_collection_items").upsert(
        items.map((item, sortOrder) => ({
          id: item.id,
          collection_id: item.collectionId,
          work_key: item.workKey,
          edition_key: item.editionKey,
          editorial_text: item.editorialText,
          badge: item.badge,
          featured: item.featured,
          sort_order: sortOrder,
        })),
        { onConflict: "id" },
      ),
      "Não foi possível reordenar as obras da coleção",
    );
  }

  async removeCollectionItem(itemId: string) {
    ensureMutation(
      await this.client
        .from("catalog_collection_items")
        .delete()
        .eq("id", itemId),
      "Não foi possível remover a obra da coleção",
    );
  }

  async recordIdentityRule(input: IdentityRuleInput) {
    if (!input.workKeyA || !input.workKeyB) {
      throw new CatalogAdminError("Escolha as duas obras da decisão.");
    }
    if (input.workKeyA === input.workKeyB) {
      throw new CatalogAdminError("Escolha duas obras diferentes.");
    }
    const confidence = input.confidence ?? 1;
    if (confidence < 0 || confidence > 1) {
      throw new CatalogAdminError("A confiança deve ficar entre 0 e 1.");
    }
    const [workKeyA, workKeyB] = [input.workKeyA, input.workKeyB].sort();
    const editionKey =
      input.action === "separate" ? input.editionKey || null : null;
    let existingQuery = this.client
      .from("catalog_identity_rules")
      .select("id")
      .eq("action", input.action)
      .eq("work_key_a", workKeyA)
      .eq("work_key_b", workKeyB);
    existingQuery = editionKey
      ? existingQuery.eq("edition_key", editionKey)
      : existingQuery.is("edition_key", null);
    const existing = await existingQuery.maybeSingle();
    if (existing.error) {
      throw new CatalogAdminError(
        `Não foi possível conferir decisões existentes: ${existing.error.message}`,
      );
    }

    const payload = {
      action: input.action,
      work_key_a: workKeyA,
      work_key_b: workKeyB,
      edition_key: editionKey,
      method: input.method ?? "manual",
      confidence,
      note: text(input.note),
      active: true,
    };
    const existingId = nullableText(
      (existing.data as UnknownRow | null)?.id,
      80,
    );
    const response = existingId
      ? await this.client
          .from("catalog_identity_rules")
          .update(payload)
          .eq("id", existingId)
          .select("id")
          .single()
      : await this.client
          .from("catalog_identity_rules")
          .insert(payload)
          .select("id")
          .single();
    if (response.error || !response.data) {
      throw new CatalogAdminError(
        `Não foi possível registrar a decisão: ${response.error?.message ?? "resposta vazia"}`,
      );
    }
    return text((response.data as UnknownRow).id, 80);
  }

  async saveRetailerLink(input: RetailerLinkInput) {
    const validated = validateDirectRetailerLink(input);
    const response = await this.client
      .from("catalog_retailer_links")
      .upsert(
        {
          work_key: validated.workKey,
          edition_key: validated.editionKey || null,
          retailer: validated.retailer,
          url: validated.url,
          kind: "direct",
          affiliate: Boolean(validated.affiliate),
          label: "Ver esta edição na loja",
          active: true,
        },
        { onConflict: "retailer,url" },
      )
      .select("id")
      .single();
    if (response.error || !response.data) {
      throw new CatalogAdminError(
        `Não foi possível cadastrar o link: ${response.error?.message ?? "resposta vazia"}`,
      );
    }
    return text((response.data as UnknownRow).id, 80);
  }

  async setRetailerLinkActive(linkId: string, active: boolean) {
    ensureMutation(
      await this.client
        .from("catalog_retailer_links")
        .update({ active })
        .eq("id", linkId),
      "Não foi possível alterar o link",
    );
  }
}

class ReadOnlyCatalogAdminClient implements CatalogAdminClient {
  readonly mode = "readonly" as const;
  readonly readOnly = true;

  async loadSnapshot() {
    return demoSnapshot();
  }

  private blocked(): never {
    throw new CatalogAdminReadOnlyError();
  }

  async importOpenLibraryWork(): Promise<string> {
    return this.blocked();
  }

  async createManualWork(): Promise<string> {
    return this.blocked();
  }

  async createManualEdition(): Promise<string> {
    return this.blocked();
  }

  async setPrimaryEdition(): Promise<void> {
    return this.blocked();
  }

  async uploadCover(): Promise<string> {
    return this.blocked();
  }

  async saveCollection(): Promise<string> {
    return this.blocked();
  }

  async setCollectionPublished(): Promise<void> {
    return this.blocked();
  }

  async setCollectionFeatured(): Promise<void> {
    return this.blocked();
  }

  async moveCollection(): Promise<void> {
    return this.blocked();
  }

  async saveCollectionItem(): Promise<string> {
    return this.blocked();
  }

  async moveCollectionItem(): Promise<void> {
    return this.blocked();
  }

  async removeCollectionItem(): Promise<void> {
    return this.blocked();
  }

  async recordIdentityRule(): Promise<string> {
    return this.blocked();
  }

  async saveRetailerLink(): Promise<string> {
    return this.blocked();
  }

  async setRetailerLinkActive(): Promise<void> {
    return this.blocked();
  }
}

export function createReadOnlyCatalogAdminClient(): CatalogAdminClient {
  return new ReadOnlyCatalogAdminClient();
}

export function createCatalogAdminClient(): CatalogAdminClient {
  if (!isSupabaseConfigured || isDemoMode) {
    return createReadOnlyCatalogAdminClient();
  }
  const client = createClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
  return new SupabaseCatalogAdminClient(client);
}

export const catalogAdmin = createCatalogAdminClient();
