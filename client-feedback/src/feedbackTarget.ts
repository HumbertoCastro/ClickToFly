import type {
  DraftFeedback,
  ElementBounds,
  FeedbackItem,
  FeedbackItemType,
  FeedbackMode,
  FeedbackTarget,
} from './types';

const TEXT_SELECTOR = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'a',
  'button',
  'li',
  'blockquote',
  'label',
  'span',
  'strong',
  'em',
].join(',');

const SECTION_ROOT_SELECTOR = [
  '[data-feedback-id]',
  '[data-section]',
  'section',
  'article',
  'main',
  'header',
  'footer',
  'aside',
  '[aria-labelledby]',
  'form',
  'nav',
  'figure',
].join(',');

const SECTION_FALLBACK_SELECTOR = `${SECTION_ROOT_SELECTOR},div`;
const IMAGE_SELECTOR = 'img,picture,figure';
const SIGNATURE_SELECTOR = [
  TEXT_SELECTOR,
  SECTION_ROOT_SELECTOR,
  IMAGE_SELECTOR,
  '[style*="background"]',
].join(',');

type CapturePoint = {
  clientX: number;
  clientY: number;
};

export type FeedbackElementResolution = {
  element: Element | null;
  source: 'target' | 'legacy' | 'signature';
};

export function draftFromElement(
  target: EventTarget | null,
  mode: Exclude<FeedbackMode, 'review'>,
  route: string,
  point?: CapturePoint,
): DraftFeedback | null {
  if (!isDomElement(target)) {
    return null;
  }

  const element = resolveElement(target, mode);

  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const win = element.ownerDocument.defaultView;

  if (!win || rect.width < 2 || rect.height < 2) {
    return null;
  }

  const bounds = {
    x: Math.round(rect.left + win.scrollX),
    y: Math.round(rect.top + win.scrollY),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
  const image = getImageData(element);
  const originalText = getElementText(element);
  const type = resolveType(mode, Boolean(image.src));
  const targetData = buildFeedbackTarget(element, bounds, point, image.src);

  return {
    type,
    label: getElementLabel(element, mode),
    selector: targetData.primarySelector,
    target: targetData,
    comment: '',
    bounds,
    route,
    originalText: type === 'text-suggestion' ? originalText : undefined,
    suggestedText: type === 'text-suggestion' ? originalText : undefined,
    imageSrc: image.src || undefined,
    imageAlt: image.alt || undefined,
  };
}

export function resolveElement(target: Element, mode: Exclude<FeedbackMode, 'review'>) {
  if (mode === 'text') {
    return target.closest(TEXT_SELECTOR);
  }

  if (mode === 'section') {
    return target.closest(SECTION_ROOT_SELECTOR) || target.closest(SECTION_FALLBACK_SELECTOR);
  }

  const directImage = target.closest(IMAGE_SELECTOR);

  if (directImage) {
    return directImage;
  }

  return findBackgroundImageElement(target);
}

export function resolveFeedbackElement(
  item: FeedbackItem,
  doc: Document,
): FeedbackElementResolution {
  const target = item.target;
  const candidates = uniqueStrings([
    target?.primarySelector,
    ...(target?.selectorCandidates || []),
    item.selector,
  ]);

  for (const selector of candidates) {
    const matches = queryElements(doc, selector);

    if (matches.length === 0) {
      continue;
    }

    const element = chooseBestElement(matches, item);

    if (element) {
      return {
        element,
        source:
          target && selector !== item.selector && target.selectorCandidates.includes(selector)
            ? 'target'
            : selector === target?.primarySelector
              ? 'target'
              : 'legacy',
      };
    }
  }

  const sectionElement = target?.sectionSelector
    ? chooseBestElement(queryElements(doc, target.sectionSelector), item)
    : null;

  if (sectionElement) {
    const nested = chooseBestElement(queryElements(sectionElement, target?.tagName || ''), item);

    return { element: nested || sectionElement, source: 'target' };
  }

  const signatureElement = resolveBySignature(item, doc);

  return { element: signatureElement, source: 'signature' };
}

export function getElementBounds(element: Element): ElementBounds | null {
  const win = element.ownerDocument.defaultView;

  if (!win) {
    return null;
  }

  const rect = element.getBoundingClientRect();

  if (rect.width < 2 || rect.height < 2) {
    return null;
  }

  return {
    x: Math.round(rect.left + win.scrollX),
    y: Math.round(rect.top + win.scrollY),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

export function isDomElement(value: EventTarget | null): value is Element {
  if (!value || typeof value !== 'object' || !('ownerDocument' in value)) {
    return false;
  }

  const element = value as Element;
  const win = element.ownerDocument?.defaultView;

  return Boolean(win && value instanceof win.Element);
}

function buildFeedbackTarget(
  element: Element,
  capturedBounds: ElementBounds,
  point: CapturePoint | undefined,
  imageSrc: string,
): FeedbackTarget {
  const selectorCandidates = getSelectorCandidates(element);
  const primarySelector = selectorCandidates[0] || getStructuralSelector(element);
  const section = findSectionElement(element);
  const sectionSelector = section ? getBestDirectSelector(section) || getStructuralSelector(section) : '';
  const textFingerprint = createTextFingerprint(getElementText(element));
  const clickOffsetRatio = getClickOffsetRatio(element, point);

  return {
    version: 1,
    primarySelector,
    selectorCandidates,
    sectionSelector: sectionSelector || undefined,
    tagName: element.tagName.toLowerCase(),
    textFingerprint: textFingerprint || undefined,
    imageSrc: imageSrc || undefined,
    clickOffsetRatio,
    capturedBounds,
  };
}

function getSelectorCandidates(element: Element) {
  const candidates: string[] = [];
  const directSelector = getBestDirectSelector(element);

  pushCandidate(candidates, directSelector, element);

  const section = findSectionElement(element);
  const sectionSelector = section ? getBestDirectSelector(section) || getStructuralSelector(section) : '';

  if (section && sectionSelector && section !== element) {
    pushCandidate(candidates, `${sectionSelector} > ${getRelativeSelector(section, element)}`, element);
    pushCandidate(candidates, `${sectionSelector} ${getRelativeSelector(section, element)}`, element);
  }

  pushCandidate(candidates, getSemanticSelector(element), element);
  pushCandidate(candidates, getStructuralSelector(element), element);
  pushCandidate(candidates, getLegacySelector(element), element);

  return candidates;
}

function getBestDirectSelector(element: Element) {
  const dataFeedbackId = element.getAttribute('data-feedback-id');

  if (dataFeedbackId) {
    return `[data-feedback-id="${escapeAttributeValue(dataFeedbackId)}"]`;
  }

  const testId = element.getAttribute('data-testid');

  if (testId) {
    return `[data-testid="${escapeAttributeValue(testId)}"]`;
  }

  const dataSection = element.getAttribute('data-section');

  if (dataSection) {
    return `[data-section="${escapeAttributeValue(dataSection)}"]`;
  }

  if (element.id) {
    return `#${escapeSelector(element.id)}`;
  }

  return '';
}

function getSemanticSelector(element: Element) {
  const tag = element.tagName.toLowerCase();
  const ariaLabel = element.getAttribute('aria-label');
  const alt = element.getAttribute('alt');
  const href = element.getAttribute('href');
  const src = element.getAttribute('src');

  if (ariaLabel) {
    return `${tag}[aria-label="${escapeAttributeValue(ariaLabel)}"]`;
  }

  if (alt) {
    return `${tag}[alt="${escapeAttributeValue(alt)}"]`;
  }

  if (href && (tag === 'a' || tag === 'link')) {
    return `${tag}[href="${escapeAttributeValue(href)}"]`;
  }

  if (src && tag === 'img') {
    return `${tag}[src="${escapeAttributeValue(src)}"]`;
  }

  return '';
}

function getStructuralSelector(element: Element) {
  const doc = element.ownerDocument;
  const parts: string[] = [];
  let current: Element | null = element;
  let depth = 0;

  while (current && current !== doc.body && depth < 8) {
    const directSelector = getBestDirectSelector(current);

    if (directSelector) {
      parts.unshift(directSelector);
      break;
    }

    parts.unshift(getElementStep(current));
    current = current.parentElement;
    depth += 1;
  }

  return parts.join(' > ') || element.tagName.toLowerCase();
}

function getRelativeSelector(ancestor: Element, element: Element) {
  const parts: string[] = [];
  let current: Element | null = element;
  let depth = 0;

  while (current && current !== ancestor && depth < 8) {
    parts.unshift(getElementStep(current));
    current = current.parentElement;
    depth += 1;
  }

  return parts.join(' > ') || getElementStep(element);
}

function getElementStep(element: Element) {
  return `${element.tagName.toLowerCase()}:nth-of-type(${getSiblingIndex(element)})`;
}

function getLegacySelector(element: Element) {
  const doc = element.ownerDocument;
  const parts: string[] = [];
  let current: Element | null = element;
  let depth = 0;

  while (current && current !== doc.body && depth < 5) {
    if (current.id) {
      parts.unshift(`#${escapeSelector(current.id)}`);
      break;
    }

    const tag = current.tagName.toLowerCase();
    const className = Array.from(current.classList)
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => `.${escapeSelector(name)}`)
      .join('');

    parts.unshift(`${tag}${className}:nth-of-type(${getSiblingIndex(current)})`);
    current = current.parentElement;
    depth += 1;
  }

  return parts.join(' > ') || element.tagName.toLowerCase();
}

function pushCandidate(candidates: string[], selector: string, element: Element) {
  if (!selector || candidates.includes(selector)) {
    return;
  }

  if (!elementMatchesSelector(element, selector)) {
    return;
  }

  candidates.push(selector);
}

function elementMatchesSelector(element: Element, selector: string) {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

function resolveType(mode: Exclude<FeedbackMode, 'review'>, hasImage: boolean): FeedbackItemType {
  if (mode === 'text') {
    return 'text-suggestion';
  }

  if (mode === 'section') {
    return 'section-comment';
  }

  return hasImage ? 'image-comment' : 'section-comment';
}

function findSectionElement(element: Element) {
  return element.closest(SECTION_ROOT_SELECTOR);
}

function findBackgroundImageElement(target: Element) {
  let current: Element | null = target;
  let depth = 0;

  while (current && depth < 5) {
    const win: Window | null = current.ownerDocument.defaultView;
    const style = win?.getComputedStyle(current);

    if (style?.backgroundImage && style.backgroundImage !== 'none') {
      return current;
    }

    current = current.parentElement;
    depth += 1;
  }

  return null;
}

function getImageData(element: Element) {
  const image = element.matches('img') ? element : element.querySelector('img');

  const imageWindow = image?.ownerDocument.defaultView;

  if (imageWindow && image instanceof imageWindow.HTMLImageElement) {
    return {
      src: image.currentSrc || image.src,
      alt: image.alt || '',
    };
  }

  const win = element.ownerDocument.defaultView;
  const backgroundImage = win?.getComputedStyle(element).backgroundImage || '';
  const match = /url\(["']?(.*?)["']?\)/.exec(backgroundImage);

  return {
    src: match?.[1] || '',
    alt: element.getAttribute('aria-label') || '',
  };
}

function getElementText(element: Element) {
  return (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 2000);
}

function getElementLabel(element: Element, mode: FeedbackMode) {
  const tag = element.tagName.toLowerCase();
  const text = getElementText(element);
  const labelSource =
    element.getAttribute('aria-label') ||
    element.getAttribute('alt') ||
    element.getAttribute('data-section') ||
    text;

  if (labelSource) {
    return `${modeLabel(mode)}: ${labelSource.slice(0, 72)}`;
  }

  return `${modeLabel(mode)}: <${tag}>`;
}

function modeLabel(mode: FeedbackMode) {
  if (mode === 'text') {
    return 'Texto';
  }

  if (mode === 'image') {
    return 'Imagem';
  }

  return 'Secao';
}

function resolveBySignature(item: FeedbackItem, doc: Document) {
  const target = item.target;
  const storedImage = target?.imageSrc || item.imageSrc || '';
  const textFingerprint = target?.textFingerprint || createTextFingerprint(item.originalText || item.label);
  const tagName = target?.tagName || '';
  const pools: Element[] = [];

  if (storedImage) {
    pools.push(...queryElements(doc, IMAGE_SELECTOR));
  }

  if (textFingerprint) {
    pools.push(...queryElements(doc, tagName || SIGNATURE_SELECTOR));
  }

  return chooseBestElement(uniqueElements(pools), item, 12);
}

function chooseBestElement(elements: Element[], item: FeedbackItem, minScore = 0) {
  let best: { element: Element; score: number } | null = null;

  for (const element of elements) {
    const bounds = getElementBounds(element);

    if (!bounds) {
      continue;
    }

    const score = scoreElement(element, item, bounds);

    if (!best || score > best.score) {
      best = { element, score };
    }
  }

  return best && best.score >= minScore ? best.element : null;
}

function scoreElement(element: Element, item: FeedbackItem, bounds: ElementBounds) {
  const target = item.target;
  const tagName = target?.tagName || '';
  const storedText = target?.textFingerprint || createTextFingerprint(item.originalText || item.label);
  const storedImage = target?.imageSrc || item.imageSrc || '';
  const capturedBounds = target?.capturedBounds || item.bounds;
  let score = 0;

  if (tagName && element.tagName.toLowerCase() === tagName) {
    score += 24;
  }

  if (storedImage) {
    const imageScore = scoreImageMatch(storedImage, getImageData(element).src);
    score += imageScore;
  }

  if (storedText) {
    const currentText = createTextFingerprint(getElementText(element));

    if (currentText === storedText) {
      score += 36;
    } else if (currentText.includes(storedText) || storedText.includes(currentText)) {
      score += 18;
    }
  }

  const widthDelta = Math.abs(bounds.width - capturedBounds.width);
  const heightDelta = Math.abs(bounds.height - capturedBounds.height);
  const yDelta = Math.abs(bounds.y - capturedBounds.y);

  if (widthDelta <= Math.max(24, capturedBounds.width * 0.2)) {
    score += 8;
  }

  if (heightDelta <= Math.max(24, capturedBounds.height * 0.2)) {
    score += 8;
  }

  if (yDelta <= 160) {
    score += 8;
  }

  return score;
}

function scoreImageMatch(stored: string, current: string) {
  const normalizedStored = normalizeAssetUrl(stored);
  const normalizedCurrent = normalizeAssetUrl(current);

  if (!normalizedStored || !normalizedCurrent) {
    return 0;
  }

  if (normalizedStored === normalizedCurrent) {
    return 44;
  }

  if (getAssetFilename(normalizedStored) === getAssetFilename(normalizedCurrent)) {
    return 32;
  }

  return 0;
}

function getClickOffsetRatio(element: Element, point?: CapturePoint) {
  if (!point) {
    return undefined;
  }

  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return undefined;
  }

  return {
    x: clamp((point.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((point.clientY - rect.top) / rect.height, 0, 1),
  };
}

function queryElements(root: ParentNode, selector: string) {
  if (!selector) {
    return [];
  }

  try {
    return Array.from(root.querySelectorAll(selector));
  } catch {
    return [];
  }
}

function createTextFingerprint(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, 180);
}

function normalizeAssetUrl(value: string) {
  try {
    return new URL(value, window.location.href).href;
  } catch {
    return value.trim();
  }
}

function getAssetFilename(value: string) {
  return value.split(/[/?#]/).filter(Boolean).pop() || value;
}

function getSiblingIndex(element: Element) {
  let index = 1;
  let sibling = element.previousElementSibling;

  while (sibling) {
    if (sibling.tagName === element.tagName) {
      index += 1;
    }

    sibling = sibling.previousElementSibling;
  }

  return index;
}

function uniqueStrings(values: Array<string | undefined>) {
  return values.reduce<string[]>((acc, value) => {
    if (value && !acc.includes(value)) {
      acc.push(value);
    }

    return acc;
  }, []);
}

function uniqueElements(values: Element[]) {
  return values.reduce<Element[]>((acc, value) => {
    if (!acc.includes(value)) {
      acc.push(value);
    }

    return acc;
  }, []);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function escapeSelector(value: string) {
  const css = globalThis.CSS;

  if (css && typeof css.escape === 'function') {
    return css.escape(value);
  }

  return value.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
}

function escapeAttributeValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
