import type {
  CatalogCollectionResult,
  CatalogEdition,
  CatalogResolveResult,
  CatalogSearchParams,
  CatalogSearchResult,
  CatalogWork,
  CatalogWorkResult,
  RetailerDestination,
} from "../catalogTypes";
import {
  BookCatalogError,
  buildRetailerDestinations,
  type BookCatalogClient,
} from "../lib/bookCatalog";

const day = 24 * 60 * 60 * 1_000;

export const demoCatalogWorks: CatalogWork[] = [
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
    editionCount: 4,
    editorialText:
      "Terra, memória e resistência em uma narrativa brasileira essencial.",
    badge: "Destaque",
    featured: true,
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
    editionCount: 32,
    editorialText: "Um clássico breve, singular e inesquecível.",
    badge: "Clássico",
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
    editionCount: 40,
    editorialText:
      "Uma parábola incômoda sobre humanidade e sobrevivência.",
    badge: "Nobel",
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
    editorialText:
      "Uma voz potente da literatura brasileira contemporânea.",
    badge: "Contemporâneo",
  },
];

export const demoCatalogEditions: Record<string, CatalogEdition[]> = {
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
      coverUrl: "https://covers.openlibrary.org/b/isbn/9786580309313-L.jpg",
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
      coverUrl: "https://covers.openlibrary.org/b/isbn/9786555320350-L.jpg",
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
      coverUrl: "https://covers.openlibrary.org/b/isbn/9788535933390-L.jpg",
    },
  ],
};

export const demoAmazonOverrides: Readonly<Record<string, string>> = {
  "manual:isbn:9786556927190":
    "https://www.amazon.com.br/Torto-arado-Itamar-Vieira-Junior/dp/6556927198?&linkCode=ll2&tag=entrecapitu04-20&linkId=46ba8e2caeaa429f238ceb6624dd8111&ref_=as_li_ss_tl",
  OL35693081M:
    "https://www.amazon.com.br/dp/6555320354?&linkCode=ll2&tag=entrecapitu04-20&linkId=d885554379d966ba9e5e36d4a6761d9b&ref_=as_li_ss_tl",
  "manual:isbn:9788535930535":
    "https://www.amazon.com.br/dp/8535930531?&linkCode=ll2&tag=entrecapitu04-20&linkId=80150af7ad4ede5796f3a3a12b13078a&ref_=as_li_ss_tl",
  OL38222370M:
    "https://www.amazon.com.br/dp/8535933395?&linkCode=ll2&tag=entrecapitu04-20&linkId=c1770889a6a9d2e99b5cbfeb888eb752&ref_=as_li_ss_tl",
};

function responseTimes(ttlDays: number) {
  const now = Date.now();
  return {
    fetchedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlDays * day).toISOString(),
    stale: false,
    source: "open_library" as const,
  };
}

function destinationsFor(work: CatalogWork): RetailerDestination[] {
  return (demoCatalogEditions[work.workKey] ?? []).flatMap((edition) => {
    const generated = buildRetailerDestinations({
      editionKey: edition.editionKey,
      isbn13: edition.isbn13,
      isbn10: edition.isbn10,
      title: work.title,
      authors: work.authors,
    });
    const directAmazon = demoAmazonOverrides[edition.editionKey];
    return generated.map((destination) =>
      destination.retailer === "amazon_br" && directAmazon
        ? {
            ...destination,
            url: directAmazon,
            kind: "direct" as const,
            affiliate: true,
            label: "Ver esta edição na loja",
          }
        : destination,
    );
  });
}

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function findWork(params: {
  isbn?: string;
  legacyAsin?: string;
  title?: string;
}) {
  const identifier = (params.isbn || params.legacyAsin || "").replace(
    /[\s-]/g,
    "",
  );
  if (identifier) {
    const match = demoCatalogWorks.find((work) =>
      (demoCatalogEditions[work.workKey] ?? []).some(
        (edition) =>
          edition.isbn10 === identifier || edition.isbn13 === identifier,
      ),
    );
    if (match) return match;
  }
  const title = normalize(params.title ?? "");
  if (!title) return null;
  return (
    demoCatalogWorks.find((work) => normalize(work.title) === title) ??
    demoCatalogWorks.find((work) => normalize(work.title).includes(title)) ??
    null
  );
}

export function createDemoBookCatalogClient(): BookCatalogClient {
  return {
    async collection(slug): Promise<CatalogCollectionResult> {
      return {
        operation: "collection",
        collection: {
          slug,
          title: "Escolhas da casa",
          description:
            "Quatro obras que abriram conversas e continuam circulando entre nossas estantes.",
          badge: "Curadoria da casa",
          featured: true,
        },
        works: demoCatalogWorks,
        pagination: {
          page: 1,
          pageSize: 18,
          total: demoCatalogWorks.length,
          hasMore: false,
        },
        ...responseTimes(1),
      };
    },
    async search(params: CatalogSearchParams): Promise<CatalogSearchResult> {
      const query = normalize(params.query);
      let works = demoCatalogWorks.filter((work) => {
        const editions = demoCatalogEditions[work.workKey] ?? [];
        const searchable = normalize(
          [
            work.title,
            ...work.authors,
            ...work.subjects,
            ...editions.flatMap((edition) => [
              edition.isbn10,
              edition.isbn13,
            ]),
          ].join(" "),
        );
        return searchable.includes(query);
      });
      if (params.language) {
        works = works.filter((work) =>
          work.languages.includes(params.language ?? ""),
        );
      }
      if (params.subject) {
        const subject = normalize(params.subject);
        works = works.filter((work) =>
          work.subjects.some((candidate) =>
            normalize(candidate).includes(subject),
          ),
        );
      }
      if (params.sort === "title") {
        works.sort((left, right) =>
          left.title.localeCompare(right.title, "pt-BR"),
        );
      } else if (params.sort === "oldest" || params.sort === "newest") {
        const direction = params.sort === "oldest" ? 1 : -1;
        works.sort(
          (left, right) =>
            ((left.firstPublishedYear ?? 9_999) -
              (right.firstPublishedYear ?? 9_999)) *
            direction,
        );
      }
      return {
        operation: "search",
        works,
        pagination: {
          page: params.page ?? 1,
          pageSize: 18,
          total: works.length,
          hasMore: false,
        },
        ...responseTimes(1),
      };
    },
    async work(workKey, editionPage = 1): Promise<CatalogWorkResult> {
      const work = demoCatalogWorks.find(
        (candidate) => candidate.workKey === workKey,
      );
      if (!work) {
        throw new BookCatalogError("Obra não encontrada.", {
          code: "not_found",
          status: 404,
        });
      }
      const allEditions = demoCatalogEditions[work.workKey] ?? [];
      const offset = (editionPage - 1) * 12;
      const editions = allEditions.slice(offset, offset + 12);
      return {
        operation: "work",
        work,
        works: [work],
        editions,
        destinations: destinationsFor(work),
        pagination: {
          page: editionPage,
          pageSize: 12,
          total: allEditions.length,
          hasMore: offset + 12 < allEditions.length,
        },
        ...responseTimes(7),
      };
    },
    async resolve(params): Promise<CatalogResolveResult> {
      const work = findWork(params);
      return {
        operation: "resolve",
        work,
        works: work ? [work] : [],
        editions: work ? demoCatalogEditions[work.workKey] ?? [] : [],
        destinations: work ? destinationsFor(work) : [],
        ...responseTimes(7),
      };
    },
    clearCache() {
      // Fixtures are immutable during a demo session.
    },
  };
}
