# Entre Capítulos

Biblioteca doméstica compartilhada e livraria editorial por obras, edições e
destinos externos. O produto organiza leituras pessoais sem vender livros e
sem consultar preço, estoque ou disponibilidade.

## Stack

- React 19, Vite e TypeScript
- Supabase Auth, Postgres, Storage, Edge Functions e Row Level Security
- Open Library como única fonte pública para novos metadados
- Cadastro manual e curadoria autenticada
- Hash Router, compatível com `/projetos/entre-capitulos/`

Google Books, Amazon Creators e as tabelas Amazon permanecem somente para
leitura de registros antigos e rollback temporário. A busca nova não chama
Google Books nem varejistas.

## Configuração

1. Crie ou conecte um projeto Supabase.
2. Execute, em ordem, as migrations de `supabase/migrations`.
3. Em Authentication, crie e confirme a conta compartilhada da casa.
4. Copie `.env.example` para `.env.local` e configure:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
VITE_HOUSEHOLD_EMAIL=email-da-conta-da-casa
VITE_STOREFRONT_PROVIDER=open_library
VITE_BOOK_CATALOG_ENDPOINT=https://seu-projeto.supabase.co/functions/v1/book-catalog
VITE_SUPPORT_EMAIL=contato@seu-dominio.example
```

O frontend nunca recebe `service_role`. O endereço da função também pode ser
derivado automaticamente de `VITE_SUPABASE_URL`.

Para o rollback da vitrine anterior, use temporariamente:

```env
VITE_STOREFRONT_PROVIDER=amazon
VITE_AMAZON_CATALOG_MODE=sitestripe
VITE_AMAZON_CATALOG_ENDPOINT=https://seu-projeto.supabase.co/functions/v1/amazon-catalog
```

`VITE_GOOGLE_BOOKS_API_KEY` não é lida nem serializada pelo frontend atual.
Registros antigos do Google Books continuam legíveis sem nova sincronização.

## Catálogo por obras

As rotas públicas são:

- `/livraria`: coleções publicadas quando não há busca e pesquisa ampla por
  título, autor ou ISBN quando há consulta;
- `/livraria/obra/:workKey`: sinopse, metadados e 12 edições por página;
- `/livraria/:legacyAsin`: resolve os endereços antigos e redireciona para a
  obra; sem correspondência, abre uma busca assistida.

Cada card representa uma obra. ISBN, editora, idioma, formato, data, páginas e
destinos pertencem à edição. Títulos traduzidos só são unidos automaticamente
quando compartilham a Work key do Open Library.

Os destinos são Amazon Brasil, Estante Virtual e Mercado Livre, nesta ordem.
Buscas usam ISBN-13, ISBN-10 ou `título + autor`. Links diretos cadastrados são
validados por domínio; links afiliados recebem disclosure e
`rel="sponsored noopener noreferrer"`. Não existe scraping de varejistas.

Na área privada:

- `/onde-comprar` agrupa a lista `want_to_read` por obra;
- o detalhe pessoal mostra o mesmo painel neutro “Onde encontrar”;
- `/ofertas` redireciona para `/onde-comprar`;
- livros Google/Amazon antigos são resolvidos por ISBN, ASIN, título e autor,
  preservando a origem do registro e adicionando as chaves do catálogo.

## Curadoria

`/curadoria` exige autenticação, mas independe do perfil ativo. O painel permite:

- buscar e importar uma obra do Open Library;
- criar obras e edições manuais;
- selecionar edição/capa principal e enviar capa ao bucket `catalog-covers`;
- criar, publicar, ocultar e ordenar coleções e itens;
- editar texto editorial, selo e destaque;
- revisar confiança/método de agrupamento e persistir regras de unir/separar;
- cadastrar links diretos validados e marcar afiliados.

As tabelas editoriais não aceitam acesso anônimo. A conta autenticada gerencia a
curadoria via RLS; cache e rate limit ficam restritos ao `service_role` dentro
da Edge Function.

## Edge Function `book-catalog`

Configure os secrets:

```powershell
supabase secrets set OPEN_LIBRARY_CONTACT_EMAIL=contato@seu-dominio.example
supabase secrets set OPEN_LIBRARY_APPLICATION_NAME=EntreCapitulos/1.0
supabase secrets set BOOK_CATALOG_ALLOWED_ORIGINS=https://preview.hcwebsolutions.com.br
supabase secrets set BOOK_CATALOG_REQUESTS_PER_MINUTE=60
```

Depois aplique o banco e publique:

```powershell
supabase db push
supabase functions deploy book-catalog --no-verify-jwt
```

A função identifica o projeto e o contato no `User-Agent`, limita cada
sessão/IP a 60 consultas por minuto e aplica:

- busca/coleção: cache de 24 horas;
- detalhe/resolução: cache de 7 dias;
- resposta antiga com `stale: true` quando o Open Library falha
  temporariamente.

Apenas a função acessa Open Library e as tabelas de cache. Resultados
normalizados são importados de modo conservador para que livros pessoais possam
referenciar as chaves canônicas sem sobrescrever ajustes manuais.

## Desenvolvimento

```powershell
npm ci
npm run dev
```

Sem configuração Supabase, o desenvolvimento local usa dados do navegador.
`?demo=1` carrega perfis, leituras e um catálogo determinístico:

```text
http://localhost:5173/?demo=1#/livraria
```

Builds de produção sem Supabase são bloqueados para evitar persistência local
acidental.

## Qualidade

```powershell
npm run lint
npm run typecheck
npm test
npm run test:edge
npm run test:e2e
npm run build
git diff --check
```

Os testes cobrem ISBN/checksum, identidade, variações bloqueadas, edições
distintas, builders/allowlists, contratos da Edge, cache, stale fallback,
CORS/rate limit e os fluxos responsivos principais.

## Preview HCSolutions

Na raiz `Z:\HCSolutions`:

```powershell
$env:SKIP_PREVIEW_INSTALL='1'
npm run build:previews -- entre-capitulos
npm run deploy:previews -- entre-capitulos
```

URL:

```text
https://preview.hcwebsolutions.com.br/projetos/entre-capitulos/
```
