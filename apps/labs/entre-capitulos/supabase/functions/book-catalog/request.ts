import { validIsbn } from "./isbn.ts";
import {
  canonicalWorkKey,
  object,
  text,
} from "./sanitize.ts";
import type {
  CatalogOperation,
  CatalogRequest,
  CatalogSort,
} from "./types.ts";

const OPERATIONS = new Set<CatalogOperation>([
  "search",
  "collection",
  "work",
  "resolve",
]);
const SORTS = new Set<CatalogSort>([
  "relevance",
  "title",
  "oldest",
  "newest",
]);

export class RequestValidationError extends Error {
  readonly code = "invalid_request";

  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

function requiredText(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): string {
  if (typeof value !== "string") {
    throw new RequestValidationError(`${field} deve ser texto.`);
  }
  const candidate = text(value, maximum + 1);
  if (candidate.length < minimum || candidate.length > maximum) {
    throw new RequestValidationError(
      `${field} deve ter entre ${minimum} e ${maximum} caracteres.`,
    );
  }
  return candidate;
}

function optionalText(
  value: unknown,
  field: string,
  maximum: number,
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return requiredText(value, field, 1, maximum);
}

function pageNumber(value: unknown, field: string): number {
  const page = value === undefined ? 1 : Number(value);
  if (!Number.isInteger(page) || page < 1 || page > 100) {
    throw new RequestValidationError(
      `${field} deve ser um inteiro entre 1 e 100.`,
    );
  }
  return page;
}

export function parseCatalogRequest(value: unknown): CatalogRequest {
  const body = object(value);
  if (
    !body ||
    typeof body.operation !== "string" ||
    !OPERATIONS.has(body.operation as CatalogOperation)
  ) {
    throw new RequestValidationError(
      "operation deve ser search, collection, work ou resolve.",
    );
  }

  if (body.operation === "search") {
    const language = optionalText(body.language, "language", 12);
    if (language && !/^[a-z]{2,3}(?:-[a-z]{2})?$/i.test(language)) {
      throw new RequestValidationError("language deve ser um código de idioma.");
    }
    const sort = body.sort === undefined
      ? "relevance"
      : body.sort as CatalogSort;
    if (!SORTS.has(sort)) {
      throw new RequestValidationError(
        "sort deve ser relevance, title, oldest ou newest.",
      );
    }
    return {
      operation: "search",
      query: requiredText(body.query, "query", 2, 200),
      page: pageNumber(body.page, "page"),
      ...(language ? { language: language.toLowerCase() } : {}),
      ...(body.subject !== undefined
        ? { subject: requiredText(body.subject, "subject", 1, 80) }
        : {}),
      sort,
    };
  }

  if (body.operation === "collection") {
    const slug = requiredText(body.slug, "slug", 1, 100).toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new RequestValidationError("slug deve ser um identificador válido.");
    }
    return { operation: "collection", slug };
  }

  if (body.operation === "work") {
    const workKey = canonicalWorkKey(body.workKey);
    if (!workKey) {
      throw new RequestValidationError("workKey deve identificar uma obra.");
    }
    return {
      operation: "work",
      workKey,
      editionPage: pageNumber(body.editionPage, "editionPage"),
    };
  }

  const isbnInput = optionalText(body.isbn, "isbn", 30);
  const isbn = isbnInput ? validIsbn(isbnInput) : undefined;
  if (isbnInput && !isbn) {
    throw new RequestValidationError("isbn deve ter checksum válido.");
  }
  const legacyAsin = optionalText(body.legacyAsin, "legacyAsin", 10)
    ?.toUpperCase();
  if (legacyAsin && !/^[A-Z0-9]{10}$/.test(legacyAsin)) {
    throw new RequestValidationError(
      "legacyAsin deve conter 10 caracteres alfanuméricos.",
    );
  }
  const title = optionalText(body.title, "title", 300);
  const author = optionalText(body.author, "author", 200);
  if (!isbn && !legacyAsin && !title && !author) {
    throw new RequestValidationError(
      "resolve requer isbn, legacyAsin, title ou author.",
    );
  }
  return {
    operation: "resolve",
    ...(isbn ? { isbn } : {}),
    ...(legacyAsin ? { legacyAsin } : {}),
    ...(title ? { title } : {}),
    ...(author ? { author } : {}),
  };
}

export function stableRequestDescriptor(
  request: CatalogRequest,
): Record<string, unknown> {
  if (request.operation === "search") {
    return {
      operation: request.operation,
      query: request.query.toLocaleLowerCase("pt-BR"),
      page: request.page,
      language: request.language ?? "",
      subject: request.subject?.toLocaleLowerCase("pt-BR") ?? "",
      sort: request.sort ?? "relevance",
    };
  }
  if (request.operation === "collection") {
    return { operation: request.operation, slug: request.slug };
  }
  if (request.operation === "work") {
    return {
      operation: request.operation,
      workKey: request.workKey,
      editionPage: request.editionPage,
    };
  }
  return {
    operation: request.operation,
    isbn: request.isbn ?? "",
    legacyAsin: request.legacyAsin ?? "",
    title: request.title?.toLocaleLowerCase("pt-BR") ?? "",
    author: request.author?.toLocaleLowerCase("pt-BR") ?? "",
  };
}

export async function cacheKeyForRequest(
  request: CatalogRequest,
): Promise<string> {
  const descriptor = stableRequestDescriptor(request);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(descriptor)),
  );
  const hash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `${request.operation}:${hash}`;
}
