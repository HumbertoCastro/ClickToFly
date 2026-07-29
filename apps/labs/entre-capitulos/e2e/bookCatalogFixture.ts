import type { Page } from "@playwright/test";
import type {
  CatalogEdition,
  CatalogRetailer,
  CatalogWork,
  RetailerDestination,
} from "../src/catalogTypes";

type CatalogFixtureRequest =
  | { operation: "collection"; slug: string }
  | {
      operation: "search";
      query: string;
      page: number;
      language?: string;
      subject?: string;
      sort?: "relevance" | "title" | "oldest" | "newest";
    }
  | { operation: "work"; workKey: string; editionPage?: number }
  | {
      operation: "resolve";
      isbn?: string;
      legacyAsin?: string;
      title?: string;
      author?: string;
    };

export interface BookCatalogFixtureController {
  requests: CatalogFixtureRequest[];
}

const works: CatalogWork[] = [
  {
    workKey: "OL24141556W",
    title: "Torto Arado",
    authors: ["Itamar Vieira Junior"],
    firstPublishedYear: 2019,
    description:
      "Duas irmãs crescem em uma comunidade rural marcada por memória, terra, pertencimento e resistência.",
    subjects: ["Literatura brasileira", "Romance"],
    languages: ["por", "eng"],
    coverUrl: "https://covers.openlibrary.org/b/id/12369648-L.jpg",
    editionCount: 2,
  },
  {
    workKey: "OL1002120W",
    title: "A Hora da Estrela",
    authors: ["Clarice Lispector"],
    firstPublishedYear: 1977,
    description:
      "Um romance breve sobre Macabéa, linguagem e invisibilidade, narrado entre compaixão e desconforto.",
    subjects: ["Literatura brasileira", "Clássicos"],
    languages: ["por", "eng", "spa"],
    coverUrl: "https://covers.openlibrary.org/b/id/650866-L.jpg",
    editionCount: 1,
  },
  {
    workKey: "OL27420W",
    title: "Ensaio sobre a cegueira",
    authors: ["José Saramago"],
    firstPublishedYear: 1995,
    description:
      "Uma epidemia inesperada expõe escolhas individuais e as estruturas de uma sociedade levada ao limite.",
    subjects: ["Literatura portuguesa", "Ficção"],
    languages: ["por", "eng", "spa"],
    coverUrl: "https://covers.openlibrary.org/b/id/10482411-L.jpg",
    editionCount: 1,
  },
  {
    workKey: "OL27963555W",
    title: "O avesso da pele",
    authors: ["Jeferson Tenório"],
    firstPublishedYear: 2020,
    description:
      "Um filho recompõe a história do pai e encara as marcas deixadas pela violência e pelo racismo.",
    subjects: ["Literatura brasileira", "Romance contemporâneo"],
    languages: ["por"],
    coverUrl: "https://covers.openlibrary.org/b/id/12769862-L.jpg",
    editionCount: 1,
  },
];

const editions: Record<string, CatalogEdition[]> = {
  OL24141556W: [
    {
      editionKey: "manual:isbn:9786556927190",
      isbn10: "6556927198",
      isbn13: "9786556927190",
      publisher: "Todavia",
      publishedDate: "2024",
      language: "por",
      format: "Capa dura",
      pageCount: 264,
      coverUrl: "https://covers.openlibrary.org/b/id/12369648-L.jpg",
    },
    {
      editionKey: "OL35663926M",
      isbn10: "6580309318",
      isbn13: "9786580309313",
      publisher: "Todavia",
      publishedDate: "2019",
      language: "por",
      format: "Brochura",
      pageCount: 264,
      coverUrl:
        "https://covers.openlibrary.org/b/isbn/9786580309313-L.jpg",
    },
  ],
  OL1002120W: [
    {
      editionKey: "OL35693081M",
      isbn10: "6555320354",
      isbn13: "9786555320350",
      publisher: "Rocco",
      publishedDate: "2019-12-03",
      language: "por",
      format: "Brochura",
      pageCount: 88,
      coverUrl:
        "https://covers.openlibrary.org/b/isbn/9786555320350-L.jpg",
    },
  ],
  OL27420W: [
    {
      editionKey: "manual:isbn:9788535930535",
      isbn10: "8535930531",
      isbn13: "9788535930535",
      publisher: "Companhia das Letras",
      publishedDate: "2017",
      language: "por",
      format: "Brochura",
      pageCount: 312,
      coverUrl: "https://covers.openlibrary.org/b/id/10482411-L.jpg",
    },
  ],
  OL27963555W: [
    {
      editionKey: "OL38222370M",
      isbn10: "8535933395",
      isbn13: "9788535933390",
      publisher: "Companhia das Letras",
      publishedDate: "2020",
      language: "por",
      format: "Brochura",
      pageCount: 192,
      coverUrl:
        "https://covers.openlibrary.org/b/isbn/9788535933390-L.jpg",
    },
  ],
};

