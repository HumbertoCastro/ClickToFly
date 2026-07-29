import { expect, test, type Locator, type Page } from "playwright/test";

const requiredSectionIds = [
  "top",
  "sinais",
  "servicos",
  "metodo",
  "setores",
  "ocorrencias",
  "duvidas",
  "contato",
  "agendar-contato",
] as const;

const viewports = [
  { label: "1440px", width: 1440, height: 900 },
  { label: "1280x720", width: 1280, height: 720 },
  { label: "1024px", width: 1024, height: 768 },
  { label: "768px", width: 768, height: 1024 },
  { label: "414px", width: 414, height: 896 },
  { label: "390px", width: 390, height: 844 },
  { label: "375px", width: 375, height: 812 },
  { label: "320px", width: 320, height: 720 },
] as const;

const locationLabel = "Tipo de local";
const problemLabel = "Conte em poucas palavras o que está acontecendo";
const submitButtonName = "Continuar no WhatsApp";
const expectedPestLabels = [
  "Baratas",
  "Cupins",
  "Formigas",
  "Mosquitos",
  "Roedores",
  "Escorpiões",
] as const;

type OpenCall = {
  url: string;
  target?: string;
  features?: string;
};

async function openLanding(page: Page) {
  // A relative URL keeps a configured deployment subpath such as
  // /projetos/orkin/ while resolving to / with the local base URL.
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#top")).toBeVisible();
}

async function installWindowOpenSpy(page: Page) {
  await page.addInitScript(() => {
    const calls: Array<{
      url: string;
      target?: string;
      features?: string;
    }> = [];

    Object.defineProperty(window, "__qaWindowOpenCalls", {
      configurable: false,
      value: calls,
      writable: false,
    });

    window.open = ((url?: string | URL, target?: string, features?: string) => {
      calls.push({
        url: String(url ?? ""),
        target,
        features,
      });
      return null;
    }) as typeof window.open;
  });
}

async function readWindowOpenCalls(page: Page) {
  return page.evaluate(
    () =>
      (
        window as typeof window & {
          __qaWindowOpenCalls: OpenCall[];
        }
      ).__qaWindowOpenCalls,
  );
}

async function tabUntilFocused(
  page: Page,
  target: Locator,
  maximumTabs = 40,
) {
  for (let attempt = 0; attempt < maximumTabs; attempt += 1) {
    await page.keyboard.press("Tab");

    if (
      await target.evaluate(
        (element) => element === element.ownerDocument.activeElement,
      )
    ) {
      return;
    }
  }

  throw new Error(
    `The element was not reached after ${maximumTabs} keyboard Tab presses.`,
  );
}

async function expectVisibleFocusRing(target: Locator) {
  const focusStyle = await target.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      boxShadow: style.boxShadow,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    };
  });

  const hasOutline =
    focusStyle.outlineStyle !== "none" && focusStyle.outlineWidth >= 2;
  const hasFocusShadow = focusStyle.boxShadow !== "none";

  expect(
    hasOutline || hasFocusShadow,
    `Expected a visible outline or focus shadow, received ${JSON.stringify(focusStyle)}`,
  ).toBe(true);
}

async function expectLoadedImage(image: Locator, message: string) {
  await expect
    .poll(
      () =>
        image.evaluate(
          (element) =>
            element instanceof HTMLImageElement &&
            element.complete &&
            element.naturalWidth > 0 &&
            element.naturalHeight > 0,
        ),
      { message },
    )
    .toBe(true);
}

async function expectRevealVisible(reveal: Locator) {
  await expect
    .poll(() =>
      reveal.evaluate((element) => {
        const style = getComputedStyle(element);
        const bounds = element.getBoundingClientRect();

        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number.parseFloat(style.opacity) >= 0.99 &&
          bounds.width > 0 &&
          bounds.height > 0
        );
      }),
    )
    .toBe(true);
}

