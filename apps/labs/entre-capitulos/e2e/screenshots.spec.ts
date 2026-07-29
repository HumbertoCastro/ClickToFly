import { mkdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const outputDir = "test-results/visual";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await mkdir(outputDir, { recursive: true });
});

async function capture(page: Page, fileName: string) {
  await page.waitForTimeout(550);
  await page.screenshot({
    path: `${outputDir}/${fileName}`,
    fullPage: true,
  });
}

async function captureViewport(page: Page, fileName: string) {
  await page.waitForTimeout(550);
  await page.screenshot({
    path: `${outputDir}/${fileName}`,
  });
}

test("captures desktop flows", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 });

  await page.goto("/?demo=1#/profiles");
  await expect(
    page.getByRole("heading", { name: "Quem vai ler agora?" }),
  ).toBeVisible();
  await capture(page, "profile-picker-desktop.png");

  await page.getByRole("button", { name: /Ana/ }).click();
  await expect(page.getByRole("heading", { name: /Olá, Ana/ })).toBeVisible();
  await capture(page, "dashboard-desktop.png");
  await page.setViewportSize({ width: 1708, height: 920 });
  await captureViewport(page, "dashboard-reference-viewport.png");
  await page.setViewportSize({ width: 1440, height: 1024 });

  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Duas estantes, uma biblioteca/ }),
  ).toBeVisible();
  await capture(page, "shared-library-desktop.png");

  await page.goto("/?demo=1#/library");
  await expect(
    page.getByRole("heading", { name: "Minha estante" }),
  ).toBeVisible();
  await capture(page, "library-desktop.png");

  await page.goto("/?demo=1#/books/entry-mar");
  await expect(
    page.getByRole("heading", { name: "O velho e o mar" }),
  ).toBeVisible();
  await capture(page, "book-detail-desktop.png");

});

test("captures mobile flows", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/?demo=1#/profiles");
  await expect(
    page.getByRole("heading", { name: "Quem vai ler agora?" }),
  ).toBeVisible();
  await capture(page, "profile-picker-mobile.png");
  await page.getByRole("button", { name: /Ana/ }).click();
  await expect(page.getByRole("heading", { name: /Olá, Ana/ })).toBeVisible();
  await capture(page, "dashboard-mobile.png");

  await page.goto("/?demo=1#/library");
  await expect(
    page.getByRole("heading", { name: "Minha estante" }),
  ).toBeVisible();
  await capture(page, "library-mobile.png");

  await page.goto("/?demo=1#/books/new");
  await page
    .getByRole("button", { name: "Prefiro cadastrar manualmente" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Agora, faça deste livro o seu." }),
  ).toBeVisible();
  await capture(page, "add-book-mobile.png");

});
