import { expect, test } from "@playwright/test";
import {
  amazonFixturePartnerTag,
  installAmazonMocks,
} from "./amazonFixture";

test.beforeEach(async ({ page }) => {
  await installAmazonMocks(page);
});

test("navega, busca e abre um livro na Livraria pública", async ({ page }) => {
  await page.goto("/#/livraria");

  await expect(
    page.getByRole("heading", {
      name: /Toda grande leitura começa com uma boa descoberta/,
    }),
  ).toBeVisible();
  await expect(page.locator(".amazon-book-card")).toHaveCount(4);
  await expect(
    page.locator(".store-hero__book--placeholder"),
  ).toHaveCount(3);
  await expect(page.locator(".store-header .logo")).toHaveAttribute(
    "href",
    "#/livraria",
  );
  await expect(
    page.getByText("Consulte o preço na Amazon").first(),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Como associado da Amazon, eu ganho com compras qualificadas.",
    ).first(),
  ).toBeVisible();
  await expect(page.getByText("Publicidade").first()).toBeVisible();
  const officialBestsellersLink = page.getByRole("link", {
    name: "Explorar listas da Amazon",
  });
  await expect(officialBestsellersLink).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
  await expect(officialBestsellersLink).not.toContainText("Publicidade");

  const search = page.getByLabel("Buscar livros, autores ou ISBN");
  await search.fill("Clarice Lispector");
  await search.press("Enter");

  await expect(page).toHaveURL(/#\/livraria\?q=Clarice(?:\+|%20)Lispector/);
  await expect(page.locator(".amazon-book-card")).toHaveCount(1);
  await page
    .getByRole("link", { name: "Ver detalhes de A hora da estrela" })
    .click();

  await expect(
    page.getByRole("heading", { name: "A hora da estrela" }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Detalhes do livro — Entre Capítulos");
  await expect(
    page.getByRole("heading", { name: "A hora da estrela" }),
  ).toBeFocused();
  const amazonLink = page.getByRole("link", {
    name: "Ver oferta na Amazon",
  });
  await expect(amazonLink).toHaveAttribute(
    "href",
    `https://www.amazon.com.br/dp/6555320354?tag=${amazonFixturePartnerTag}&linkCode=ogi`,
  );
  await expect(page.locator("body")).not.toContainText("menor preço");
  await expect(page.locator("body")).not.toContainText("mais vendidos");
});

test("expõe páginas legais públicas e o canal de contato", async ({ page }) => {
  await page.goto("/#/livraria");

  const footer = page.locator(".store-footer");
  await footer.getByRole("link", { name: "Privacidade" }).click();
  await expect(
    page.getByRole("heading", { name: "Política de privacidade" }),
  ).toBeVisible();
  await expect(page).toHaveTitle(
    "Política de privacidade — Entre Capítulos",
  );
  await expect(
    page.getByRole("link", { name: "feedback@hcwebsolutions.com.br" }),
  ).toHaveAttribute("href", "mailto:feedback@hcwebsolutions.com.br");

  await footer.getByRole("link", { name: "Termos" }).click();
  await expect(
    page.getByRole("heading", { name: "Termos de uso" }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Termos de uso — Entre Capítulos");
  await expect(
    page.getByRole("link", { name: "feedback@hcwebsolutions.com.br" }),
  ).toHaveAttribute("href", "mailto:feedback@hcwebsolutions.com.br");
});

test("leva o visitante ao login, volta ao livro e inclui em Quero ler", async ({
  page,
}) => {
  await page.goto("/#/livraria");
  await page
    .getByRole("button", {
      name: "Marcar interesse em ler Torto Arado",
    })
    .click();

  await expect(page).toHaveURL(
    /#\/login\?returnTo=%2Flivraria%2F6580309318/,
  );
  await page.getByLabel("Senha da casa").fill("estante-segura");
  await page.getByRole("button", { name: "Entrar na biblioteca" }).click();
  await expect(
    page.getByRole("heading", { name: "Quem vai ler agora?" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Ana/ }).click();
  await expect(page).toHaveURL(/#\/livraria\/6580309318$/);
  await page.getByRole("button", { name: "Quero ler" }).click();
  await expect(
    page.getByRole("button", { name: "Está na sua lista" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Está na sua lista" }),
  ).toBeDisabled();
  const savedBook = await page.evaluate(() => {
    const state = JSON.parse(
      localStorage.getItem("entre-capitulos.state.v1") ?? "{}",
    ) as {
      books?: Array<Record<string, unknown> & {
        title: string;
        source: string;
        amazonAsins?: string[];
      }>;
    };
    return state.books?.find((book) => book.title === "Torto Arado");
  });
  expect(savedBook?.source).toBe("google_books");
  expect(savedBook?.amazonAsins).toEqual(
    expect.arrayContaining(["6580309318", "B0KINDLE12"]),
  );
  expect(savedBook).not.toHaveProperty("offer");
  expect(savedBook).not.toHaveProperty("detailPageUrl");

  await page.getByRole("link", { name: /Minha lista/ }).click();
  await expect(
    page.getByRole("heading", { name: "Ofertas da sua lista" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "A hora da estrela" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Torto Arado", exact: true }),
  ).toBeVisible();
});

test("mantém o drawer de filtros acessível no celular", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/livraria");

  const trigger = page.getByRole("button", { name: /^Filtros/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Filtrar livros" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Fechar filtros" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: /^Ver \d+ livros?$/ }),
  ).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog
    .getByLabel("Categoria")
    .selectOption({ label: "Literatura portuguesa" });
  await dialog.getByRole("button", { name: "Ver 1 livro" }).click();
  await expect(trigger).toBeFocused();
  await expect(page.locator(".amazon-book-card")).toHaveCount(1);

  await trigger.click();
  await page
    .getByRole("button", { name: "Fechar filtros" })
    .first()
    .click({ position: { x: 4, y: 4 } });
  await expect(trigger).toBeFocused();
});

test("a busca global autenticada abre a Livraria Amazon", async ({ page }) => {
  await page.goto("/?demo=1#/profiles");
  await page.getByRole("button", { name: /Ana/ }).click();

  const globalSearch = page.getByLabel("Buscar livros ou autores");
  await globalSearch.fill("Clarice Lispector");
  await globalSearch.press("Enter");

  await expect(page).toHaveURL(
    /#\/livraria\?q=Clarice(?:\+|%20)Lispector/,
  );
  await expect(
    page.getByLabel("Buscar livros, autores ou ISBN"),
  ).toHaveValue("Clarice Lispector");
});

test("mantém na página de ofertas livros ainda sem ASIN vinculado", async ({
  page,
}) => {
  await page.goto("/?demo=1#/profiles");
  await page.getByRole("button", { name: /Humberto/ }).click();
  await page
    .getByRole("link", { name: /1 livro para acompanhar nas ofertas atuais/ })
    .click();

  await expect(
    page.getByRole("heading", { name: "Ofertas da sua lista" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Um livro ainda precisa ser localizado.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Memória de minhas putas tristes")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Localizar edição" }),
  ).toHaveAttribute("href", /linkBookId=.*linkEntryId=/);

  const booksBefore = await page.evaluate(() => {
    const state = JSON.parse(
      localStorage.getItem("entre-capitulos.demo-state.v2") ?? "{}",
    ) as { books?: unknown[] };
    return state.books?.length ?? 0;
  });
  await page.getByRole("link", { name: "Localizar edição" }).click();
  await expect(page).toHaveURL(/linkBookId=.*linkEntryId=/);
  const refineSearch = page.getByLabel("Buscar livros, autores ou ISBN");
  await refineSearch.fill("Gabriel García Márquez");
  await refineSearch.press("Enter");
  await expect(page).toHaveURL(/linkBookId=.*linkEntryId=/);
  await expect(
    page.getByRole("link", {
      name: "Ver detalhes de Memória de minhas putas tristes",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Marcar interesse em ler Memória de minhas putas tristes",
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Memória de minhas putas tristes",
    }),
  ).toBeVisible();

  const linkedState = await page.evaluate(() => {
    return JSON.parse(
      localStorage.getItem("entre-capitulos.demo-state.v2") ?? "{}",
    ) as {
      books: Array<{
        title: string;
        amazonAsins?: string[];
      }>;
    };
  });
  const linkedBook = linkedState.books.find(
    (book) => book.title === "Memória de minhas putas tristes",
  );
  expect(linkedState.books).toHaveLength(booksBefore);
  expect(linkedBook?.amazonAsins).toContain("B0MEMORIA1");
});

test("preserva o vínculo ao buscar uma edição pelo detalhe pessoal", async ({
  page,
}) => {
  await page.goto("/?demo=1#/profiles");
  await page.getByRole("button", { name: /Humberto/ }).click();
  await page.goto("/?demo=1#/books/entry-memoria");

  await expect(
    page.getByRole("link", { name: "Buscar edição" }),
  ).toHaveAttribute(
    "href",
    /linkBookId=book-memoria&linkEntryId=entry-memoria/,
  );
});

test("não mistura o preço da edição física com o link Kindle", async ({
  page,
}) => {
  await page.goto("/#/livraria/6580309318");
  await expect(page.getByText("R$ 39,90")).toBeVisible();

  await page.getByRole("button", { name: "Kindle" }).click();
  await expect(page.getByText("R$ 39,90")).toHaveCount(0);
  await expect(
    page.getByText("Consulte o preço na Amazon"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Ver oferta na Amazon/ }),
  ).toHaveAttribute(
    "href",
    `https://www.amazon.com.br/dp/B0KINDLE12?tag=${amazonFixturePartnerTag}&linkCode=ogi`,
  );
});

test("mantém contraste mínimo nos textos pequenos e no foco", async ({
  page,
}) => {
  await page.goto("/#/livraria");
  await expect(
    page.getByRole("heading", {
      name: /Toda grande leitura começa com uma boa descoberta/,
    }),
  ).toBeVisible();
  const ratios = await page.evaluate(() => {
    function rgb(value: string): [number, number, number] {
      const values = value.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number);
      if (!values || values.length < 3) throw new Error(`Cor inválida: ${value}`);
      return values as [number, number, number];
    }
    function luminance(color: [number, number, number]) {
      const channels = color.map((value) => {
        const normalized = value / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return (
        channels[0] * 0.2126 +
        channels[1] * 0.7152 +
        channels[2] * 0.0722
      );
    }
    function contrast(left: string, right: string) {
      const first = luminance(rgb(left));
      const second = luminance(rgb(right));
      return (
        (Math.max(first, second) + 0.05) /
        (Math.min(first, second) + 0.05)
      );
    }

    const eyebrow = document.querySelector<HTMLElement>(".store-page .eyebrow")!;
    const search = document.querySelector<HTMLInputElement>(".store-search input")!;
    const button = document.querySelector<HTMLButtonElement>(".store-search button")!;
    button.focus();
    return {
      eyebrow: contrast(
        getComputedStyle(eyebrow).color,
        getComputedStyle(document.body).backgroundColor,
      ),
      placeholder: contrast(
        getComputedStyle(search, "::placeholder").color,
        getComputedStyle(search).backgroundColor === "rgba(0, 0, 0, 0)"
          ? "rgb(255, 254, 250)"
          : getComputedStyle(search).backgroundColor,
      ),
      focus: contrast(
        getComputedStyle(button).outlineColor,
        "rgb(255, 254, 250)",
      ),
    };
  });

  expect(ratios.eyebrow).toBeGreaterThanOrEqual(4.5);
  expect(ratios.placeholder).toBeGreaterThanOrEqual(4.5);
  expect(ratios.focus).toBeGreaterThanOrEqual(3);
});

test("reserva espaço para a navegação fixa no rodapé tablet", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/#/livraria");
  await expect(page.locator(".amazon-book-card")).toHaveCount(4);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  const nav = await page.locator(".store-header__nav").boundingBox();
  const disclosure = await page
    .locator(".store-footer .amazon-disclosure")
    .boundingBox();
  expect(nav).not.toBeNull();
  expect(disclosure).not.toBeNull();
  expect(disclosure!.y + disclosure!.height).toBeLessThanOrEqual(nav!.y);
});

test("não mostra preços nem catálogo quando a integração está desativada", async ({
  page,
}) => {
  await page.unroute("**/__amazon-catalog-fixture");
  await installAmazonMocks(page, "disabled");
  await page.goto("/#/livraria");

  await expect(
    page.getByRole("heading", {
      name: "O catálogo comercial ainda não está disponível.",
    }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("R$ 39,90");
});

test("não trata ASIN já vinculado como edição pendente no modo desativado", async ({
  page,
}) => {
  await page.goto("/?demo=1#/profiles");
  await page.getByRole("button", { name: /Humberto/ }).click();
  await page.evaluate(() => {
    const key = "entre-capitulos.demo-state.v2";
    const state = JSON.parse(localStorage.getItem(key) ?? "{}") as {
      books: Array<{
        id: string;
        amazonAsins?: string[];
      }>;
    };
    state.books = state.books.map((book) =>
      book.id === "book-memoria"
        ? { ...book, amazonAsins: ["B0MEMORIA1"] }
        : book,
    );
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.unroute("**/__amazon-catalog-fixture");
  await installAmazonMocks(page, "disabled");
  await page.reload();
  await page.goto("/?demo=1#/ofertas");

  await expect(
    page.getByRole("heading", {
      name: "A integração comercial está desativada.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Localizar edição" }),
  ).toHaveCount(0);
});