for (const viewport of viewports) {
  test(`layout at ${viewport.label} has every anchor and no horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await openLanding(page);

    for (const id of requiredSectionIds) {
      await expect(
        page.locator(`#${id}`),
        `Expected exactly one #${id} landmark`,
      ).toHaveCount(1);
    }

    await page.locator("#contato").scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);

    const dimensions = await page.evaluate(() => {
      const viewport = window.innerWidth;
      const offenders = Array.from(
        document.querySelectorAll<HTMLElement>("body *"),
      )
        .map((element) => {
          const bounds = element.getBoundingClientRect();
          return {
            bounds,
            descriptor: [
              element.tagName.toLowerCase(),
              element.id ? `#${element.id}` : "",
              element.dataset.reveal
                ? `[data-reveal="${element.dataset.reveal}"]`
                : "",
            ].join(""),
          };
        })
        .filter(
          ({ bounds }) =>
            bounds.width > 0 &&
            (bounds.left < -1 || bounds.right > viewport + 1),
        )
        .slice(0, 8)
        .map(({ bounds, descriptor }) => ({
          descriptor,
          left: Math.round(bounds.left),
          right: Math.round(bounds.right),
          width: Math.round(bounds.width),
        }));

      return {
        body: document.body.scrollWidth,
        document: document.documentElement.scrollWidth,
        offenders,
        viewport,
      };
    });

    expect(
      Math.max(dimensions.body, dimensions.document),
      `Horizontal overflow: body=${dimensions.body}px, document=${dimensions.document}px, viewport=${dimensions.viewport}px, offenders=${JSON.stringify(dimensions.offenders)}`,
    ).toBeLessThanOrEqual(dimensions.viewport + 1);

    const horizontalScroll = await page.evaluate(() => {
      const previousBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(10_000, window.scrollY);
      const offset = window.scrollX;
      window.scrollTo(0, window.scrollY);
      document.documentElement.style.scrollBehavior = previousBehavior;
      return offset;
    });

    expect(horizontalScroll).toBe(0);
  });
}

test("critical hero content reveals while it is visibly entering the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openLanding(page);

  const heroCopy = page.locator('[data-reveal="hero-copy"]');
  await expect(heroCopy).toHaveAttribute("data-revealed", "true");
  await expect(
    page.locator('#top a[href="#agendar-contato"]'),
  ).toBeVisible();

  await page.setViewportSize({ width: 320, height: 720 });
  await openLanding(page);

  const heroMedia = page.locator("#top [data-hero-person]");
  await expect(heroMedia).toHaveAttribute("data-revealed", "true");
  await expectRevealVisible(heroMedia);
});

test("hero uses a transparent Orkin cutout without a visual frame", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openLanding(page);

  const heroPerson = page.locator("#top [data-hero-person]");
  const image = heroPerson.locator("img");
  await expectLoadedImage(image, "Hero employee cutout did not load");
  await expect(image).toHaveAttribute("fetchpriority", "high");
  await expect(image).not.toHaveAttribute("loading", "lazy");

  const assetPath = await image.evaluate(
    (element) => new URL(element.currentSrc || element.src).pathname,
  );
  expect(assetPath.toLowerCase()).toMatch(
    /\/assets\/editorial\/funcionario-orkin-cutout-v2-(760|1040)\.webp$/,
  );

  const presentation = await heroPerson.evaluate((element) => {
    const figureStyle = getComputedStyle(element);
    const heroImage = element.querySelector("img");

    if (!(heroImage instanceof HTMLImageElement)) {
      throw new Error("Hero cutout image was not found.");
    }

    const imageStyle = getComputedStyle(heroImage);
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      throw new Error("Canvas context is unavailable.");
    }

    context.drawImage(heroImage, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    ).data;
    let transparentPixels = 0;

    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] === 0) {
        transparentPixels += 1;
      }
    }

    return {
      backgroundColor: figureStyle.backgroundColor,
      borderStyle: figureStyle.borderStyle,
      boxShadow: figureStyle.boxShadow,
      clipPath: figureStyle.clipPath,
      objectFit: imageStyle.objectFit,
      transparentRatio:
        transparentPixels / (canvas.width * canvas.height),
    };
  });

  expect(presentation).toMatchObject({
    backgroundColor: "rgba(0, 0, 0, 0)",
    borderStyle: "none",
    boxShadow: "none",
    clipPath: "none",
    objectFit: "contain",
  });
  expect(presentation.transparentRatio).toBeGreaterThan(0.25);

  const mediaBox = await heroPerson.boundingBox();
  const imageBox = await image.boundingBox();

  expect(mediaBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  expect(
    Math.abs(
      imageBox!.y +
        imageBox!.height -
        (mediaBox!.y + mediaBox!.height),
    ),
  ).toBeLessThanOrEqual(1);
  expect(imageBox!.height).toBeGreaterThan(mediaBox!.height);
});

