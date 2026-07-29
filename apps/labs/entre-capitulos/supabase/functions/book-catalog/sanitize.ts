export function object(
  value: unknown,
): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

export function text(value: unknown, maximum = 1_000): string {
  if (typeof value !== "string") return "";
  const withoutControlCharacters = [...value].filter((character) => {
    const code = character.codePointAt(0) ?? 0;
    return !(
      (code >= 0 && code <= 8) ||
      code === 11 ||
      code === 12 ||
      (code >= 14 && code <= 31) ||
      code === 127
    );
  }).join("");
  return withoutControlCharacters
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

export function descriptionText(value: unknown): string {
  if (typeof value === "string") return text(value, 8_000);
  return text(object(value)?.value, 8_000);
}

export function texts(
  value: unknown,
  maximumItems = 50,
  maximumLength = 300,
): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .map((item) => text(item, maximumLength))
      .filter(Boolean),
  )].slice(0, maximumItems);
}

export function canonicalWorkKey(value: unknown): string {
  const candidate = text(value, 120)
    .replace(/^https?:\/\/openlibrary\.org/i, "")
    .replace(/^\/?works\//i, "")
    .replace(/\.json$/i, "");
  if (/^OL[0-9]+W$/i.test(candidate)) return candidate.toUpperCase();
  if (/^manual:[a-z0-9][a-z0-9:_-]{2,95}$/i.test(candidate)) {
    return candidate.toLowerCase();
  }
  return "";
}

export function canonicalEditionKey(value: unknown): string {
  const candidate = text(value, 140)
    .replace(/^https?:\/\/openlibrary\.org/i, "")
    .replace(/^\/?books\//i, "")
    .replace(/\.json$/i, "");
  if (/^OL[0-9]+M$/i.test(candidate)) return candidate.toUpperCase();
  if (/^manual:[a-z0-9][a-z0-9:_-]{2,110}$/i.test(candidate)) {
    return candidate.toLowerCase();
  }
  return "";
}

export function safeHttpsUrl(value: unknown): string {
  const raw = text(value, 2_000);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password
    ) {
      return "";
    }
    return raw;
  } catch {
    return "";
  }
}

export function coverUrlFromId(value: unknown): string {
  const cover = Number(value);
  return Number.isSafeInteger(cover) && cover > 0
    ? `https://covers.openlibrary.org/b/id/${cover}-L.jpg`
    : "";
}

const LANGUAGE_ALIASES: Record<string, string> = {
  por: "pt",
  eng: "en",
  spa: "es",
  fre: "fr",
  fra: "fr",
  ger: "de",
  deu: "de",
  ita: "it",
};

export function languageCode(value: unknown): string {
  const candidate = text(value, 40)
    .replace(/^\/languages\//, "")
    .toLowerCase();
  return LANGUAGE_ALIASES[candidate] ?? candidate.slice(0, 3);
}

export function editionLanguage(value: unknown): string {
  if (typeof value === "string") return languageCode(value);
  if (!Array.isArray(value)) return "";
  for (const entry of value) {
    const candidate = typeof entry === "string"
      ? entry
      : object(entry)?.key;
    const normalized = languageCode(candidate);
    if (normalized) return normalized;
  }
  return "";
}

export function normalizedFormat(value: unknown): string {
  const format = text(value, 100).toLocaleLowerCase("pt-BR");
  if (!format) return "";
  if (/hardcover|capa dura/.test(format)) return "hardcover";
  if (/paperback|capa comum|brochura/.test(format)) return "paperback";
  if (/audiobook|áudio|audio/.test(format)) return "audiobook";
  if (/ebook|e-book|kindle|digital/.test(format)) return "ebook";
  return format;
}