const amazonOverrides: Record<string, string> = {
  "manual:isbn:9786556927190":
    "https://www.amazon.com.br/Torto-arado-Itamar-Vieira-Junior/dp/6556927198?&linkCode=ll2&tag=entrecapitu04-20&linkId=46ba8e2caeaa429f238ceb6624dd8111&ref_=as_li_ss_tl",
  OL35693081M:
    "https://www.amazon.com.br/dp/6555320354?&linkCode=ll2&tag=entrecapitu04-20&linkId=d885554379d966ba9e5e36d4a6761d9b&ref_=as_li_ss_tl",
  "manual:isbn:9788535930535":
    "https://www.amazon.com.br/dp/8535930531?&linkCode=ll2&tag=entrecapitu04-20&linkId=80150af7ad4ede5796f3a3a12b13078a&ref_=as_li_ss_tl",
  OL38222370M:
    "https://www.amazon.com.br/dp/8535933395?&linkCode=ll2&tag=entrecapitu04-20&linkId=c1770889a6a9d2e99b5cbfeb888eb752&ref_=as_li_ss_tl",
};

const legacyWorkKeys: Record<string, string> = {
  "6580309318": "OL24141556W",
  "6555320354": "OL1002120W",
  "8535930531": "OL27420W",
  "8535933395": "OL27963555W",
};

