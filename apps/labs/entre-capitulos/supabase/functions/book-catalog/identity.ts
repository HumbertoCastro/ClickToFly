import { validIsbn } from "./isbn.ts";
import type {
  IdentityDecision,
  IdentityRule,
  WorkCandidate,
} from "./types.ts";

const BLOCKED_VARIANTS = [
  "adaptacao",
  "adaptado",
  "resumo",
  "guia",
  "box",
  "livro de atividades",
  "activity book",
];

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/&/g, " e ")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTitle(value: string): string {
  return normalized(value)
    .replace(
      /\b(?:edicao|edition|ed|capa dura|capa comum|paperback|hardcover|brochura|comemorativa|especial|revista|revisada)\b/g,
      " ",
    )
    .replace(/\b(?:19|20)\d{2}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeAuthor(value: string): string {
  const parts = value.split(",").map((part) => normalized(part)).filter(Boolean);
  const reordered = parts.length === 2 ? `${parts[1]} ${parts[0]}` : parts.join(" ");
  return reordered.split(/\s+/).filter(Boolean).sort().join(" ");
}

export function textSimilarity(left: string, right: string): number {
  if (left === right) return 1;
  if (!left || !right) return 0;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length);
}

function volumeNumber(title: string): string {
  const match = normalized(title).match(
    /\b(?:vol(?:ume)?|livro|book|tomo)\s*(?:n(?:umero)?\s*)?([0-9]+|[ivxlcdm]+)\b/,
  );
  return match?.[1] ?? "";
}

function blockedVariant(title: string): boolean {
  const candidate = normalized(title);
  return BLOCKED_VARIANTS.some((marker) =>
    new RegExp(`\\b${marker.replace(/ /g, "\\s+")}\\b`).test(candidate)
  );
}

function sameAuthor(left: WorkCandidate, right: WorkCandidate): boolean {
  const leftAuthors = new Set(left.authors.map(normalizeAuthor).filter(Boolean));
  return right.authors.some((author) => leftAuthors.has(normalizeAuthor(author)));
}

function languagesConflict(left: WorkCandidate, right: WorkCandidate): boolean {
  if (!left.languages.length || !right.languages.length) return false;
  const aliases: Record<string, string> = { por: "pt", eng: "en", spa: "es" };
  const leftLanguages = new Set(
    left.languages.map((language) => aliases[language] ?? language),
  );
  return !right.languages.some(
    (language) => leftLanguages.has(aliases[language] ?? language),
  );
}

function matchingManualRule(
  left: WorkCandidate,
  right: WorkCandidate,
  rules: IdentityRule[],
): IdentityRule | undefined {
  const leftKeys = new Set([left.workKey, ...left.sourceWorkKeys]);
  const rightKeys = new Set([right.workKey, ...right.sourceWorkKeys]);
  return rules.find((rule) =>
    rule.editionKey === null &&
    (leftKeys.has(rule.workKeyA) && rightKeys.has(rule.workKeyB)) ||
    rule.editionKey === null &&
      (leftKeys.has(rule.workKeyB) && rightKeys.has(rule.workKeyA))
  );
}

export function compareWorkIdentity(
  left: WorkCandidate,
  right: WorkCandidate,
  rules: IdentityRule[] = [],
): IdentityDecision {
  const manual = matchingManualRule(left, right, rules);
  if (manual) {
    return {
      matches: manual.action === "merge",
      method: manual.action === "merge" ? "manual_merge" : "manual_separate",
      confidence: Number(manual.confidence),
    };
  }

  if (
    left.sourceWorkKeys.some((key) => right.sourceWorkKeys.includes(key)) ||
    left.workKey === right.workKey
  ) {
    return { matches: true, method: "same_work_key", confidence: 1 };
  }

  const leftIsbns = new Set(left.identifiers.map(validIsbn).filter(Boolean));
  if (right.identifiers.some((isbn) => leftIsbns.has(validIsbn(isbn)))) {
    return { matches: true, method: "shared_isbn", confidence: 1 };
  }

  const leftVolume = volumeNumber(left.title);
  const rightVolume = volumeNumber(right.title);
  if (leftVolume && rightVolume && leftVolume !== rightVolume) {
    return { matches: false, method: "volume_conflict", confidence: 1 };
  }

  if (blockedVariant(left.title) || blockedVariant(right.title)) {
    return { matches: false, method: "blocked_variant", confidence: 1 };
  }

  if (languagesConflict(left, right)) {
    return { matches: false, method: "language_conflict", confidence: 1 };
  }

  if (!sameAuthor(left, right)) {
    return { matches: false, method: "different_author", confidence: 1 };
  }

  const leftTitle = normalizeTitle(left.title);
  const rightTitle = normalizeTitle(right.title);
  if (leftTitle === rightTitle) {
    return { matches: true, method: "exact", confidence: 1 };
  }

  const confidence = textSimilarity(leftTitle, rightTitle);
  return confidence >= 0.86
    ? { matches: true, method: "fuzzy", confidence }
    : { matches: false, method: "below_threshold", confidence };
}

function uniqueNormalized(
  values: string[],
  normalize: (value: string) => string = normalized,
): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalize(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeCandidates(
  target: WorkCandidate,
  incoming: WorkCandidate,
): WorkCandidate {
  const sameSource = target.sourceWorkKeys.some(
    (key) => incoming.sourceWorkKeys.includes(key),
  );
  return {
    ...target,
    authors: uniqueNormalized([...target.authors, ...incoming.authors], normalizeAuthor),
    firstPublishedYear:
      [target.firstPublishedYear, incoming.firstPublishedYear]
        .filter((year): year is number => year !== null)
        .sort((left, right) => left - right)[0] ?? null,
    description:
      incoming.description.length > target.description.length
        ? incoming.description
        : target.description,
    subjects: uniqueNormalized([...target.subjects, ...incoming.subjects]).slice(
      0,
      50,
    ),
    languages: uniqueNormalized([
      ...target.languages,
      ...incoming.languages,
    ]).slice(0, 20),
    coverUrl: target.coverUrl || incoming.coverUrl,
    editionCount: sameSource
      ? Math.max(target.editionCount, incoming.editionCount)
      : target.editionCount + incoming.editionCount,
    sourceWorkKeys: [...new Set([
      ...target.sourceWorkKeys,
      ...incoming.sourceWorkKeys,
    ])],
    identifiers: [...new Set([
      ...target.identifiers,
      ...incoming.identifiers,
    ])],
  };
}

export function groupWorkCandidates(
  candidates: WorkCandidate[],
  rules: IdentityRule[] = [],
): WorkCandidate[] {
  const grouped: WorkCandidate[] = [];
  for (const candidate of candidates) {
    const matchIndex = grouped.findIndex(
      (existing) => compareWorkIdentity(existing, candidate, rules).matches,
    );
    if (matchIndex === -1) {
      grouped.push(candidate);
    } else {
      grouped[matchIndex] = mergeCandidates(grouped[matchIndex], candidate);
    }
  }
  return grouped;
}