test("hero keeps the primary CTA above the desktop fold and the mobile reading order intact", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await openLanding(page);

    const ctaBox = await page
      .locator('#top a[href="#agendar-contato"]')
      .boundingBox();
    const copyBox = await page.locator('[data-reveal="hero-copy"]').boundingBox();
    const personBox = await page.locator("[data-hero-person]").boundingBox();

    expect(ctaBox).not.toBeNull();
    expect(copyBox).not.toBeNull();
    expect(personBox).not.toBeNull();
    expect(ctaBox!.y + ctaBox!.height).toBeLessThanOrEqual(viewport.height);
    expect(copyBox!.x + copyBox!.width).toBeLessThanOrEqual(personBox!.x);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await openLanding(page);

  const mobileActions = await page
    .locator('#top a[href="tel:+553133446600"]')
    .boundingBox();
  const mobilePerson = await page.locator("[data-hero-person]").boundingBox();

  expect(mobileActions).not.toBeNull();
  expect(mobilePerson).not.toBeNull();
  expect(mobileActions!.y + mobileActions!.height).toBeLessThanOrEqual(
    mobilePerson!.y,
  );
});

test("primary navigation reaches every advertised section", async ({ page }) => {
  await openLanding(page);

  const navigation = page.getByRole("navigation", {
    name: "Navegação principal",
    exact: true,
  });

  for (const id of [
    "servicos",
    "metodo",
    "setores",
    "ocorrencias",
    "duvidas",
  ] as const) {
    const link = navigation.locator(`a[href="#${id}"]`);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
    await expect(link).toHaveAttribute("aria-current", "location");
  }
});

test("skip link and form controls expose visible keyboard focus", async ({
  page,
}) => {
  await openLanding(page);

  const skipLink = page.getByRole("link", {
    name: "Ir para o conteúdo",
    exact: true,
  });

  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await expectVisibleFocusRing(skipLink);

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#conteudo$/);
  await expect(page.locator("#conteudo")).toBeInViewport();

  const location = page.getByRole("combobox", {
    name: locationLabel,
    exact: true,
  });
  await tabUntilFocused(page, location);
  await expect(location).toBeFocused();
  await expectVisibleFocusRing(location);

  const problem = page.getByRole("textbox", {
    name: problemLabel,
    exact: true,
  });
  await page.keyboard.press("Tab");
  await expect(problem).toBeFocused();
  await expectVisibleFocusRing(problem);

  const submitButton = page.getByRole("button", {
    name: submitButtonName,
    exact: true,
  });
  await tabUntilFocused(page, submitButton, 6);
  await expect(submitButton).toBeFocused();
  await expectVisibleFocusRing(submitButton);
});

