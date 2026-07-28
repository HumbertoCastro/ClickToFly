import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const outputDir = "test-results/visual";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await mkdir(outputDir, { recursive: true });
});

test("captures desktop flows", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 });

  await page.goto("/?demo=1#/profiles");
  await expect(
    page.getByRole("heading", { name: "Quem está lendo?" }),
  ).toBeVisible();
  await page.screenshot({
    path: `${outputDir}/profile-picker-desktop.png`,
    fullPage: true,
  });

  await page.getByRole("button", { name: /Ana/ }).click();
  await expect(page.getByRole("heading", { name: /Olá, Ana/ })).toBeVisible();
  await page.screenshot({
    path: `${outputDir}/dashboard-desktop.png`,
    fullPage: true,
  });

  await page.goto("/?demo=1#/library");
  await expect(
    page.getByRole("heading", { name: "Minha estante" }),
  ).toBeVisible();
  await page.screenshot({
    path: `${outputDir}/library-desktop.png`,
    fullPage: true,
  });

  await page.goto("/?demo=1#/books/entry-mar");
  await expect(
    page.getByRole("heading", { name: "O velho e o mar" }),
  ).toBeVisible();
  await page.screenshot({
    path: `${outputDir}/book-detail-desktop.png`,
    fullPage: true,
  });

});

test("captures mobile flows", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/?demo=1#/profiles");
  await page.getByRole("button", { name: /Ana/ }).click();
  await expect(page.getByRole("heading", { name: /Olá, Ana/ })).toBeVisible();
  await page.screenshot({
    path: `${outputDir}/dashboard-mobile.png`,
    fullPage: true,
  });

  await page.goto("/?demo=1#/library");
  await expect(
    page.getByRole("heading", { name: "Minha estante" }),
  ).toBeVisible();
  await page.screenshot({
    path: `${outputDir}/library-mobile.png`,
    fullPage: true,
  });

  await page.goto("/?demo=1#/books/new");
  await page
    .getByRole("button", { name: "Prefiro cadastrar manualmente" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Agora, faça deste livro o seu." }),
  ).toBeVisible();
  await page.screenshot({
    path: `${outputDir}/add-book-mobile.png`,
    fullPage: true,
  });

});
