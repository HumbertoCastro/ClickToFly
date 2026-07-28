import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?demo=1#/profiles");
});

test("selects a profile and browses the personal library", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Quem está lendo?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Ana/ }).click();
  await expect(page.getByRole("heading", { name: /Olá, Ana/ })).toBeVisible();
  await page.getByRole("link", { name: /Minha estante/ }).click();
  await expect(
    page.getByRole("heading", { name: "Minha estante" }),
  ).toBeVisible();
  await expect(page.getByText("Torto Arado").first()).toBeVisible();
});

test("shows the household view with profile attribution", async ({ page }) => {
  await page.getByRole("button", { name: /Casa/ }).click();
  await expect(
    page.getByRole("heading", { name: /Histórias da casa inteira/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ana", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Caio", exact: true }),
  ).toBeVisible();
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
});

test("keeps spoiler content collapsed by default", async ({ page }) => {
  await page.getByRole("button", { name: /Caio/ }).click();
  await page.getByRole("link", { name: /Minha estante/ }).click();
  await page.getByText("O velho e o mar").first().click();
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
