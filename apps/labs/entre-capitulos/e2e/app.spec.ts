import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?demo=1#/profiles");
});

async function openAnaShelf(page: Page) {
  await page.getByRole("button", { name: /Ana/ }).click();
  await page.getByRole("link", { name: /Minha estante/ }).click();
  await expect(
    page.getByRole("heading", { name: "Minha estante" }),
  ).toBeVisible();
}

test("selects a profile and browses the personal library", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Quem vai ler agora?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Ana/ }).click();
  await expect(page.getByRole("heading", { name: /Olá, Ana/ })).toBeVisible();
  await page.getByRole("link", { name: /Minha estante/ }).click();
  await expect(
    page.getByRole("heading", { name: "Minha estante" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Abrir Torto Arado" }),
  ).toBeVisible();
});

test("shows Ana's two books in one wooden shelf module", async ({ page }) => {
  await openAnaShelf(page);

  await expect(page.getByTestId("wooden-shelf-stack")).toBeVisible();
  await expect(page.getByTestId("wooden-shelf-module")).toHaveCount(1);
  await expect(page.locator('[data-testid^="shelf-book-"]')).toHaveCount(2);
  await expect(page.getByTestId("shelf-book-entry-ensaio")).toBeVisible();
  await expect(page.getByTestId("shelf-book-entry-torto")).toBeVisible();
});

test("reveals title, status, and rating in the shelf-book tooltip", async ({
  page,
}) => {
  await openAnaShelf(page);

  const shelfBook = page.getByTestId("shelf-book-entry-ensaio");
  const tooltip = shelfBook.getByRole("tooltip");

  await expect(tooltip).toBeHidden();
  await shelfBook.hover();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("Ensaio sobre a cegueira");
  await expect(tooltip.getByText("Lendo", { exact: true })).toBeVisible();
  await expect(tooltip.getByLabel("9,0 / 10")).toBeVisible();
});

test("shows and associates the shelf tooltip when reached by keyboard", async ({
  page,
}) => {
  await openAnaShelf(page);

  const shelfBook = page.getByTestId("shelf-book-entry-ensaio");
  const bookLink = shelfBook.getByRole("link", {
    name: "Abrir Ensaio sobre a cegueira",
  });
  const tooltip = shelfBook.getByRole("tooltip");

  await page.getByLabel("Ordenar estante").focus();
  await page.keyboard.press("Tab");

  await expect(bookLink).toBeFocused();
  await expect(tooltip).toBeVisible();
  const tooltipId = await tooltip.getAttribute("id");
  expect(tooltipId).toBeTruthy();
  await expect(bookLink).toHaveAttribute(
    "aria-describedby",
    tooltipId as string,
  );
});

test("opens a shelf book and navigates to its detail after the animation", async ({
  page,
}) => {
  await openAnaShelf(page);

  const shelfBook = page.getByTestId("shelf-book-entry-torto");
  await shelfBook
    .getByRole("link", { name: "Abrir Torto Arado" })
    .click();

  await expect(shelfBook).toHaveAttribute("data-opening", "true");
  await expect(page).toHaveURL(/#\/books\/entry-torto$/);
  await expect(
    page.getByRole("heading", { name: "Torto Arado" }),
  ).toBeVisible();
});

test("opens a shelf book without the animation delay for reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openAnaShelf(page);

  const startedAt = await page.evaluate(() => performance.now());
  await page
    .getByTestId("shelf-book-entry-torto")
    .getByRole("link", { name: "Abrir Torto Arado" })
    .click();
  await expect(page).toHaveURL(/#\/books\/entry-torto$/);
  const elapsed = await page.evaluate(
    (started) => performance.now() - started,
    startedAt,
  );

  expect(elapsed).toBeLessThan(450);
  await expect(
    page.getByRole("heading", { name: "Torto Arado" }),
  ).toBeVisible();
});

test("starts a catalog search from the dashboard toolbar", async ({ page }) => {
  await page.getByRole("button", { name: /Ana/ }).click();
  const globalSearch = page.getByLabel("Buscar livros ou autores");
  await globalSearch.fill("Clarice Lispector");
  await globalSearch.press("Enter");
  await expect(page.getByLabel("Buscar no catálogo")).toHaveValue(
    "Clarice Lispector",
  );
});

test("keeps only the two fixed profiles", async ({ page }) => {
  const profileCards = page.locator(".profile-card");
  await expect(profileCards).toHaveCount(2);
  await expect(page.getByRole("button", { name: /Humberto/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Ana/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Novo perfil/ }),
  ).toHaveCount(0);
});

test("shows the shared library with both readers", async ({ page }) => {
  await page.getByRole("button", { name: /Humberto/ }).click();
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Duas estantes, uma biblioteca/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ana", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Humberto", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Torto Arado").first()).toBeVisible();
  await expect(page.getByText("O velho e o mar").first()).toBeVisible();
});

test("creates a manual book with an optional rating", async ({ page }) => {
  await page.getByRole("button", { name: /Ana/ }).click();
  await page.getByRole("link", { name: /Adicionar livro/ }).first().click();
  await page
    .getByRole("button", { name: /Prefiro cadastrar manualmente/ })
    .click();
  await page.getByLabel("Título *").fill("A invenção de Morel");
  await page
    .getByLabel(/Autores/)
    .fill("Adolfo Bioy Casares");
  await page
    .getByLabel("URL da capa")
    .fill("http://127.0.0.1:4173/illustrations/library-still-life.jpg");
  await page.getByLabel("Status *").selectOption("completed");
  await page
    .getByRole("button", { name: "Avaliar este critério" })
    .first()
    .click();
  await page
    .getByRole("button", { name: /Adicionar à estante/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "A invenção de Morel" }),
  ).toBeVisible();

  const mockup = page.getByTestId("perspective-book-cover");
  const mold = mockup.locator('img[src$="/textures/book-mold.png"]');
  const projectedCover = mockup.getByRole("img", {
    name: "Capa de A invenção de Morel",
  });

  await expect(mockup).toBeVisible();
  await expect
    .poll(() =>
      mold.evaluate((image) => (image as HTMLImageElement).complete),
    )
    .toBe(true);
  await expect
    .poll(() =>
      mold.evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      projectedCover.evaluate(
        (image) => (image as HTMLImageElement).naturalWidth,
      ),
    )
    .toBeGreaterThan(0);
  await expect(mockup.locator(".book-mockup__projection")).not.toHaveCSS(
    "transform",
    "none",
  );
});

test("keeps spoiler content collapsed by default", async ({ page }) => {
  await page.getByRole("button", { name: /Humberto/ }).click();
  await page.getByRole("link", { name: /Minha estante/ }).click();
  await page
    .getByRole("link", { name: "Abrir O velho e o mar" })
    .click();
  const spoiler = page.getByText("Este texto contém spoilers");
  await expect(spoiler).toBeVisible();
  await expect(
    page.getByText(/Um pescador enfrenta sozinho/),
  ).not.toBeVisible();
  await spoiler.click();
  await expect(
    page.getByText(/Um pescador enfrenta sozinho/),
  ).toBeVisible();
});
