import { mkdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { installBookCatalogMocks } from "./bookCatalogFixture";

const outputDir = "test-results/visual";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await mkdir(outputDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installBookCatalogMocks(page);
});

async function capture(page: Page, fileName: string) {
  await page.waitForTimeout(550);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: `${outputDir}/${fileName}`,
    fullPage: true,
  });
}

async function captureViewport(page: Page, fileName: string) {
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0 }));
  await page.waitForTimeout(550);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: `${outputDir}/${fileName}`,
  });
}

async function enterDemoProfile(page: Page, profile: "Ana" | "Humberto") {
  await page.goto("/?demo=1#/profiles");
  await page.getByRole("button", { name: new RegExp(profile) }).click();
}

test("captures desktop catalog and private flows at 1440px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1024 });

  await page.goto("/?demo=1#/profiles");
  await expect(
    page.getByRole("heading", { name: "Quem vai ler agora?" }),
  ).toBeVisible();
  await capture(page, "profile-picker-desktop-1440.png");

  await page.getByRole("button", { name: /Ana/ }).click();
  await expect(page.getByRole("heading", { name: /Olá, Ana/ })).toBeVisible();
  await capture(page, "dashboard-desktop-1440.png");

  await page.goto("/?demo=1#/library");
  await expect(
    page.getByRole("heading", { name: "Minha estante" }),
  ).toBeVisible();
  await capture(page, "library-desktop-1440.png");

  await page.goto("/?demo=1#/livraria");
  await expect(
    page.getByRole("heading", {
      name: /Livros têm muitas formas de chegar até você/i,
    }),
  ).toBeVisible();
  await expect(page.locator(".catalog-work-card")).toHaveCount(4);
  await capture(page, "catalog-curated-desktop-1440.png");
  await captureViewport(page, "catalog-curated-viewport-desktop-1440.png");

  const search = page.getByLabel("Buscar livros, autores ou ISBN");
  await search.fill("Clarice Lispector");
  await search.press("Enter");
  await expect(page.locator(".catalog-work-card")).toHaveCount(1);
  await capture(page, "catalog-search-desktop-1440.png");

  await page.goto("/?demo=1#/livraria/obra/OL24141556W");
  await expect(
    page.getByRole("heading", { name: "Torto Arado" }),
  ).toBeVisible();
  await expect(page.locator(".catalog-edition-card")).toHaveCount(2);
  await capture(page, "catalog-work-detail-desktop-1440.png");

  await enterDemoProfile(page, "Humberto");
  await page.goto("/?demo=1#/onde-comprar");
  await expect(
    page.getByRole("heading", {
      name: "Onde encontrar sua próxima leitura.",
    }),
  ).toBeVisible();
  await capture(page, "where-to-buy-desktop-1440.png");

  await page.goto("/?demo=1#/curadoria");
  await expect(
    page.getByRole("heading", { level: 1, name: /Curadoria/i }),
  ).toBeVisible();
  await capture(page, "curation-readonly-desktop-1440.png");
});

test("captures catalog routes at 820px", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1060 });

  await page.goto("/#/livraria");
  await expect(
    page.getByRole("heading", {
      name: /Livros têm muitas formas de chegar até você/i,
    }),
  ).toBeVisible();
  await expect(page.locator(".catalog-work-card")).toHaveCount(4);
  await capture(page, "catalog-curated-tablet-820.png");
  await captureViewport(page, "catalog-curated-viewport-tablet-820.png");

  await page.goto("/#/livraria/obra/OL24141556W");
  await expect(
    page.getByRole("heading", { name: "Torto Arado" }),
  ).toBeVisible();
  await capture(page, "catalog-work-detail-tablet-820.png");

  await enterDemoProfile(page, "Humberto");
  await page.goto("/?demo=1#/onde-comprar");
  await expect(
    page.getByRole("heading", {
      name: "Onde encontrar sua próxima leitura.",
    }),
  ).toBeVisible();
  await capture(page, "where-to-buy-tablet-820.png");
});

test("captures mobile catalog states at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/?demo=1#/profiles");
  await expect(
    page.getByRole("heading", { name: "Quem vai ler agora?" }),
  ).toBeVisible();
  await capture(page, "profile-picker-mobile-390.png");
  await page.getByRole("button", { name: /Ana/ }).click();
  await expect(page.getByRole("heading", { name: /Olá, Ana/ })).toBeVisible();
  await capture(page, "dashboard-mobile-390.png");

  await page.goto("/?demo=1#/livraria");
  await expect(
    page.getByRole("heading", {
      name: /Livros têm muitas formas de chegar até você/i,
    }),
  ).toBeVisible();
  await capture(page, "catalog-curated-mobile-390.png");
  await captureViewport(page, "catalog-curated-viewport-mobile-390.png");

  const search = page.getByLabel("Buscar livros, autores ou ISBN");
  await search.fill("obra que não existe");
  await search.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: "Vamos procurar por outro caminho.",
    }),
  ).toBeVisible();
  await capture(page, "catalog-empty-mobile-390.png");

  await page.goto("/#/livraria/obra/OL24141556W");
  await expect(
    page.getByRole("heading", { name: "Torto Arado" }),
  ).toBeVisible();
  await capture(page, "catalog-work-detail-mobile-390.png");

  await enterDemoProfile(page, "Humberto");
  await page.goto("/?demo=1#/onde-comprar");
  await expect(
    page.getByRole("heading", {
      name: "Onde encontrar sua próxima leitura.",
    }),
  ).toBeVisible();
  await capture(page, "where-to-buy-mobile-390.png");

  await page.goto("/?demo=1#/curadoria");
  await expect(
    page.getByRole("heading", { level: 1, name: /Curadoria/i }),
  ).toBeVisible();
  await capture(page, "curation-readonly-mobile-390.png");
});

test("captures catalog error state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.unroute("**/__book-catalog-fixture");
  await page.route("**/__book-catalog-fixture", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "open_library_unavailable",
          message: "O catálogo aberto está temporariamente indisponível.",
        },
      }),
    });
  });
  await page.goto("/#/livraria");
  await expect(
    page.getByRole("heading", {
      name: "O catálogo não abriu desta vez.",
    }),
  ).toBeVisible();
  await capture(page, "catalog-error-desktop-1440.png");
});
