/* global Deno */

import { readConfig } from "./config.ts";
import {
  handleCatalogRequest,
  type RuntimeDependencies,
} from "./handler.ts";
import { OpenLibraryClient } from "./openLibraryClient.ts";
import { SupabaseStore } from "./supabaseStore.ts";

let runtime: RuntimeDependencies | null = null;

function dependencies(): RuntimeDependencies {
  if (runtime) return runtime;
  const config = readConfig();
  runtime = {
    config,
    store: new SupabaseStore(config),
    openLibrary: new OpenLibraryClient(config),
  };
  return runtime;
}

Deno.serve(async (request) => {
  try {
    return await handleCatalogRequest(request, dependencies());
  } catch {
    return new Response(JSON.stringify({
      error: {
        code: "configuration_error",
        message: "O catálogo de livros não está configurado.",
      },
    }), {
      status: 503,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }
});
