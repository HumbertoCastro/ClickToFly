import type { Page } from "@playwright/test";
import type {
  AmazonCatalogItem,
  AmazonCatalogMode,
  AmazonCurrentOffer,
} from "../src/amazonTypes";
import { amazonBootstrapItems } from "../src/data/amazonBootstrap";

const partnerTag = "entre-capitulos-e2e-20";

function affiliateUrl(asin: string): string {
  return `https://www.amazon.com.br/dp/${asin}?tag=${partnerTag}&linkCode=ogi`;
}

function fixtureOffer(
  fetchedAt: string,
  expiresAt: string,
): AmazonCurrentOffer {
  return {
    priceAmount: 39.9,
    currency: "BRL",
    displayPrice: "R$ 39,90",
    savingsAmount: 20,
    savingsPercentage: 33,
    isPrime: true,
    isAvailable: true,
    availability: "IN_STOCK",
    seller: "Livraria Parceira",
    condition: "Novo",
    promotion: "Oferta exclusiva Prime",
    fetchedAt,
    expiresAt,
  };
}

function catalogFixture(): AmazonCatalogItem[] {
  const now = new Date();
  const fetchedAt = now.toISOString();
  const offerExpiresAt = new Date(
    now.getTime() + 60 * 60 * 1_000,
  ).toISOString();
  const metadataExpiresAt = new Date(
    now.getTime() + 24 * 60 * 60 * 1_000,
  ).toISOString();

  const catalog: AmazonCatalogItem[] = amazonBootstrapItems.map(
    (item, index): AmazonCatalogItem => {
      const primaryUrl = affiliateUrl(item.asin);
      const offer =
        index === 0
          ? fixtureOffer(fetchedAt, offerExpiresAt)
          : null;
      const editions = item.editions.map((edition) => ({
        ...edition,
        detailPageUrl: primaryUrl,
        offer,
        fetchedAt,
        expiresAt: metadataExpiresAt,
      }));
      if (index === 0) {
        editions.push({
          asin: "B0KINDLE12",
          format: "kindle",
          label: "Kindle",
          detailPageUrl: affiliateUrl("B0KINDLE12"),
          imageUrl: "",
          offer: null,
          fetchedAt,
          expiresAt: metadataExpiresAt,
        });
      }

      return {
        ...item,
        parentAsin: index === 0 ? "B0PARENT12" : null,
        catalogSource: "creators",
        detailPageUrl: primaryUrl,
        editions,
        offer,
        salesRank: index + 1,
        salesRankCategory: "Livros",
        salesRankFetchedAt: fetchedAt,
        salesRankExpiresAt: offerExpiresAt,
        fetchedAt,
        expiresAt: metadataExpiresAt,
      };
    },
  );

  const memoryUrl = affiliateUrl("B0MEMORIA1");
  catalog.push({
    ...catalog[0],
    asin: "B0MEMORIA1",
    parentAsin: null,
    title: "Memória de minhas putas tristes",
    subtitle: "",
    authors: ["Gabriel García Márquez"],
    publisher: "Record",
    publishedDate: "2005",
    pageCount: 128,
    description: "Edição Amazon usada no fluxo de vínculo E2E.",
    categories: ["Literatura latino-americana"],
    categoryDetails: [],
    isbn10: "",
    isbn13: "",
    detailPageUrl: memoryUrl,
    salesRank: 25,
    editions: [
      {
        asin: "B0MEMORIA1",
        format: "paperback",
        label: "Livro físico",
        detailPageUrl: memoryUrl,
        imageUrl: "",
        offer: null,
        fetchedAt,
        expiresAt: metadataExpiresAt,
      },
    ],
    offer: null,
  });

  return catalog;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function googleVolume(item: AmazonCatalogItem) {
  return {
    id: `google-${item.asin}`,
    volumeInfo: {
      title: item.title,
      subtitle: item.subtitle,
      authors: item.authors,
      publisher: item.publisher,
      publishedDate: item.publishedDate,
      description: item.description,
      pageCount: item.pageCount,
      categories: item.categories,
      language: "pt",
      industryIdentifiers: [
        { type: "ISBN_10", identifier: item.isbn10 },
        { type: "ISBN_13", identifier: item.isbn13 },
      ].filter((identifier) => identifier.identifier),
    },
  };
}

export async function installAmazonMocks(
  page: Page,
  mode: AmazonCatalogMode = "creators",
): Promise<void> {
  const items = catalogFixture();

  await page.route("**/__amazon-catalog-fixture", async (route) => {
    const request = route.request().postDataJSON() as {
      operation: "search" | "items" | "variations";
      query?: string;
      asins?: string[];
      asin?: string;
      searchIndex?: "Books" | "KindleStore";
      category?: string;
    };
    let matches: AmazonCatalogItem[] = [];

    if (mode !== "disabled") {
      if (request.operation === "items") {
        const requested = new Set(request.asins ?? []);
        matches = items.filter(
          (item) =>
            requested.has(item.asin) ||
            item.editions.some((edition) => requested.has(edition.asin)),
        );
      } else if (request.operation === "variations") {
        matches = items.filter(
          (item) =>
            item.asin === request.asin ||
            item.parentAsin === request.asin ||
            item.editions.some((edition) => edition.asin === request.asin),
        );
      } else {
        const query = normalize(request.query ?? "");
        const allBooks = ["livro", "livros", "todos", "*"].includes(query);
        matches = (allBooks ? items.slice(0, 4) : items).filter((item) => {
          const haystack = normalize(
            [
              item.title,
              ...item.authors,
              ...item.categories,
              item.isbn10,
              item.isbn13,
            ].join(" "),
          );
          const category = normalize(request.category ?? "");
          return (
            item.searchIndex === (request.searchIndex ?? "Books") &&
            (allBooks || haystack.includes(query)) &&
            (!category || haystack.includes(category))
          );
        });
      }
    }

    const fetchedAt = new Date().toISOString();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        operation: request.operation,
        mode,
        items: matches,
        fetchedAt,
        expiresAt:
          mode === "disabled"
            ? null
            : new Date(Date.now() + 60 * 60 * 1_000).toISOString(),
        source: "amazon.com.br",
      }),
    });
  });

  await page.route("https://www.googleapis.com/books/v1/volumes**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("q") ?? "";
    const compact = query.replace(/^isbn:/, "").replace(/\D/g, "");
    const match = items.find(
      (item) => item.isbn10 === compact || item.isbn13 === compact,
    );
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: match ? [googleVolume(match)] : [],
      }),
    });
  });
}

export const amazonFixturePartnerTag = partnerTag;
