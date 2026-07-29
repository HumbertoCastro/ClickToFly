# Amazon Catalog Edge Function

Catálogo exclusivo da Amazon.com.br para o Entre Capítulos. A função expõe
busca, consulta por ASIN e variações, sempre no servidor. Ela não implementa
histórico de preço, alertas de queda, checkout nem integração com outra loja.

## Modos

- `disabled`: responde com uma lista vazia e nunca inventa catálogo ou preço.
- `sitestripe`: lê coleções editoriais e links afiliados completos cadastrados
  nas tabelas `amazon_editorial_*`. Não exibe preço.
- `creators`: usa a Amazon Creators API, OAuth 2.0 client credentials 3.1,
  marketplace `www.amazon.com.br`, idioma `pt_BR` e moeda `BRL`.

Sem `AMAZON_CATALOG_MODE`, a função escolhe `creators` quando cliente, secret e
tag existem; escolhe `sitestripe` quando apenas a tag existe; sem tag permanece
`disabled`.

## Configuração

Aplique `supabase/migrations/202607280002_amazon_catalog.sql` e configure:

```powershell
supabase secrets set `
  AMAZON_CATALOG_MODE=creators `
  AMAZON_PARTNER_TAG=... `
  AMAZON_CREATORS_CLIENT_ID=... `
  AMAZON_CREATORS_CLIENT_SECRET=... `
  AMAZON_ALLOWED_ORIGINS=https://seu-dominio.example

supabase functions deploy amazon-catalog
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidas
pelo runtime do Supabase. Credenciais Amazon são secrets server-side e nunca
devem receber prefixo `VITE_`.

Opções:

| Variável | Padrão | Observação |
| --- | --- | --- |
| `AMAZON_CATALOG_MODE` | inferido | `disabled`, `sitestripe` ou `creators` |
| `AMAZON_PARTNER_TAG` | vazio | obrigatório em `sitestripe` e `creators`; precisa coincidir exatamente com a URL |
| `AMAZON_ALLOWED_ORIGINS` | localhost e preview HCSolutions | CSV de origens exatas |
| `AMAZON_ALLOW_NO_ORIGIN` | `false` | habilite apenas para cliente server-side controlado |
| `AMAZON_PUBLIC_REQUESTS_PER_MINUTE` | `60` | por usuário autenticado ou IP |
| `AMAZON_CREATORS_DAILY_LIMIT` | `8640` | limitado em código ao teto de 8.640 |

## Contrato HTTP

`POST /functions/v1/amazon-catalog`

```json
{ "operation": "search", "query": "Torto Arado", "searchIndex": "Books", "page": 1 }
```

```json
{ "operation": "items", "asins": ["B0ABC12345"] }
```

```json
{ "operation": "variations", "asin": "B0ABC12345", "page": 1 }
```

`items` aceita no máximo dez ASINs. `searchIndex` aceita somente `Books` e
`KindleStore`; `category`, quando enviado, é o Browse Node ID da Amazon.

Sucesso:

```json
{
  "operation": "items",
  "mode": "creators",
  "items": [],
  "fetchedAt": "2026-07-28T12:00:00.000Z",
  "expiresAt": "2026-07-28T13:00:00.000Z",
  "source": "amazon.com.br"
}
```

Cada item contém ASIN, parent ASIN, título, autores, editora, publicação,
idiomas, páginas, ISBN-10/13, formato, categorias, URL remota de imagem,
`detailPageUrl`, oferta atual, Sales Rank, atributos de variação e timestamps.
A oferta inclui valor BRL, economia, vendedor, disponibilidade, condição,
informação de promoção Prime e expiração própria.

Erros seguem:

```json
{
  "error": {
    "code": "amazon_rate_limited",
    "message": "O limite seguro de consultas à Amazon foi atingido.",
    "retryAfterSeconds": 1
  }
}
```

## SiteStripe

Cadastre somente URLs completas e diretas da Amazon.com.br com a tag configurada
em `AMAZON_PARTNER_TAG`. A função descarta outra tag e devolve a URL aceita
exatamente como persistida; ela não adiciona, encurta ou reescreve:

```sql
insert into public.amazon_editorial_collections (
  slug, title, search_index, category
) values (
  'ficcao-em-destaque', 'Ficção em destaque', 'Books', 'Ficção'
);

insert into public.amazon_editorial_items (
  collection_id, asin, affiliate_url, title, authors, format
)
select
  id,
  'B0ABC12345',
  'https://www.amazon.com.br/dp/B0ABC12345?tag=SEU-TAG',
  'Título editorial',
  array['Nome da autora'],
  'paperback'
from public.amazon_editorial_collections
where slug = 'ficcao-em-destaque';
```

Não há campos de preço ou imagem Amazon nas tabelas SiteStripe. A curadoria
manual usa os mockups locais; URLs remotas de imagem existem somente no cache
efêmero da Creators API.

## Cache, cotas e segurança

- oferta e Sales Rank vencem em no máximo 1 hora;
- metadados, URL afiliada e URL remota da imagem recebidos da Creators API
  vencem em no máximo 24 horas;
- blocos expirados são apagados e nunca retornados;
- cada `cache_key` é sobrescrita, portanto não há série histórica de preço;
- imagens permanecem na URL da Amazon e nunca são baixadas;
- `GetItems` agrupa até dez ASINs;
- a cota compartilhada é atômica: 1 chamada por segundo e até 8.640 por dia;
- o token OAuth é mantido em memória até `expires_in`, com margem de 60 segundos;
- RLS impede acesso direto anônimo ao cache, coleções e contadores; somente a
  Edge Function com `service_role` acessa essas tabelas;
- origens passam por allowlist e cada cliente tem limite por minuto.
- corpos são lidos por streaming e interrompidos acima de 16 KB;
- preço é omitido quando a Amazon sinaliza `violatesMAP`.

A função chama `purge_expired_amazon_catalog_cache()` durante o tráfego em
qualquer modo. A migration também instala um job `pg_cron` a cada 15 minutos,
garantindo limpeza mesmo sem visitas.

## Testes

Os testes sem Deno rodam no toolchain atual do projeto:

```powershell
npx vitest run --config supabase/functions/amazon-catalog/vitest.config.ts
```

Eles cobrem OAuth e reutilização de token, `401`, `403`, `429`, ASIN/batch,
normalização parcial, MAP, ofertas/Prime/vendedor/formato, tag SiteStripe,
limite de corpo, cache e expiração. Quando
Deno estiver disponível:

```powershell
deno task --config supabase/functions/amazon-catalog/deno.json test
deno task --config supabase/functions/amazon-catalog/deno.json check
```