test("reduced-motion preference removes meaningful animation and smooth scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLanding(page);

  const motion = await page.evaluate(() => {
    const toMilliseconds = (duration: string) =>
      duration
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) =>
          part.endsWith("ms")
            ? Number.parseFloat(part)
            : Number.parseFloat(part) * 1_000,
        );

    const elements = Array.from(document.querySelectorAll("*"));
    const durations = elements.flatMap((element) => {
      const style = getComputedStyle(element);
      return [
        ...toMilliseconds(style.animationDuration),
        ...toMilliseconds(style.transitionDuration),
      ];
    });

    return {
      matchesPreference: matchMedia("(prefers-reduced-motion: reduce)").matches,
      maximumDuration: Math.max(0, ...durations),
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    };
  });

  expect(motion.matchesPreference).toBe(true);
  expect(motion.scrollBehavior).toBe("auto");
  expect(motion.maximumDuration).toBeLessThanOrEqual(0.02);

  const reveals = page.locator("[data-reveal]");
  expect(await reveals.count()).toBeGreaterThan(0);
  await expect(
    page.locator('[data-reveal][data-revealed="false"]'),
    "Reduced motion must reveal content without waiting for scroll",
  ).toHaveCount(0, { timeout: 1_000 });

  for (let index = 0; index < (await reveals.count()); index += 1) {
    await expectRevealVisible(reveals.nth(index));
  }
});

test("reveal content becomes visible after entering the viewport", async ({
  page,
}) => {
  await openLanding(page);

  const reveals = page.locator("[data-reveal]");
  const revealCount = await reveals.count();
  expect(revealCount).toBeGreaterThan(0);
  expect(
    await page.locator('[data-reveal][data-revealed="false"]').count(),
    "At least one below-the-fold reveal should start pending",
  ).toBeGreaterThan(0);

  for (let index = 0; index < revealCount; index += 1) {
    const reveal = reveals.nth(index);
    await reveal.evaluate((element) => {
      document.documentElement.style.scrollBehavior = "auto";
      element.scrollIntoView({
        behavior: "instant",
        block: "center",
        inline: "nearest",
      });
    });
    await expect(reveal).toHaveAttribute("data-revealed", "true");
    await expectRevealVisible(reveal);
  }
});

test("revealed content stays visible after React state updates and revisiting a section", async ({
  page,
}) => {
  await openLanding(page);

  const heroCopy = page.locator('[data-reveal="hero-copy"]');
  await expect(heroCopy).toHaveAttribute("data-revealed", "true");

  const occurrenceSection = page.locator("#ocorrencias");
  await occurrenceSection.scrollIntoViewIfNeeded();
  await occurrenceSection
    .getByRole("button", { name: "Roedores", exact: true })
    .click();
  await expect(occurrenceSection.locator("article h3")).toHaveText("Roedores");

  await page.locator("#top").scrollIntoViewIfNeeded();
  await expect(heroCopy).toHaveAttribute("data-revealed", "true");
  await expectRevealVisible(heroCopy);
});

test("header enters and leaves its compact state across the scroll threshold", async ({
  page,
}) => {
  await openLanding(page);

  const header = page.locator("header").first();
  await expect(header).toHaveAttribute("data-header-compact", "false");
  const expandedHeight = await header.evaluate(
    (element) => element.getBoundingClientRect().height,
  );

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 25);
  });

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(24);
  await expect(header).toHaveAttribute("data-header-compact", "true");
  await expect
    .poll(() =>
      header.evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBeLessThan(expandedHeight);

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(header).toHaveAttribute("data-header-compact", "false");
});

test("header and footer use only the favicon brand image", async ({ page }) => {
  await openLanding(page);

  const landmarks = [
    { label: "header", locator: page.locator("header").first() },
    { label: "footer", locator: page.locator("footer").first() },
  ];

  for (const landmark of landmarks) {
    await landmark.locator.scrollIntoViewIfNeeded();
    const images = landmark.locator.locator("img");
    await expect(
      images,
      `Expected one favicon image in the ${landmark.label}`,
    ).toHaveCount(1);

    const image = images.first();
    await expect(image).toBeVisible();
    await expectLoadedImage(
      image,
      `${landmark.label} favicon did not load with natural dimensions`,
    );

    const pathname = await image.evaluate(
      (element) => new URL(element.currentSrc || element.src).pathname,
    );
    expect(pathname.toLowerCase()).toMatch(/\/favicon\.png$/);
  }

  await expect(
    page.locator('img[src*="ambiente-orkin-lockup.webp"]:visible'),
    "The legacy lockup must not remain visible",
  ).toHaveCount(0);
});

