const basePath = import.meta.env.BASE_URL || '/';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '') || '/';

export function getAppPathname(pathname = window.location.pathname) {
  const normalizedBase = trimTrailingSlash(new URL(basePath, window.location.origin).pathname);
  const normalizedPath = trimTrailingSlash(pathname);

  if (
    normalizedBase !== '/' &&
    (normalizedPath === normalizedBase || normalizedPath.startsWith(`${normalizedBase}/`))
  ) {
    return trimTrailingSlash(normalizedPath.slice(normalizedBase.length) || '/');
  }

  return normalizedPath;
}

export function withBasePath(href: string) {
  if (
    href.startsWith('#') ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  ) {
    return href;
  }

  const normalizedBase = trimTrailingSlash(basePath);
  const normalizedHref = href.startsWith('/') ? href : `/${href}`;

  if (normalizedBase === '/') {
    return normalizedHref;
  }

  return `${normalizedBase}${normalizedHref === '/' ? '/' : normalizedHref}`;
}