function normalized(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function retailerUrl(
  retailer: CatalogRetailer,
  isbn: string,
): string {
  if (retailer === "amazon_br") {
    return `https://www.amazon.com.br/s?k=${encodeURIComponent(isbn)}`;
  }
  if (retailer === "estante_virtual") {
    return `https://www.estantevirtual.com.br/busca?q=${encodeURIComponent(isbn)}`;
  }
  return `https://lista.mercadolivre.com.br/${encodeURIComponent(isbn)}`;
}

function destinationsFor(
  workKey: string,
  visibleEditions = editions[workKey] ?? [],
): RetailerDestination[] {
  return visibleEditions.flatMap((edition) =>
    (
      ["amazon_br", "estante_virtual", "mercado_livre"] as const
    ).map((retailer) => {
      const directAmazon = retailer === "amazon_br"
        ? amazonOverrides[edition.editionKey]
        : undefined;
      return {
        retailer,
        editionKey: edition.editionKey,
        url:
          directAmazon ??
          retailerUrl(retailer, edition.isbn13 || edition.isbn10),
        kind: directAmazon ? "direct" : "search",
        affiliate: Boolean(directAmazon),
        label: directAmazon
          ? "Ver esta edição na loja"
          : "Buscar na loja",
      };
    }),
  );
}

function findWork(request: Extract<CatalogFixtureRequest, { operation: "resolve" }>) {
  const identifier = (request.isbn || request.legacyAsin || "")
    .replace(/[\s-]/g, "")
    .toUpperCase();
  const workKey =
    legacyWorkKeys[identifier] ??
    Object.entries(editions).find(([, candidates]) =>
      candidates.some(
        (edition) =>
          edition.isbn10 === identifier || edition.isbn13 === identifier,
      ),
    )?.[0];
  if (workKey) {
    return works.find((work) => work.workKey === workKey) ?? null;
  }

  const title = normalized(request.title ?? "");
  if (!title) return null;
  return (
    works.find((work) => normalized(work.title) === title) ??
    works.find((work) => normalized(work.title).includes(title)) ??
    null
  );
}

function responseBase() {
  const fetchedAt = new Date().toISOString();
  return {
    fetchedAt,
    expiresAt: new Date(
      Date.now() + 24 * 60 * 60 * 1_000,
    ).toISOString(),
    stale: false,
    source: "open_library" as const,
  };
}

function coverSvg(url: string) {
  const id = url.match(/(?:id|isbn)\/([^-]+)/)?.[1] ?? "EC";
  const palettes = [
    ["#293a32", "#efe3c5"],
    ["#7d2834", "#f5e8c9"],
    ["#19334d", "#e8d7b6"],
    ["#b36b3d", "#fff3d9"],
  ];
  const index = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  const [background, foreground] = palettes[index % palettes.length];
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="720" viewBox="0 0 480 720">
      <rect width="480" height="720" fill="${background}"/>
      <rect x="35" y="35" width="410" height="650" fill="none" stroke="${foreground}" stroke-width="3"/>
      <path d="M80 225h320M80 495h320" stroke="${foreground}" stroke-width="2" opacity=".72"/>
      <text x="240" y="345" fill="${foreground}" font-size="44" font-family="Georgia,serif" text-anchor="middle">ENTRE</text>
      <text x="240" y="400" fill="${foreground}" font-size="44" font-family="Georgia,serif" text-anchor="middle">CAPÍTULOS</text>
      <text x="240" y="615" fill="${foreground}" font-size="22" font-family="Arial,sans-serif" text-anchor="middle">${id}</text>
    </svg>`;
}

export async function installBookCatalogMocks(
  page: Page,
): Promise<BookCatalogFixtureController> {
  const controller: BookCatalogFixtureController = { requests: [] };

  await page.route("https://covers.openlibrary.org/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: coverSvg(route.request().url()),
    });
  });

  await page.route("**/__book-catalog-fixture", async (route) => {
    const request = route.request().postDataJSON() as CatalogFixtureRequest;
    controller.requests.push(request);
    const base = responseBase();

    if (request.operation === "collection") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          operation: "collection",
          collection: {
            slug: request.slug,
            title: "Escolhas da casa",
            description:
              "Quatro obras que abriram conversas e continuam circulando entre nossas estantes.",
          },
          works,
          pagination: {
            page: 1,
            pageSize: 18,
            total: works.length,
            hasMore: false,
          },
          ...base,
        }),
      });
      return;
    }

    if (request.operation === "search") {
      const query = normalized(request.query);
      let matches = works.filter((work) => {
        const searchable = normalized(
          [
            work.title,
            ...work.authors,
            ...work.subjects,
            ...(editions[work.workKey] ?? []).flatMap((edition) => [
              edition.isbn10,
              edition.isbn13,
            ]),
          ].join(" "),
        );
        return searchable.includes(query);
      });
      if (request.language) {
        matches = matches.filter((work) =>
          work.languages.includes(request.language ?? ""),
        );
      }
      if (request.subject) {
        const subject = normalized(request.subject);
        matches = matches.filter((work) =>
          work.subjects.some((item) => normalized(item).includes(subject)),
        );
      }
      if (request.sort === "title") {
        matches.sort((left, right) =>
          left.title.localeCompare(right.title, "pt-BR"),
        );
      } else if (
        request.sort === "oldest" ||
        request.sort === "newest"
      ) {
        const direction = request.sort === "oldest" ? 1 : -1;
        matches.sort(
          (left, right) =>
            ((left.firstPublishedYear ?? 9_999) -
              (right.firstPublishedYear ?? 9_999)) *
            direction,
        );
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          operation: "search",
          works: matches,
          pagination: {
            page: request.page,
            pageSize: 18,
            total: matches.length,
            hasMore: false,
          },
          ...base,
        }),
      });
      return;
    }

    if (request.operation === "work") {
      const work = works.find((candidate) => candidate.workKey === request.workKey);
      if (!work) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              code: "work_not_found",
              message: "A obra solicitada não foi encontrada.",
            },
          }),
        });
        return;
      }
      const editionPage = request.editionPage ?? 1;
      const allEditions = editions[work.workKey] ?? [];
      const pageEditions = allEditions.slice(
        (editionPage - 1) * 12,
        editionPage * 12,
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          operation: "work",
          work,
          works: [work],
          editions: pageEditions,
          destinations: destinationsFor(work.workKey, pageEditions),
          pagination: {
            page: editionPage,
            pageSize: 12,
            total: allEditions.length,
            hasMore: editionPage * 12 < allEditions.length,
          },
          ...base,
        }),
      });
      return;
    }

    const work = findWork(request);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        operation: "resolve",
        work,
        works: work ? [work] : [],
        editions: work ? editions[work.workKey] ?? [] : [],
        destinations: work ? destinationsFor(work.workKey) : [],
        ...base,
      }),
    });
  });

  return controller;
}

export const bookCatalogFixture = {
  works,
  editions,
  legacyWorkKeys,
};
