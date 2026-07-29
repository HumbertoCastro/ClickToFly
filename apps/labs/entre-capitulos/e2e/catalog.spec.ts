import { expect, test, type Page } from "@playwright/test";
import {
  bookCatalogFixture,
  installBookCatalogMocks,
  type BookCatalogFixtureController,
} from "./bookCatalogFixture";

let catalog: BookCatalogFixtureController;

test.beforeEach(async ({ page }) => {
  catalog = await installBookCatalogMocks(page);
});

async function enterDemoProfile(page: Page, profile: "Ana" | "Humberto") {
  await page.goto("/?demo=1#/profiles");
  await page.getByRole("button", { name: new RegExp(profile) }).click();
}

test("abre a curadoria da home sem disparar uma busca artificial", async ({
  page,
}) => {
  await page.goto("/#/livraria");

  await expect(
    page.getByRole("heading", {
      name: /Livros têm muitas formas de chegar até você/i,
    }),
  ).toBeVisible();
  await expect(page.locator(".catalog-work-card")).toHaveCount(4);
  await expect(
    page.getByRole("heading", { name: "Escolhas da casa" }),
  ).toBeVisible();
  await expect(page.getByText("Dados do Open Library")).toBeVisible();
  await expect(page.locator(".catalog-work-card img")).toHaveCount(4);
  await expect(page.locator("body")).not.toContainText(/R\$\s*\d/);
  await expect(page.locator("body")).not.toContainText(/desconto/i);

  await expect
    .poll(() => catalog.requests.map((request) => request.operation))
    .toEqual(["collection"]);
});

