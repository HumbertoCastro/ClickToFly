import { isValidIsbn10, isValidIsbn13 } from "./isbn.ts";
import { text } from "./sanitize.ts";
import type {
  CatalogEdition,
  CatalogWork,
  DirectRetailerLink,
  Retailer,
  RetailerDestination,
} from "./types.ts";

const RETAILER_ORDER: Retailer[] = [
  "amazon_br",
  "estante_virtual",
  "mercado_livre",
];

const ALLOWED_HOSTS: Record<Retailer, Set<string>> = {
  amazon_br: new Set(["amazon.com.br", "www.amazon.com.br"]),
  estante_virtual: new Set([
    "estantevirtual.com.br",
    "www.estantevirtual.com.br",
  ]),
  mercado_livre: new Set([
    "mercadolivre.com.br",
    "www.mercadolivre.com.br",
    "lista.mercadolivre.com.br",
  ]),
};

export function isAllowedRetailerUrl(
  retailer: Retailer,
  value: string,
): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      ALLOWED_HOSTS[retailer].has(url.hostname.toLocaleLowerCase("en"))
    );
  } catch {
    return false;
  }
}

function searchTerm(
  work: CatalogWork,
  edition?: CatalogEdition,
): string {
  if (edition?.isbn13 && isValidIsbn13(edition.isbn13)) {
    return edition.isbn13;
  }
  if (edition?.isbn10 && isValidIsbn10(edition.isbn10)) {
    return edition.isbn10;
  }
  return [work.title, work.authors[0]].map((value) => text(value, 300))
    .filter(Boolean)
    .join(" ");
}

export function buildRetailerSearchUrl(
  retailer: Retailer,
  term: string,
): string {
  const encoded = encodeURIComponent(text(term, 500));
  if (retailer === "amazon_br") {
    return `https://www.amazon.com.br/s?k=${encoded}`;
  }
  if (retailer === "estante_virtual") {
    return `https://www.estantevirtual.com.br/busca?q=${encoded}`;
  }
  return `https://lista.mercadolivre.com.br/${encoded}`;
}

function directFor(
  retailer: Retailer,
  work: CatalogWork,
  edition: CatalogEdition | undefined,
  directLinks: DirectRetailerLink[],
): DirectRetailerLink | undefined {
  return directLinks.find((link) =>
    link.retailer === retailer &&
    link.workKey === work.workKey &&
    link.editionKey === (edition?.editionKey ?? null) &&
    isAllowedRetailerUrl(retailer, link.url)
  ) ?? directLinks.find((link) =>
    link.retailer === retailer &&
    link.workKey === work.workKey &&
    link.editionKey === null &&
    isAllowedRetailerUrl(retailer, link.url)
  );
}

export function buildDestinations(
  work: CatalogWork,
  editions: CatalogEdition[],
  directLinks: DirectRetailerLink[] = [],
): RetailerDestination[] {
  const targets: Array<CatalogEdition | undefined> =
    editions.length ? editions : [undefined];
  return targets.flatMap((edition) =>
    RETAILER_ORDER.map((retailer) => {
      const direct = directFor(retailer, work, edition, directLinks);
      if (direct) {
        return {
          retailer,
          editionKey: edition?.editionKey ?? null,
          url: direct.url,
          kind: "direct" as const,
          affiliate: direct.affiliate,
          label: direct.label || "Ver esta edição na loja",
        };
      }

      return {
        retailer,
        editionKey: edition?.editionKey ?? null,
        url: buildRetailerSearchUrl(retailer, searchTerm(work, edition)),
        kind: "search" as const,
        affiliate: false,
        label: "Buscar na loja",
      };
    })
  );
}
