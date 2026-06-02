const absoluteUrlPattern = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

export const appBasePath = ensureTrailingSlash(import.meta.env.BASE_URL || "/");

export function toAppHref(path: string) {
  if (!path || path.startsWith("#") || absoluteUrlPattern.test(path)) {
    return path;
  }

  const relativePath = path === "/" ? "" : path.replace(/^\/+/, "");
  return `${appBasePath}${relativePath}`;
}

export function toAssetUrl(path: string) {
  if (!path || absoluteUrlPattern.test(path)) {
    return path;
  }

  return toAppHref(path.replace(/^\/+/, ""));
}

export function getRoutePath(pathname: string) {
  const basePath = `/${trimSlashes(appBasePath)}`;
  let routePath = pathname.replace(/\/+$/g, "") || "/";

  if (basePath !== "/" && (routePath === basePath || routePath.startsWith(`${basePath}/`))) {
    routePath = routePath.slice(basePath.length) || "/";
  }

  if (routePath === "/pagamente-e-reembolso") {
    return "/pagamento-e-reembolso";
  }

  return routePath.replace(/\/+$/g, "") || "/";
}

export function getRoutePathFromHref(href: string) {
  if (!href || href.startsWith("#") || absoluteUrlPattern.test(href)) {
    return null;
  }

  const routePath = href.split("#")[0] || "/";
  return routePath.replace(/\/+$/g, "") || "/";
}
