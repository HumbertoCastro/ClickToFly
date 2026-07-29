# Book Catalog Edge Function

Catálogo público neutro do Entre Capítulos. A função usa a Open Library como
fonte bibliográfica canônica, separa obras de edições e gera destinos externos
para Amazon Brasil, Estante Virtual e Mercado Livre. Ela não consulta
varejistas, não faz scraping e não retorna preço, estoque, desconto ou promessa
de disponibilidade.

Referências oficiais:

- [Open Library Search API](https://openlibrary.org/dev/docs/api/search)
- [Open Library REST API](https://openlibrary.org/dev/docs/restful_api)
- [Open Library API usage](https://openlibrary.org/developers/api)
- [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers)

## Banco e rollout

Aplique as migrations existentes em ordem, incluindo:

```text
supabase/migrations/202607290002_open_library_catalog.sql
```

Ela:

- adiciona `open_library`, `catalog_work_key` e `catalog_edition_key` a
  `books`, preservando `google_books`, `manual`, `amazon` e
  `amazon_book_editions`;
- cria obras, fontes/aliases, edições, regras de identidade, coleções,
  itens editoriais, links diretos, cache e limites;
- cria o bucket público `catalog-covers`, limitado a 5 MB e imagens
  JPEG/PNG/WebP/AVIF;
- bloqueia acesso anônimo às tabelas e permite que a conta doméstica
  autenticada administre a curadoria;
- reserva cache, contador e RPCs para `service_role`;
- invalida todo o cache imediatamente após alterações autenticadas de
  curadoria, sem expulsar entradas durante a ingestão automática da função;
- instala limpeza periódica das linhas vencidas via `pg_cron`;
- migra a coleção `em-destaque`, quatro obras e cinco edições.

As duas edições conhecidas de **Torto Arado** ficam separadas sob
`OL24141556W`. O ISBN-13 de **Ensaio sobre a cegueira** é
`9788535930535`. Os quatro links SiteStripe da migration anterior foram
copiados byte a byte e continuam marcados como afiliados.

As tabelas Amazon permanecem intactas durante a janela de rollback.

## Configuração

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são
fornecidas pelo runtime do Supabase. Configure os demais valores como secrets:

```powershell
supabase secrets set `
  OPEN_LIBRARY_CONTACT_EMAIL=feedback@hcwebsolutions.com.br `
  OPEN_LIBRARY_APPLICATION_NAME=EntreCapitulos/1.0 `
  BOOK_CATALOG_ALLOWED_ORIGINS=https://seu-dominio.example

supabase functions deploy book-catalog --no-verify-jwt
```

| Variável | Padrão | Comportamento |
| --- | --- | --- |
| `OPEN_LIBRARY_CONTACT_EMAIL` | obrigatório | Identifica o aplicativo para a Open Library. |
| `OPEN_LIBRARY_APPLICATION_NAME` | `EntreCapitulos/1.0` | Nome incluído no `User-Agent`. |
| `BOOK_CATALOG_ALLOWED_ORIGINS` | localhost e preview HCSolutions | CSV de origens exatas. |
| `BOOK_CATALOG_ALLOW_NO_ORIGIN` | `false` | Aceita cliente sem `Origin` somente quando habilitado conscientemente. |
| `BOOK_CATALOG_REQUESTS_PER_MINUTE` | `60` | Limite por usuário autenticado ou IP. |
| `OPEN_LIBRARY_TIMEOUT_MS` | `8000` | Timeout entre 1 e 30 segundos. |
| `OPEN_LIBRARY_BASE_URL` | `https://openlibrary.org` | Override destinado apenas a teste controlado. |

A função envia `User-Agent` e contato em todas as chamadas. Uma fila global do
processo espaça o início das chamadas para respeitar três requisições por
segundo. A Search API usa 18 obras por página. O detalhe usa `/works/:id`, a
consulta canônica `key:/works/:id` e 12 edições por página, mantendo no máximo
três chamadas por detalhe.

## Contrato HTTP

`POST /functions/v1/book-catalog`

Busca:

```json
{
  "operation": "search",
  "query": "Torto Arado",
  "page": 1,
  "language": "pt",
  "subject": "Literatura brasileira",
  "sort": "relevance"
}
```

Coleção publicada:

```json
{ "operation": "collection", "slug": "em-destaque" }
```

Obra e edições:

```json
{
  "operation": "work",
  "workKey": "OL24141556W",
  "editionPage": 1
}
```

Resolução legada ou bibliográfica:

```json
{ "operation": "resolve", "legacyAsin": "6556927198" }
```

```json
{
  "operation": "resolve",
  "title": "Ensaio sobre a cegueira",
  "author": "José Saramago"
}
```

ISBNs precisam ter checksum válido. Chaves com `/works/` e `/books/` são
canonicalizadas para `OL...W` e `OL...M`.

Resposta:

```json
{
  "operation": "work",
  "works": [],
  "work": {
    "workKey": "OL24141556W",
    "title": "Torto Arado",
    "authors": ["Itamar Vieira Junior"],
    "firstPublishedYear": 2019,
    "description": "",
    "subjects": [],
    "languages": ["pt"],
    "coverUrl": "https://covers.openlibrary.org/b/id/12369648-L.jpg",
    "editionCount": 5
  },
  "editions": [],
  "destinations": [],
  "pagination": {
    "page": 1,
    "pageSize": 12,
    "total": 5,
    "hasMore": false
  },
  "fetchedAt": "2026-07-29T12:00:00.000Z",
  "expiresAt": "2026-08-05T12:00:00.000Z",
  "stale": false,
  "source": "open_library"
}
```

`resolve` sem correspondência retorna HTTP 200, `work: null` e listas vazias,
permitindo ao frontend oferecer busca assistida. Erros usam:

```json
{
  "error": {
    "code": "open_library_unavailable",
    "message": "Não foi possível acessar a Open Library."
  }
}
```

## Persistência e identidade

Antes de responder uma busca ou resolução, a função persiste a obra, aliases
Open Library e a edição representativa. Isso garante que
`books.catalog_work_key` possa ser gravado imediatamente sem violar FK. Um
detalhe posterior enriquece somente campos vazios e aumenta `edition_count`;
texto/capa/ordem definidos pela curadoria nunca são sobrescritos.

O agrupador aplica, nesta ordem:

1. regra manual de unir/separar;
2. mesma Work key;
3. ISBN válido compartilhado;
4. bloqueio de volumes conflitantes e variantes como adaptação, resumo, guia,
   box e livro de atividades;
5. bloqueio de idiomas conflitantes para traduções sem Work key comum;
6. mesmo autor com título normalizado idêntico ou similaridade mínima `0,86`.

O agrupamento nunca apaga edições. Aliases e regras manuais de união também são
resolvidos no detalhe e na resolução por ISBN, agregando as edições sob uma
chave canônica. Regras vinculadas a uma edição não se tornam regras globais da
obra. Registrar uma nova decisão desativa atomicamente a decisão ativa
conflitante para o mesmo par. Alterar uma regra apaga o cache por trigger.

## Destinos externos

Para cada edição, a ordem é:

1. Amazon Brasil;
2. Estante Virtual;
3. Mercado Livre.

O termo usa ISBN-13, depois ISBN-10 e por fim `título + autor`. Links gerados
recebem `kind: "search"`, `affiliate: false` e `label: "Buscar na loja"`.
Overrides cadastrados recebem `kind: "direct"` e mantêm URL/afiliado/rótulo.

Allowlist:

- `amazon.com.br` e `www.amazon.com.br`;
- `estantevirtual.com.br` e `www.estantevirtual.com.br`;
- `mercadolivre.com.br`, `www.mercadolivre.com.br` e
  `lista.mercadolivre.com.br`.

URLs com outro protocolo, credenciais embutidas ou hostname semelhante são
descartadas. O frontend deve usar `rel="sponsored noopener noreferrer"` quando
`affiliate` for `true`.

## Cache, stale e segurança

- busca e coleção: 24 horas;
- obra e resolução: 7 dias;
- falha temporária: devolve a cópia vencida com `stale: true` enquanto estiver
  na janela de stale;
- retenção stale: 7 dias após busca/coleção e 30 dias após obra/resolução;
- limite público: 60 consultas por minuto por usuário/IP;
- chamadas idênticas simultâneas compartilham uma única execução por processo;
- corpo JSON: no máximo 16 KB, lido por streaming;
- CORS: allowlist exata e `Vary: Origin`;
- descrição, strings, capas, ISBNs e URLs são normalizados antes da resposta;
- `service_role` e segredos nunca entram no payload ou no bundle do frontend.

## Testes

Sem editar `package.json`, rode:

```powershell
npx tsc -p supabase/functions/book-catalog/tsconfig.edge.json
npx vitest run --config supabase/functions/book-catalog/vitest.config.ts
npx eslint supabase/functions/book-catalog --max-warnings=0
git diff --check -- supabase/migrations/202607290002_open_library_catalog.sql supabase/functions/book-catalog
```

Quando Deno estiver instalado:

```powershell
deno task --config supabase/functions/book-catalog/deno.json check
```

Para validar RLS, Storage, RPCs e a migration de forma integrada, use um projeto
Supabase de teste ou o stack local do Supabase. O teste Vitest é puro e não
substitui essa prova de banco.
