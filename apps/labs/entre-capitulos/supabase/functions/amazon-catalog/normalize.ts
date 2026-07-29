import type {
  AmazonBookFormat,
  AmazonCatalogItem,
  AmazonCurrentOffer,
  AmazonOperation,
} from "./types.ts";

export const METADATA_TTL_MS = 24 * 60 * 60 * 1000;
export const COMMERCE_TTL_MS = 60 * 60 * 1000;

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function objects(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.map(object).filter((item): item is Record<string, unknown> => !!item)
    : [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function displayValue(value: unknown): string | null {
  const item = object(value);
  return text(item?.displayValue) ?? text(item?.value) ?? text(value);
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const result = typeof value === "number" ? value : Number(value);
  return Number.isFinite(result) ? result : null;
}

function isoOrNull(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function expiresAt(start: Date, durationMs: number): string {
  return new Date(start.getTime() + durationMs).toISOString();
}

function validAmazonUrl(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" &&
        (host === "amazon.com.br" || host === "www.amazon.com.br")
      ? raw
      : null;
  } catch {
    return null;
  }
}

function normalizeAuthors(itemInfo: Record<string, unknown>): string[] {
  const byLineInfo = object(itemInfo.byLineInfo);
  const contributors = objects(byLineInfo?.contributors);
  const authors = contributors.filter((contributor) => {
    const role = `${text(contributor.role) ?? ""} ${
      text(contributor.roleType) ?? ""
    }`.toLocaleLowerCase("pt-BR");
    return role.includes("author") || role.includes("autor");
  });
  const selected = authors.length ? authors : contributors;
  return [...new Set(selected.map((value) => text(value.name)).filter(
    (value): value is string => !!value,
  ))];
}

function normalizeLanguages(itemInfo: Record<string, unknown>): string[] {
  const contentInfo = object(itemInfo.contentInfo);
  const languages = object(contentInfo?.languages);
  const values = Array.isArray(languages?.displayValues)
    ? languages.displayValues
    : [];
  return [...new Set(values.map((value) => {
    const language = object(value);
    return displayValue(language) ?? text(language?.displayValue);
  }).filter((value): value is string => !!value))];
}

function externalIdentifiers(itemInfo: Record<string, unknown>): {
  isbn10: string | null;
  isbn13: string | null;
} {
  const externalIds = object(itemInfo.externalIds);
  const isbnValues = object(externalIds?.isbns)?.displayValues;
  const eanValues = object(externalIds?.eans)?.displayValues;
  const values = [
    ...(Array.isArray(isbnValues) ? isbnValues : []),
    ...(Array.isArray(eanValues) ? eanValues : []),
  ].map((value) =>
    (displayValue(value) ?? "").replace(/[^0-9X]/gi, "").toUpperCase()
  ).filter(Boolean);
  return {
    isbn10: values.find((value) => value.length === 10) ?? null,
    isbn13: values.find((value) => value.length === 13) ?? null,
  };
}

function inferFormat(
  itemInfo: Record<string, unknown>,
  variationAttributes: Record<string, unknown>[],
): AmazonBookFormat {
  const classifications = object(itemInfo.classifications);
  const candidates = [
    displayValue(classifications?.binding),
    ...variationAttributes.map((attribute) =>
      `${text(attribute.name) ?? ""} ${text(attribute.value) ?? ""}`
    ),
  ].filter((value): value is string => !!value)
    .join(" ")
    .toLocaleLowerCase("pt-BR");

  if (/(kindle|e-?book|ebook|digital)/i.test(candidates)) return "kindle";
  if (/(capa dura|hard ?cover|encadernado)/i.test(candidates)) {
    return "hardcover";
  }
  if (/(capa comum|paper ?back|brochura)/i.test(candidates)) {
    return "paperback";
  }
  if (/(audio ?book|audiolivro|áudio)/i.test(candidates)) return "audiobook";
  return "other";
}

function normalizeOffer(
  rawOffers: unknown,
  fetchedAt: Date,
): AmazonCurrentOffer | null {
  const offers = object(rawOffers);
  const listings = objects(offers?.listings);
  const selected = listings.find((listing) => listing.isBuyBoxWinner === true) ??
    listings[0];
  if (!selected) return null;
  const violatesMap =
    selected.violatesMAP === true ||
    displayValue(selected.violatesMAP)?.toLowerCase() === "true";
  if (violatesMap) return null;

  const price = object(selected.price);
  const money = object(price?.money);
  const amount = numberValue(money?.amount);
  const currency = text(money?.currency);
  if (amount === null || amount < 0 || currency !== "BRL") return null;

  const savingBasis = object(price?.savingBasis);
  const savingBasisMoney = object(savingBasis?.money);
  const savings = object(price?.savings);
  const savingsMoney = object(savings?.money);
  const deal = object(selected.dealDetails);
  const accessType = (text(deal?.accessType) ?? "")
    .replaceAll("_", "")
    .toUpperCase();
  const dealStart = isoOrNull(deal?.startTime);
  const dealEnd = isoOrNull(deal?.endTime);
  const fetchedAtTime = fetchedAt.getTime();
  const dealStartTime = dealStart
    ? new Date(dealStart).getTime()
    : null;
  const dealEndTime = dealEnd ? new Date(dealEnd).getTime() : null;
  const dealIsActive =
    (dealStartTime === null || dealStartTime <= fetchedAtTime) &&
    (dealEndTime === null || dealEndTime > fetchedAtTime);
  const availability = text(object(selected.availability)?.type) ??
    text(object(selected.availability)?.message);
  const availabilityKey = (availability ?? "").replaceAll("_", "")
    .replaceAll(" ", "").toUpperCase();
  const normalExpiry = fetchedAtTime + COMMERCE_TTL_MS;
  const nextDealBoundary =
    dealStartTime !== null && dealStartTime > fetchedAtTime
      ? dealStartTime
      : dealIsActive && dealEndTime !== null
        ? dealEndTime
        : normalExpiry;

  return {
    amount,
    currency: "BRL",
    displayAmount: text(money?.displayAmount) ?? `R$ ${amount.toFixed(2)}`,
    savingBasisAmount: numberValue(savingBasisMoney?.amount),
    savingBasisDisplayAmount: text(savingBasisMoney?.displayAmount),
    savingsAmount: numberValue(savingsMoney?.amount),
    savingsPercentage: numberValue(savings?.percentage),
    seller: text(object(selected.merchantInfo)?.name),
    availability,
    isAvailable: !["OUTOFSTOCK", "UNAVAILABLE", "UNKNOWN"].includes(
      availabilityKey,
    ),
    condition: text(object(selected.condition)?.value),
    isBuyBoxWinner: selected.isBuyBoxWinner === true,
    isPrimeExclusive:
      dealIsActive &&
      (accessType === "PRIMEEXCLUSIVE" ||
        accessType === "PRIMEEARLYACCESS"),
    dealBadge: dealIsActive ? text(deal?.badge) : null,
    dealStartsAt: dealIsActive ? dealStart : null,
    dealEndsAt: dealIsActive ? dealEnd : null,
    fetchedAt: fetchedAt.toISOString(),
    expiresAt: new Date(
      Math.min(normalExpiry, nextDealBoundary),
    ).toISOString(),
  };
}

function normalizeCategories(rawBrowseNodeInfo: unknown) {
  const browseNodeInfo = object(rawBrowseNodeInfo);
  return objects(browseNodeInfo?.browseNodes).map((node) => ({
    id: text(node.id) ?? "",
    name: text(node.displayName) ?? text(node.contextFreeName) ?? "",
    salesRank: numberValue(node.salesRank),
  })).filter((category) => category.id && category.name);
}

function normalizeRank(rawBrowseNodeInfo: unknown): number | null {
  const browseNodeInfo = object(rawBrowseNodeInfo);
  const websiteRank = numberValue(
    object(browseNodeInfo?.websiteSalesRank)?.salesRank,
  );
  if (websiteRank !== null) return websiteRank;
  const ranks = normalizeCategories(rawBrowseNodeInfo)
    .map((category) => category.salesRank)
    .filter((rank): rank is number => rank !== null);
  return ranks.length ? Math.min(...ranks) : null;
}

export function normalizeAmazonItem(
  value: unknown,
  fetchedAt = new Date(),
): AmazonCatalogItem | null {
  const raw = object(value);
  const asin = text(raw?.asin)?.toUpperCase() ?? "";
  const detailPageUrl = validAmazonUrl(raw?.detailPageURL);
  if (!/^[A-Z0-9]{10}$/.test(asin) || !detailPageUrl || !raw) return null;

  const itemInfo = object(raw.itemInfo) ?? {};
  const byLineInfo = object(itemInfo.byLineInfo);
  const contentInfo = object(itemInfo.contentInfo);
  const variationAttributes = objects(raw.variationAttributes);
  const salesRank = normalizeRank(raw.browseNodeInfo);
  const commerceExpiry = expiresAt(fetchedAt, COMMERCE_TTL_MS);
  const identifiers = externalIdentifiers(itemInfo);

  return {
    asin,
    parentAsin: text(raw.parentASIN)?.toUpperCase() ?? null,
    title: displayValue(itemInfo.title) ?? "Livro na Amazon",
    authors: normalizeAuthors(itemInfo),
    publisher: displayValue(byLineInfo?.manufacturer) ??
      displayValue(byLineInfo?.brand),
    publicationDate: displayValue(contentInfo?.publicationDate),
    languages: normalizeLanguages(itemInfo),
    pageCount: numberValue(object(contentInfo?.pagesCount)?.displayValue),
    isbn10: identifiers.isbn10,
    isbn13: identifiers.isbn13,
    format: inferFormat(itemInfo, variationAttributes),
    categories: normalizeCategories(raw.browseNodeInfo),
    imageUrl: text(object(object(object(raw.images)?.primary)?.large)?.url) ??
      text(object(object(object(raw.images)?.primary)?.medium)?.url) ??
      text(object(object(object(raw.images)?.primary)?.small)?.url),
    detailPageUrl,
    offer: normalizeOffer(raw.offersV2, fetchedAt),
    salesRank,
    salesRankFetchedAt: salesRank === null ? null : fetchedAt.toISOString(),
    salesRankExpiresAt: salesRank === null ? null : commerceExpiry,
    variationAttributes: variationAttributes.map((attribute) => ({
      name: text(attribute.name) ?? "",
      value: text(attribute.value) ?? "",
    })).filter((attribute) => attribute.name && attribute.value),
    featured: false,
    source: "creators",
    fetchedAt: fetchedAt.toISOString(),
    expiresAt: expiresAt(fetchedAt, METADATA_TTL_MS),
  };
}

export function extractRawItems(
  operation: AmazonOperation,
  body: unknown,
): unknown[] {
  const response = object(body);
  if (!response) return [];
  const container = operation === "search"
    ? object(response.searchResult)
    : operation === "variations"
    ? object(response.variationsResult)
    : object(response.itemsResult) ?? object(response.itemResults);
  return Array.isArray(container?.items) ? container.items : [];
}

export function normalizeAmazonResponse(
  operation: AmazonOperation,
  body: unknown,
  fetchedAt = new Date(),
  expectedPartnerTag?: string,
): AmazonCatalogItem[] {
  return extractRawItems(operation, body)
    .map((item) => normalizeAmazonItem(item, fetchedAt))
    .filter((item): item is AmazonCatalogItem => item !== null)
    .filter((item) => {
      if (!expectedPartnerTag) return true;
      try {
        return new URL(item.detailPageUrl).searchParams.get("tag") ===
          expectedPartnerTag;
      } catch {
        return false;
      }
    })
    .map((item) => ({ ...item, featured: operation === "search" }));
}
