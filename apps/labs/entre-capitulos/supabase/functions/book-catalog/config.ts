/* global Deno */

export interface BookCatalogConfig {
  allowedOrigins: Set<string>;
  allowNoOrigin: boolean;
  publicRequestsPerMinute: number;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseAnonKey: string | null;
  openLibraryBaseUrl: string;
  openLibraryContactEmail: string;
  openLibraryUserAgent: string;
  openLibraryTimeoutMs: number;
}

type EnvGetter = (name: string) => string | undefined;

const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://preview.hcwebsolutions.com.br",
];

function value(get: EnvGetter, name: string): string | null {
  return get(name)?.trim() || null;
}

function booleanValue(get: EnvGetter, name: string, fallback: boolean): boolean {
  const raw = value(get, name);
  return raw === null ? fallback : raw.toLowerCase() === "true";
}

function integerValue(
  get: EnvGetter,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = value(get, name);
  const parsed = raw === null ? fallback : Number(raw);
  return Number.isInteger(parsed)
    ? Math.min(maximum, Math.max(minimum, parsed))
    : fallback;
}

export function readConfig(
  get: EnvGetter = (name) => Deno.env.get(name),
): BookCatalogConfig {
  const contact = value(get, "OPEN_LIBRARY_CONTACT_EMAIL") ?? "";
  if (!contact || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact)) {
    throw new Error(
      "OPEN_LIBRARY_CONTACT_EMAIL deve conter um e-mail de contato válido.",
    );
  }

  const origins = (
    value(get, "BOOK_CATALOG_ALLOWED_ORIGINS") ??
      DEFAULT_ORIGINS.join(",")
  )
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const applicationName =
    value(get, "OPEN_LIBRARY_APPLICATION_NAME") ?? "EntreCapitulos/1.0";

  return {
    allowedOrigins: new Set(origins),
    allowNoOrigin: booleanValue(get, "BOOK_CATALOG_ALLOW_NO_ORIGIN", false),
    publicRequestsPerMinute: integerValue(
      get,
      "BOOK_CATALOG_REQUESTS_PER_MINUTE",
      60,
      1,
      1000,
    ),
    supabaseUrl: value(get, "SUPABASE_URL") ?? "",
    supabaseServiceRoleKey:
      value(get, "SUPABASE_SERVICE_ROLE_KEY") ?? "",
    supabaseAnonKey: value(get, "SUPABASE_ANON_KEY"),
    openLibraryBaseUrl:
      value(get, "OPEN_LIBRARY_BASE_URL") ?? "https://openlibrary.org",
    openLibraryContactEmail: contact,
    openLibraryUserAgent: `${applicationName} (${contact})`,
    openLibraryTimeoutMs: integerValue(
      get,
      "OPEN_LIBRARY_TIMEOUT_MS",
      8_000,
      1_000,
      30_000,
    ),
  };
}