test("busca uma obra por autora e abre o resultado agrupado", async ({
  page,
}) => {
  await page.goto("/#/livraria");

  const search = page.getByLabel("Buscar livros, autores ou ISBN");
  await search.fill("Clarice Lispector");
  await search.press("Enter");

  await expect(page).toHaveURL(
    /#\/livraria\?q=Clarice(?:\+|%20)Lispector/,
  );
  await expect(page.locator(".catalog-work-card")).toHaveCount(1);
  const card = page.locator(".catalog-work-card");
  await expect(card).toContainText("A Hora da Estrela");
  await expect(card).toContainText("1 edição localizada");
  await expect(card).toContainText("3 idiomas");

  await card.getByRole("link", { name: "Ver edições" }).click();
  await expect(page).toHaveURL(/#\/livraria\/obra\/OL1002120W$/);
  await expect(
    page.getByRole("heading", { name: "A Hora da Estrela" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      catalog.requests.some(
        (request) =>
          request.operation === "search" &&
          request.query === "Clarice Lispector",
      ),
    )
    .toBe(true);
});

test("preserva duas edições da mesma obra e oferece três canais neutros", async ({
  page,
}) => {
  await page.goto("/#/livraria/obra/OL24141556W");

  await expect(
    page.getByRole("heading", { name: "Torto Arado" }),
  ).toBeVisible();
  await expect(page.locator(".catalog-edition-card")).toHaveCount(2);
  await expect(
    page.getByRole("heading", {
      name: "A mesma história, em outras formas",
    }),
  ).toBeVisible();

  const firstEdition = page.locator(".catalog-edition-card").first();
  await expect(firstEdition).toContainText("9786556927190");
  await expect(firstEdition).toContainText("Capa dura");
  await expect(
    firstEdition.getByText("Amazon Brasil", { exact: true }),
  ).toBeVisible();
  await expect(
    firstEdition.getByText("Estante Virtual", { exact: true }),
  ).toBeVisible();
  await expect(
    firstEdition.getByText("Mercado Livre", { exact: true }),
  ).toBeVisible();

  const directAmazon = firstEdition.getByRole("link", {
    name: /Ver esta edição na loja em Amazon/,
  });
  await expect(directAmazon).toHaveAttribute(
    "href",
    "https://www.amazon.com.br/Torto-arado-Itamar-Vieira-Junior/dp/6556927198?&linkCode=ll2&tag=entrecapitu04-20&linkId=46ba8e2caeaa429f238ceb6624dd8111&ref_=as_li_ss_tl",
  );
  await expect(directAmazon).toHaveAttribute(
    "rel",
    "sponsored noopener noreferrer",
  );
  await expect(
    firstEdition.getByRole("link", {
      name: /Buscar na loja em Estante Virtual/,
    }),
  ).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByText(/Alguns links são afiliados/)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/R\$\s*\d/);
});

test("volta do login ao detalhe e salva a obra no nível canônico", async ({
  page,
}) => {
  await page.goto("/#/livraria/obra/OL24141556W");
  await page.getByRole("button", { name: "Quero ler" }).click();

  await expect(page).toHaveURL(
    /#\/login\?returnTo=%2Flivraria%2Fobra%2FOL24141556W/,
  );
  await page.getByLabel("Senha da casa").fill("estante-segura");
  await page.getByRole("button", { name: "Entrar na biblioteca" }).click();
  await expect(
    page.getByRole("heading", { name: "Quem vai ler agora?" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Ana/ }).click();
  await expect(page).toHaveURL(/#\/livraria\/obra\/OL24141556W$/);
  await page.getByRole("button", { name: "Quero ler" }).click();
  await expect(
    page.getByRole("button", { name: "Está na sua lista" }),
  ).toBeDisabled();

  const savedBook = await page.evaluate(() => {
    const state = JSON.parse(
      localStorage.getItem("entre-capitulos.state.v1") ?? "{}",
    ) as {
      books?: Array<Record<string, unknown> & { title: string }>;
    };
    return state.books?.find((book) => book.title === "Torto Arado");
  });
  expect(savedBook).toMatchObject({
    source: "open_library",
    catalogWorkKey: "OL24141556W",
    catalogEditionKey: "manual:isbn:9786556927190",
  });
  expect(savedBook).not.toHaveProperty("offer");
  expect(savedBook).not.toHaveProperty("detailPageUrl");

  await page.goto("/#/onde-comprar");
  await expect(
    page.getByRole("heading", {
      name: "Onde encontrar sua próxima leitura.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Torto Arado" }),
  ).toBeVisible();
  await expect(page.locator(".where-to-buy-edition")).toHaveCount(2);
});

test("redireciona /ofertas e organiza a lista demo em /onde-comprar", async ({
  page,
}) => {
  await enterDemoProfile(page, "Humberto");
  await page.goto("/?demo=1#/ofertas");

  await expect(page).toHaveURL(/\?demo=1#\/onde-comprar$/);
  await expect(
    page.getByRole("heading", {
      name: "Onde encontrar sua próxima leitura.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "O avesso da pele" }),
  ).toBeVisible();
  await expect(page.getByText("BUSCA ASSISTIDA")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Localizar obra" }),
  ).toHaveAttribute("href", /q=Mem/);
  await expect(
    page.getByRole("link", {
      name: /Ver esta edição na loja em Amazon/,
    }),
  ).toHaveAttribute("rel", "sponsored noopener noreferrer");
});

test("resolve um livro legado no detalhe sem alterar seu registro pessoal", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  await enterDemoProfile(page, "Ana");
  await page.evaluate(() => {
    const storageKey = "entre-capitulos.demo-state.v3";
    const state = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as {
      books?: Array<Record<string, unknown> & { id: string }>;
    };
    const book = state.books?.find(
      (candidate) => candidate.id === "book-torto-arado",
    );
    if (!book) throw new Error("Fixture de Torto Arado ausente.");
    delete book.catalogWorkKey;
    delete book.catalogEditionKey;
    book.source = "google_books";
    book.sourceId = "legacy-google-volume";
    localStorage.setItem(storageKey, JSON.stringify(state));
  });

  await page.goto("/?demo=1#/books/entry-torto");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Onde encontrar esta edição" }),
  ).toBeVisible();

  await expect
    .poll(async () => {
      const stored = await page.evaluate(() => {
        const state = JSON.parse(
          localStorage.getItem("entre-capitulos.demo-state.v3") ?? "{}",
        ) as {
          books?: Array<Record<string, unknown> & { id: string }>;
          entries?: Array<Record<string, unknown> & { id: string }>;
        };
        return {
          book: state.books?.find(
            (candidate) => candidate.id === "book-torto-arado",
          ),
          entry: state.entries?.find(
            (candidate) => candidate.id === "entry-torto",
          ),
        };
      });
      return { ...stored, browserErrors };
    })
    .toMatchObject({
      book: {
        source: "google_books",
        sourceId: "legacy-google-volume",
        catalogWorkKey: "OL24141556W",
        catalogEditionKey: "OL35663926M",
        isbn13: "9786580309313",
      },
      entry: {
        status: "completed",
        currentPage: 264,
        review:
          "Uma leitura de voz muito própria. A relação entre terra, memória e pertencimento fica ecoando depois do fim.",
        ratings: {
          writing_quality: 10,
          engagement: 9,
          theme: 10,
        },
      },
      browserErrors: [],
    });
});

test("retorna à curadoria após o login sem exigir perfil ativo", async ({
  page,
}) => {
  await page.goto("/#/curadoria");
  await expect(page).toHaveURL(
    /#\/login\?returnTo=%2Fcuradoria/,
  );

  await page.getByLabel("Senha da casa").fill("estante-segura");
  await page.getByRole("button", { name: "Entrar na biblioteca" }).click();

  await expect(page).toHaveURL(/#\/curadoria$/);
  await expect(
    page.getByRole("heading", {
      name: /Curadoria com contexto, edição por edição/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quem vai ler agora?" }),
  ).toHaveCount(0);
});

for (const [legacyAsin, workKey] of Object.entries(
  bookCatalogFixture.legacyWorkKeys,
)) {
  test(`redireciona o endereço legado ${legacyAsin} para a obra`, async ({
    page,
  }) => {
    const expectedWork = bookCatalogFixture.works.find(
      (work) => work.workKey === workKey,
    );
    await page.goto(`/#/livraria/${legacyAsin}`);

    await expect(page).toHaveURL(
      new RegExp(`#\\/livraria\\/obra\\/${workKey}$`),
    );
    await expect(
      page.getByRole("heading", { name: expectedWork?.title ?? "" }),
    ).toBeVisible();
  });
}

test("mantém uma busca assistida para código legado desconhecido", async ({
  page,
}) => {
  await page.goto("/#/livraria/B0UNKNOWN1");

  await expect(
    page.getByRole("heading", {
      name: "Este código antigo ainda não tem uma obra confirmada.",
    }),
  ).toBeVisible();
  const search = page.getByLabel("Buscar obra");
  await search.fill("O velho e o mar");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(
    /#\/livraria\?q=O(?:\+|%20)velho(?:\+|%20)e(?:\+|%20)o(?:\+|%20)mar/,
  );
});

test("mantém o drawer de filtros acessível no celular", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/livraria");

  const trigger = page.getByRole("button", { name: /^Filtros/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Refinar descoberta" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Fechar filtros" }).last(),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("expõe fonte, privacidade, termos e contato sem prometer disponibilidade", async ({
  page,
}) => {
  await page.goto("/#/livraria");
  const footer = page.locator(".store-footer");

  await footer.getByRole("link", { name: "Privacidade" }).click();
  await expect(
    page.getByRole("heading", { name: "Política de privacidade" }),
  ).toBeVisible();
  await expect(
    page.locator('a[href="https://openlibrary.org/developers"]'),
  ).toBeVisible();

  await footer.getByRole("link", { name: "Termos" }).click();
  await expect(
    page.getByRole("heading", { name: "Termos de uso" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "feedback@hcwebsolutions.com.br" }),
  ).toHaveAttribute("href", "mailto:feedback@hcwebsolutions.com.br");
  await expect(page.locator("body")).toContainText(
    "não vende livros, compara preços, confirma estoque",
  );
});

test("o modo demo continua entrando sem depender de serviços externos", async ({
  page,
}) => {
  await page.goto("/?demo=1#/profiles");
  await expect(
    page.getByRole("heading", { name: "Quem vai ler agora?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Ana/ }).click();
  await expect(page.getByRole("heading", { name: /Olá, Ana/ })).toBeVisible();

  const globalSearch = page.getByLabel("Buscar livros ou autores");
  await globalSearch.fill("Clarice Lispector");
  await globalSearch.press("Enter");
  await expect(page).toHaveURL(
    /\?demo=1#\/livraria\?q=Clarice(?:\+|%20)Lispector/,
  );
  await expect(page.locator(".catalog-work-card")).toHaveCount(1);
});

test("expõe a curadoria completa em prévia segura no modo demo", async ({
  page,
}) => {
  await enterDemoProfile(page, "Ana");
  await page.goto("/?demo=1#/curadoria");

  await expect(
    page.getByRole("heading", {
      name: /Curadoria com contexto, edição por edição/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("note").getByText("Prévia segura, sem gravações"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Importe a obra; preserve as edições.",
    }),
  ).toBeVisible();
  await expect(page.locator(".curation-fieldset").first()).toHaveAttribute(
    "disabled",
    "",
  );

  await page.getByRole("button", { name: "Coleções" }).click();
  await expect(
    page.getByRole("heading", {
      name: "A página inicial começa aqui.",
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Identidade" }).click();
  await expect(
    page.getByRole("heading", {
      name: "O algoritmo sugere. A curadoria decide.",
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Onde encontrar" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Links diretos, sem prometer disponibilidade.",
    }),
  ).toBeVisible();
});
