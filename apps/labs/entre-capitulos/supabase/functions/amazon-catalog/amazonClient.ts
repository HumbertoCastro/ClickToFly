import type { AmazonCatalogConfig } from "./config.ts";
import type { AmazonCatalogRequest } from "./types.ts";

type Fetcher = typeof fetch;

const RESOURCES = [
  "browseNodeInfo.browseNodes",
  "browseNodeInfo.browseNodes.salesRank",
  "browseNodeInfo.websiteSalesRank",
  "images.primary.large",
  "itemInfo.byLineInfo",
  "itemInfo.classifications",
  "itemInfo.contentInfo",
  "itemInfo.externalIds",
  "itemInfo.manufactureInfo",
  "itemInfo.productInfo",
  "itemInfo.title",
  "offersV2.listings.availability",
  "offersV2.listings.condition",
  "offersV2.listings.dealDetails",
  "offersV2.listings.isBuyBoxWinner",
  "offersV2.listings.merchantInfo",
  "offersV2.listings.price",
  "offersV2.listings.type",
  "parentASIN",
];

interface AccessToken {
  value: string;
  expiresAt: number;
}

export class CreatorsApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "CreatorsApiError";
  }
}

function retryAfter(response: Response): number | undefined {
  const value = Number(response.headers.get("retry-after"));
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : undefined;
}

async function safeJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const body = await response.json();
    return body && typeof body === "object"
      ? body as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function upstreamCode(
  body: Record<string, unknown>,
  fallback: string,
): string {
  for (const candidate of [
    body.code,
    body.error,
    body.__type,
    body.type,
  ]) {
    if (typeof candidate === "string" && candidate) return candidate;
  }
  return fallback;
}

export function buildCreatorsPayload(
  request: AmazonCatalogRequest,
  partnerTag: string,
): { path: string; body: Record<string, unknown> } {
  const common = {
    marketplace: "www.amazon.com.br",
    partnerTag,
    languagesOfPreference: ["pt_BR"],
    currencyOfPreference: "BRL",
    resources: RESOURCES,
    condition: "New",
  };

  if (request.operation === "search") {
    return {
      path: "/catalog/v1/searchItems",
      body: {
        ...common,
        keywords: request.query,
        searchIndex: request.searchIndex,
        itemCount: 10,
        itemPage: request.page,
        sortBy: "Featured",
        availability: "Available",
        ...(request.category ? { browseNodeId: request.category } : {}),
      },
    };
  }

  if (request.operation === "items") {
    return {
      path: "/catalog/v1/getItems",
      body: {
        ...common,
        itemIds: request.asins,
        itemIdType: "ASIN",
      },
    };
  }

  return {
    path: "/catalog/v1/getVariations",
    body: {
      ...common,
      asin: request.asin,
      variationCount: 10,
      variationPage: request.page,
    },
  };
}

export class CreatorsApiClient {
  private token: AccessToken | null = null;

  constructor(
    private readonly config: AmazonCatalogConfig,
    private readonly fetcher: Fetcher = fetch,
    private readonly now: () => number = Date.now,
  ) {}

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > this.now() + 60_000) {
      return this.token.value;
    }

    const clientId = this.config.creatorsClientId!;
    const clientSecret = this.config.creatorsClientSecret!;
    const headers = new Headers({ "content-type": "application/json" });
    const body = JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "creatorsapi::default",
    });

    let response: Response;
    try {
      response = await this.fetcher(this.config.creatorsTokenUrl, {
        method: "POST",
        headers,
        body,
      });
    } catch {
      throw new CreatorsApiError(
        502,
        "oauth_unavailable",
        "Não foi possível autenticar na Amazon.",
      );
    }

    const payload = await safeJson(response);
    if (!response.ok) {
      throw new CreatorsApiError(
        response.status,
        upstreamCode(payload, "oauth_failed"),
        "A Amazon recusou a autenticação da integração.",
        retryAfter(response),
      );
    }

    const token = typeof payload.access_token === "string"
      ? payload.access_token
      : "";
    const expiresIn = Number(payload.expires_in);
    if (!token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new CreatorsApiError(
        502,
        "oauth_invalid_response",
        "A Amazon retornou uma autenticação inválida.",
      );
    }

    this.token = {
      value: token,
      expiresAt: this.now() + expiresIn * 1000,
    };
    return token;
  }

  async request(request: AmazonCatalogRequest): Promise<unknown> {
    const token = await this.accessToken();
    const { path, body } = buildCreatorsPayload(
      request,
      this.config.partnerTag!,
    );
    let response: Response;
    try {
      response = await this.fetcher(
        `${this.config.creatorsApiBaseUrl.replace(/\/$/, "")}${path}`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
            "x-marketplace": "www.amazon.com.br",
          },
          body: JSON.stringify(body),
        },
      );
    } catch {
      throw new CreatorsApiError(
        502,
        "amazon_unavailable",
        "O catálogo da Amazon está temporariamente indisponível.",
      );
    }

    const payload = await safeJson(response);
    if (!response.ok) {
      if (response.status === 401) this.token = null;
      throw new CreatorsApiError(
        response.status,
        upstreamCode(payload, "amazon_request_failed"),
        response.status === 429
          ? "A Amazon limitou temporariamente as consultas."
          : "A Amazon não pôde concluir a consulta.",
        retryAfter(response),
      );
    }
    return payload;
  }
}
