/* global Deno */

import type { AmazonCatalogMode } from "./types.ts";

export interface AmazonCatalogConfig {
  mode: AmazonCatalogMode;
  allowedOrigins: Set<string>;
  allowNoOrigin: boolean;
  publicRequestsPerMinute: number;
  dailyApiLimit: number;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseAnonKey: string | null;
  creatorsClientId: string | null;
  creatorsClientSecret: string | null;
  partnerTag: string | null;
  creatorsTokenUrl: string;
  creatorsApiBaseUrl: string;
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
  if (raw === null) return fallback;
  return raw.toLowerCase() === "true";
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
): AmazonCatalogConfig {
  const clientId = value(get, "AMAZON_CREATORS_CLIENT_ID");
  const clientSecret = value(get, "AMAZON_CREATORS_CLIENT_SECRET");
  const partnerTag =
    value(get, "AMAZON_PARTNER_TAG") ??
    value(get, "AMAZON_CREATORS_PARTNER_TAG");
  const configuredMode = value(get, "AMAZON_CATALOG_MODE");
  const inferredMode: AmazonCatalogMode =
    clientId && clientSecret && partnerTag
      ? "creators"
      : partnerTag
        ? "sitestripe"
        : "disabled";
  const mode = (configuredMode ?? inferredMode) as AmazonCatalogMode;

  if (!["disabled", "sitestripe", "creators"].includes(mode)) {
    throw new Error(
      "AMAZON_CATALOG_MODE deve ser disabled, sitestripe ou creators.",
    );
  }
  if (mode === "creators" && (!clientId || !clientSecret || !partnerTag)) {
    throw new Error(
      "Modo creators requer AMAZON_CREATORS_CLIENT_ID, " +
        "AMAZON_CREATORS_CLIENT_SECRET e AMAZON_PARTNER_TAG.",
    );
  }
  if (mode === "sitestripe" && !partnerTag) {
    throw new Error(
      "Modo sitestripe requer AMAZON_PARTNER_TAG para validar os links.",
    );
  }

  const origins = (value(get, "AMAZON_ALLOWED_ORIGINS") ?? DEFAULT_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return {
    mode,
    allowedOrigins: new Set(origins),
    allowNoOrigin: booleanValue(get, "AMAZON_ALLOW_NO_ORIGIN", false),
    publicRequestsPerMinute: integerValue(
      get,
      "AMAZON_PUBLIC_REQUESTS_PER_MINUTE",
      60,
      1,
      1000,
    ),
    dailyApiLimit: integerValue(
      get,
      "AMAZON_CREATORS_DAILY_LIMIT",
      8640,
      1,
      8640,
    ),
    supabaseUrl: value(get, "SUPABASE_URL") ?? "",
    supabaseServiceRoleKey: value(get, "SUPABASE_SERVICE_ROLE_KEY") ?? "",
    supabaseAnonKey: value(get, "SUPABASE_ANON_KEY"),
    creatorsClientId: clientId,
    creatorsClientSecret: clientSecret,
    partnerTag,
    creatorsTokenUrl:
      value(get, "AMAZON_CREATORS_TOKEN_URL") ??
      "https://api.amazon.com/auth/o2/token",
    creatorsApiBaseUrl:
      value(get, "AMAZON_CREATORS_API_BASE_URL") ??
      "https://creatorsapi.amazon",
  };
}