test("six labelled pest cards use loaded WebP images instead of SVG icons", async ({
  page,
}) => {
  await openLanding(page);

  const pestSection = page.locator("#ocorrencias");
  await pestSection.scrollIntoViewIfNeeded();
  const cards = pestSection.locator("li:has(img)");
  await expect(cards).toHaveCount(6);

  const labels = (await cards.locator("strong").allTextContents()).map((label) =>
    label.trim(),
  );
  await expect(cards.locator("strong")).toHaveCount(6);
  expect([...labels].sort()).toEqual([...expectedPestLabels].sort());

  for (let index = 0; index < expectedPestLabels.length; index += 1) {
    const card = cards.nth(index);
    const image = card.locator("img");
    await expect(image).toHaveCount(1);
    await expect(image).toBeVisible();
    await expectLoadedImage(
      image,
      `Pest image for ${labels[index] ?? `card ${index + 1}`} did not load`,
    );

    const pathname = await image.evaluate(
      (element) => new URL(element.currentSrc || element.src).pathname,
    );
    expect(pathname.toLowerCase()).toMatch(/\/assets\/pests\/[^/]+\.webp$/);
  }

  await expect(pestSection.locator('img[src$=".svg"]')).toHaveCount(0);
});

test("mobile conversion links provide touch-sized targets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLanding(page);

  const targets = [
    page.locator("#top").getByRole("link", { name: /Ou ligue/ }),
    page.locator("#servicos").getByRole("link", {
      name: /Falar com a equipe/,
    }).first(),
    page.locator("#servicos").getByRole("link", {
      name: /Falar com a equipe/,
    }).last(),
    page.getByRole("link", { name: "Política de privacidade" }),
  ];

  for (const target of targets) {
    const height = await target.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    expect(height).toBeGreaterThanOrEqual(44);
  }
});

test("mobile menu opens, reaches a section, and closes after navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLanding(page);

  const openButton = page.getByRole("button", { name: "Abrir menu" });
  const navigation = page.getByRole("navigation", {
    name: "Navegação principal",
  });

  await expect(navigation).toBeHidden();
  await openButton.click();
  await expect(
    page.getByRole("button", { name: "Fechar menu" }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(navigation).toBeVisible();

  await navigation.getByRole("link", { name: "Ocorrências" }).click();
  await expect(page).toHaveURL(/#ocorrencias$/);
  await expect(page.locator("#ocorrencias")).toBeInViewport();
  await expect(navigation).toBeHidden();
  await expect(openButton).toHaveAttribute("aria-expanded", "false");
});

test("occurrence explorer updates the featured guidance accessibly", async ({
  page,
}) => {
  await openLanding(page);

  const occurrenceSection = page.locator("#ocorrencias");
  await occurrenceSection.scrollIntoViewIfNeeded();
  const cupinsButton = occurrenceSection.getByRole("button", {
    name: "Cupins",
    exact: true,
  });

  await cupinsButton.click();
  await expect(cupinsButton).toHaveAttribute("aria-pressed", "true");
  await expect(occurrenceSection.locator("article h3")).toHaveText("Cupins");
  await expect(occurrenceSection.locator("article img")).toHaveAttribute(
    "src",
    /cupins\.webp$/,
  );
  await expect(occurrenceSection.locator("article")).toContainText(
    "Danos em madeira",
  );
});

test("FAQ answers expand without hiding the remaining questions", async ({
  page,
}) => {
  await openLanding(page);

  const faq = page.locator("#duvidas");
  await faq.scrollIntoViewIfNeeded();
  const question = faq.getByText("Como começa uma avaliação?", {
    exact: true,
  });
  const details = question.locator("..");

  await question.click();
  await expect(details).toHaveAttribute("open", "");
  await expect(details.locator("p")).toContainText(
    "A equipe começa entendendo o tipo de local",
  );
  await expect(faq.locator("summary")).toHaveCount(5);
});

test("every page image finishes loading with intrinsic dimensions", async ({
  page,
}) => {
  const failedImageRequests: string[] = [];

  page.on("requestfailed", (request) => {
    if (request.resourceType() === "image") {
      failedImageRequests.push(
        `${request.url()} (${request.failure()?.errorText ?? "request failed"})`,
      );
    }
  });
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && !response.ok()) {
      failedImageRequests.push(`${response.url()} (HTTP ${response.status()})`);
    }
  });

  await openLanding(page);

  const images = page.locator("img");
  const imageCount = await images.count();
  expect(imageCount).toBeGreaterThan(0);

  for (let index = 0; index < imageCount; index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expectLoadedImage(
      image,
      `Image ${index + 1} did not load: ${await image.getAttribute("src")}`,
    );
  }

  expect(failedImageRequests).toEqual([]);
});

