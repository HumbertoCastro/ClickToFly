import type {
  AmazonCatalogRequest,
  AmazonOperation,
  AmazonSearchIndex,
} from "./types.ts";

const ASIN_PATTERN = /^[A-Z0-9]{10}$/;
const OPERATIONS = new Set<AmazonOperation>([
  "search",
  "items",
  "variations",
]);
const SEARCH_INDEXES = new Set<AmazonSearchIndex>(["Books", "KindleStore"]);

export class RequestValidationError extends Error {
  readonly code = "invalid_request";

  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("O corpo deve ser um objeto JSON.");
  }
  return value as Record<string, unknown>;
}

function normalizeAsin(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new RequestValidationError(`${field} deve ser um ASIN válido.`);
  }

  const asin = value.trim().toUpperCase();
  if (!ASIN_PATTERN.test(asin)) {
    throw new RequestValidationError(`${field} deve conter 10 caracteres alfanuméricos.`);
  }
  return asin;
}

function optionalTrimmedString(
  value: unknown,
  field: string,
  maximumLength: number,
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new RequestValidationError(`${field} deve ser texto.`);
  }

  const normalized = value.trim();
  if (!normalized || normalized.length > maximumLength) {
    throw new RequestValidationError(
      `${field} deve ter entre 1 e ${maximumLength} caracteres.`,
    );
  }
  return normalized;
}

export function parseCatalogRequest(value: unknown): AmazonCatalogRequest {
  const body = record(value);
  if (
    typeof body.operation !== "string" ||
    !OPERATIONS.has(body.operation as AmazonOperation)
  ) {
    throw new RequestValidationError(
      "operation deve ser search, items ou variations.",
    );
  }

  const operation = body.operation as AmazonOperation;
  const searchIndex =
    body.searchIndex === undefined
      ? "Books"
      : (body.searchIndex as AmazonSearchIndex);
  if (!SEARCH_INDEXES.has(searchIndex)) {
    throw new RequestValidationError(
      "searchIndex deve ser Books ou KindleStore.",
    );
  }

  const page = body.page === undefined ? 1 : Number(body.page);
  if (!Number.isInteger(page) || page < 1 || page > 10) {
    throw new RequestValidationError("page deve ser um inteiro entre 1 e 10.");
  }

  const category = optionalTrimmedString(body.category, "category", 100);
  const result: AmazonCatalogRequest = {
    operation,
    searchIndex,
    page,
    ...(category ? { category } : {}),
  };

  if (operation === "search") {
    const query = optionalTrimmedString(body.query, "query", 200);
    if (!query || query.length < 2) {
      throw new RequestValidationError(
        "query deve ter entre 2 e 200 caracteres.",
      );
    }
    return { ...result, query };
  }

  if (operation === "items") {
    if (!Array.isArray(body.asins) || body.asins.length < 1 || body.asins.length > 10) {
      throw new RequestValidationError(
        "asins deve conter entre 1 e 10 ASINs.",
      );
    }
    const asins = [...new Set(body.asins.map((asin, index) =>
      normalizeAsin(asin, `asins[${index}]`)
    ))];
    return { ...result, asins };
  }

  return { ...result, asin: normalizeAsin(body.asin, "asin") };
}

export function stableRequestDescriptor(
  request: AmazonCatalogRequest,
): Record<string, unknown> {
  if (request.operation === "search") {
    return {
      operation: request.operation,
      query: request.query!.toLocaleLowerCase("pt-BR"),
      searchIndex: request.searchIndex,
      page: request.page,
      category: request.category ?? "",
    };
  }

  if (request.operation === "items") {
    return {
      operation: request.operation,
      asins: [...request.asins!].sort(),
    };
  }

  return {
    operation: request.operation,
    asin: request.asin,
    page: request.page,
  };
}

export async function cacheKeyForRequest(
  request: AmazonCatalogRequest,
): Promise<string> {
  const bytes = new TextEncoder().encode(
    JSON.stringify(stableRequestDescriptor(request)),
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return `${request.operation}:${hash}`;
}
