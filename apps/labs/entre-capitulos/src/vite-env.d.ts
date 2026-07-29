/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_HOUSEHOLD_EMAIL?: string;
  readonly VITE_GOOGLE_BOOKS_API_KEY?: string;
  readonly VITE_AMAZON_CATALOG_MODE?: "disabled" | "sitestripe" | "creators";
  readonly VITE_AMAZON_CATALOG_ENDPOINT?: string;
  readonly VITE_SUPPORT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
