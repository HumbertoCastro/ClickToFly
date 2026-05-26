import type { DraftFeedback, FeedbackItemType, FeedbackMode } from './types';

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

const SECTION_SELECTOR = [
  'section',
  'article',
  'main',
  'header',
  'footer',
  'aside',
  '[data-section]',
  '[aria-labelledby]',
  'form',
  'nav',
  'div',
].join(',');

export function draftFromElement(
  target: EventTarget | null,
  mode: Exclude<FeedbackMode, 'review'>,
  route: string,
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

  const image = getImageData(element);
  const originalText = getElementText(element);
  const type = resolveType(mode, Boolean(image.src));

  return {
    type,
    label: getElementLabel(element, mode),
    selector: getSelector(element),
    comment: '',
    bounds: {
      x: Math.round(rect.left + win.scrollX),
      y: Math.round(rect.top + win.scrollY),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
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
    return target.closest(SECTION_SELECTOR);
  }

  const directImage = target.closest('img, picture, figure');

  if (directImage) {
    return directImage;
  }

  return findBackgroundImageElement(target);
}

export function isDomElement(value: EventTarget | null): value is Element {
  if (!value || typeof value !== 'object' || !('ownerDocument' in value)) {
    return false;
  }

  const element = value as Element;
  const win = element.ownerDocument?.defaultView;

  return Boolean(win && value instanceof win.Element);
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

function getSelector(element: Element) {
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
    const siblingIndex = getSiblingIndex(current);

    parts.unshift(`${tag}${className}:nth-of-type(${siblingIndex})`);
    current = current.parentElement;
    depth += 1;
  }

  return parts.join(' > ') || element.tagName.toLowerCase();
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

function escapeSelector(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
}
