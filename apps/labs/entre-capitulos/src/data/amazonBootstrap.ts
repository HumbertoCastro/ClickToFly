import type {
  AmazonBookFormat,
  AmazonCatalogItem,
  AmazonCategory,
} from "../amazonTypes";

interface BootstrapBook {
  asin: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  pageCount: number | null;
  description: string;
  categories: string[];
  isbn10: string;
  isbn13: string;
  format?: AmazonBookFormat;
  detailPageUrl: string;
}

function category(name: string): AmazonCategory {
  return {
    id: name.toLocaleLowerCase("pt-BR").replace(/\s+/g, "-"),
    name,
    path: [name],
    searchIndex: "Books",
  };
}

function bootstrapBook(book: BootstrapBook): AmazonCatalogItem {
  const format = book.format ?? "paperback";

  return {
    asin: book.asin,
    parentAsin: null,
    source: "amazon.com.br",
    catalogSource: "sitestripe",
    title: book.title,
    subtitle: book.subtitle ?? "",
    authors: book.authors,
    publisher: book.publisher,
    publishedDate: book.publishedDate,
    pageCount: book.pageCount,
    language: "pt",
    description: book.description,
    languages: ["pt"],
    categories: book.categories,
    categoryDetails: book.categories.map(category),
    isbn10: book.isbn10,
    isbn13: book.isbn13,
    imageUrl: "",
    detailPageUrl: book.detailPageUrl,
    searchIndex: "Books",
    format,
    salesRank: null,
    salesRankCategory: "",
    salesRankFetchedAt: null,
    salesRankExpiresAt: null,
    featured: true,
    editions: [
      {
        asin: book.asin,
        format,
        label: format === "hardcover" ? "Capa dura" : "Livro físico",
        detailPageUrl: book.detailPageUrl,
        imageUrl: "",
        offer: null,
        fetchedAt: null,
        expiresAt: null,
      },
    ],
    offer: null,
    fetchedAt: null,
    expiresAt: null,
  };
}

/**
 * Fixture editorial usada apenas em testes e pré-visualizações locais.
 *
 * Ela não é fallback de produção: os links abaixo não são afiliados. O modo
 * SiteStripe real lê do servidor somente URLs completas cadastradas pela equipe.
 */
export const amazonBootstrapItems: AmazonCatalogItem[] = [
  bootstrapBook({
    asin: "6580309318",
    title: "Torto Arado",
    authors: ["Itamar Vieira Junior"],
    publisher: "Todavia",
    publishedDate: "2019",
    pageCount: 264,
    description:
      "Duas irmãs crescem em uma comunidade rural marcada por memória, terra e resistência.",
    categories: ["Literatura brasileira", "Romance"],
    isbn10: "6580309318",
    isbn13: "9786580309313",
    detailPageUrl: "https://www.amazon.com.br/dp/6580309318",
  }),
  bootstrapBook({
    asin: "6555320354",
    title: "A hora da estrela",
    subtitle: "Edição comemorativa",
    authors: ["Clarice Lispector"],
    publisher: "Rocco",
    publishedDate: "2020-11-16",
    pageCount: 88,
    description:
      "Um romance breve e contundente sobre Macabéa, linguagem e invisibilidade.",
    categories: ["Literatura brasileira", "Clássicos"],
    isbn10: "6555320354",
    isbn13: "9786555320350",
    detailPageUrl: "https://www.amazon.com.br/dp/6555320354",
  }),
  bootstrapBook({
    asin: "8535930531",
    title: "Ensaio sobre a cegueira",
    authors: ["José Saramago"],
    publisher: "Companhia das Letras",
    publishedDate: "2017",
    pageCount: 312,
    description:
      "Uma epidemia inesperada expõe escolhas individuais e as estruturas de uma sociedade.",
    categories: ["Literatura portuguesa", "Ficção"],
    isbn10: "8535930531",
    isbn13: "9788535930534",
    detailPageUrl: "https://www.amazon.com.br/dp/8535930531",
  }),
  bootstrapBook({
    asin: "8535933395",
    title: "O avesso da pele",
    authors: ["Jeferson Tenório"],
    publisher: "Companhia das Letras",
    publishedDate: "2020",
    pageCount: 192,
    description:
      "Um filho recompõe a história do pai e encara as marcas deixadas pela violência e pelo racismo.",
    categories: ["Literatura brasileira", "Romance contemporâneo"],
    isbn10: "8535933395",
    isbn13: "9788535933390",
    detailPageUrl: "https://www.amazon.com.br/dp/8535933395",
  }),
];
