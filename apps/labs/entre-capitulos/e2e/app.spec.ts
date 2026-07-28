import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?demo=1#/profiles");
});

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
  await expect(page.getByText("Torto Arado").first()).toBeVisible();
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
  await page.getByRole("button", { name: /Humberto/ }).click();
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