test("problem description accepts uninterrupted typing without losing focus or characters", async ({
  page,
}) => {
  await openLanding(page);

  const problem = page.getByRole("textbox", {
    name: problemLabel,
    exact: true,
  });
  const description =
    "Há sinais de cupins no armário da cozinha desde o fim de semana.";

  await problem.focus();
  await problem.pressSequentially(description, { delay: 8 });

  await expect(problem).toBeFocused();
  await expect(problem).toHaveValue(description);
});

test("form validates required fields and builds the WhatsApp URL without opening it", async ({
  page,
}) => {
  await installWindowOpenSpy(page);
  let popupCount = 0;
  page.on("popup", () => {
    popupCount += 1;
  });

  await openLanding(page);

  const location = page.getByRole("combobox", {
    name: locationLabel,
    exact: true,
  });
  const problem = page.getByRole("textbox", {
    name: problemLabel,
    exact: true,
  });
  const submitButton = page.getByRole("button", {
    name: submitButtonName,
    exact: true,
  });

  await submitButton.click();

  await expect(
    page.getByRole("status"),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Revise");
  await expect(location).toHaveAttribute("aria-invalid", "true");
  await expect(problem).toHaveAttribute("aria-invalid", "true");
  await expect(location).toBeFocused();
  expect(await readWindowOpenCalls(page)).toEqual([]);

  const description =
    "Encontrei sinais de cupins no armário da cozinha há três dias.";

  await location.selectOption({ label: "Residência" });
  await problem.fill(description);
  await page
    .getByLabel("Dia de preferência (opcional)", { exact: true })
    .fill("2026-08-05");
  await page
    .getByRole("combobox", {
      name: "Período de preferência (opcional)",
    })
    .selectOption({ label: "Tarde" });
  await submitButton.click();

  await expect
    .poll(async () => (await readWindowOpenCalls(page)).length)
    .toBe(1);

  const [openCall] = await readWindowOpenCalls(page);
  const whatsappUrl = new URL(openCall.url);
  const message = whatsappUrl.searchParams.get("text");

  expect(whatsappUrl.searchParams.get("phone")).toBe("5531987930625");
  expect(message).toContain("Residência");
  expect(message).toContain(description);
  expect(message).toContain("05/08/2026");
  expect(message).toContain("Tarde");
  expect(message).toContain("sujeita à confirmação");
  expect(openCall.target).toBe("_blank");
  expect(openCall.features).toContain("noopener");
  expect(openCall.features).toContain("noreferrer");
  expect(popupCount).toBe(0);
});

test("the complete journey produces no runtime or console errors", async ({
  page,
}) => {
  const errors: string[] = [];

  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console: ${message.text()}`);
    }
  });

  await openLanding(page);

  for (const id of requiredSectionIds) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  }

  await page
    .locator("#ocorrencias")
    .getByRole("button", { name: "Roedores", exact: true })
    .click();
  await page
    .locator("#duvidas")
    .getByText("O que significa o método A.I.M.?", { exact: true })
    .click();

  expect(errors).toEqual([]);
});
