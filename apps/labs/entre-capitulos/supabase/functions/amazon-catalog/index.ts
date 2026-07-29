/* global Deno */

import { CreatorsApiClient } from "./amazonClient.ts";
import { readConfig } from "./config.ts";
import {
  handleCatalogRequest,
  type RuntimeDependencies,
} from "./handler.ts";
import { SupabaseStore } from "./supabaseStore.ts";

let runtime: RuntimeDependencies | null = null;

function dependencies(): RuntimeDependencies {
  if (runtime) return runtime;
  const config = readConfig();
  runtime = {
    config,
    store: new SupabaseStore(config),
    amazon: config.mode === "creators"
      ? new CreatorsApiClient(config)
      : null,
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
        message: "A integração Amazon não está configurada.",
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
