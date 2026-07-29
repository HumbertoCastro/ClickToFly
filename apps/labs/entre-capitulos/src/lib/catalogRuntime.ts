import { createDemoBookCatalogClient } from "../data/catalogDemo";
import {
  createBookCatalogClient,
  getBookCatalogConfig,
  type BookCatalogClient,
} from "./bookCatalog";
import { bookCatalogAuthHeaders } from "./repository";

function isDemoCatalogRequested() {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "1"
  );
}

export function createRuntimeBookCatalogClient(): BookCatalogClient {
  if (isDemoCatalogRequested()) return createDemoBookCatalogClient();

  try {
    return createBookCatalogClient({
      ...getBookCatalogConfig(),
      resolveHeaders: bookCatalogAuthHeaders,
    });
  } catch (cause) {
    if (import.meta.env.DEV) return createDemoBookCatalogClient();
    throw cause;
  }
}

export const runtimeBookCatalogClient = createRuntimeBookCatalogClient();
