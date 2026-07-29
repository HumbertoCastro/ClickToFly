# Entre Capítulos

Biblioteca doméstica para perfis compartilharem livros, progresso, resenhas,
resumos e avaliações por critérios.

## Stack

- React 19, Vite e TypeScript
- Supabase Auth + Postgres + Row Level Security
- Google Books API
- Amazon Creators API ou links editoriais SiteStripe
- Hash Router, para funcionar sob `/projetos/entre-capitulos/`

## Configuração

1. Crie um projeto no Supabase.
2. Execute, em ordem, as migrations de `supabase/migrations` no SQL Editor.
3. Em Authentication, crie e confirme uma única conta de e-mail/senha para a
   casa.
4. Crie uma chave para Google Books API e restrinja-a à API e aos domínios
   autorizados.
5. Copie `.env.example` para `.env.local` e preencha:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
VITE_HOUSEHOLD_EMAIL=email-da-conta-da-casa
VITE_GOOGLE_BOOKS_API_KEY=chave-restrita-google-books
VITE_AMAZON_CATALOG_MODE=disabled
VITE_AMAZON_CATALOG_ENDPOINT=https://seu-projeto.supabase.co/functions/v1/amazon-catalog
```

O frontend nunca utiliza `service_role`. O e-mail técnico fica fora da tela; a
pessoa digita somente a senha da casa.

## Desenvolvimento

```powershell
npm install
npm run dev
```

Sem as três variáveis Supabase, o app inicia em modo local. Nesse modo a
primeira senha informada é guardada como hash no navegador e os dados ficam
somente naquele dispositivo. Use `?demo=1` antes da hash URL para carregar
dados fictícios destinados a QA visual:

```text
http://localhost:5173/?demo=1#/profiles
```

O modo local não substitui o Supabase para compartilhamento entre dispositivos.

## Livraria Amazon

As rotas `/livraria` e `/livraria/:asin` são públicas. A rota `/ofertas`
consulta, durante a visita, os livros marcados como `want_to_read` pelo perfil
ativo. O Google Books continua sendo usado somente para metadados da estante;
preço, oferta e link comercial vêm exclusivamente da Amazon.com.br.

Há três modos:

- `disabled`: não mostra catálogo, links ou valores comerciais;
- `sitestripe`: usa a curadoria persistida nas tabelas
  `amazon_editorial_collections` e `amazon_editorial_items`;
- `creators`: consulta a Creators API com OAuth client credentials.

O padrão seguro é `disabled`. Modos habilitados exigem a Edge Function: não há
fallback comercial local e nenhum link sem a tag da plataforma é publicado.
As quatro obras de `amazonBootstrap.ts` são apenas fixtures de teste, sem uso
no runtime de produção.

### Edge Function e segredos

O frontend recebe apenas modo, endpoint e chave pública. Credenciais Amazon
ficam nos Secrets da Edge Function e nunca devem usar o prefixo `VITE_`.

```powershell
supabase secrets set AMAZON_CATALOG_MODE=creators
supabase secrets set AMAZON_PARTNER_TAG=...
supabase secrets set AMAZON_CREATORS_CLIENT_ID=...
supabase secrets set AMAZON_CREATORS_CLIENT_SECRET=...
supabase secrets set AMAZON_ALLOWED_ORIGINS=https://seu-dominio.example
supabase functions deploy amazon-catalog --no-verify-jwt
```

Para iniciar com SiteStripe, mantenha `AMAZON_CATALOG_MODE=sitestripe` e
configure `AMAZON_PARTNER_TAG`; então cadastre somente ASINs e URLs de afiliado
reais nas tabelas editoriais. A função confere a tag esperada sem modificar a
URL, aceita apenas a origem configurada e aplica limite por IP/usuário. Quando
há sessão Supabase, o frontend envia o JWT do usuário para a limitação.

O modo Creators usa `www.amazon.com.br`, `pt_BR`, `BRL`, até 10 ASINs por
`GetItems`, 1 TPS e 8.640 chamadas diárias como limites iniciais. Metadados e
URLs expiram em até 24 horas; oferta e Sales Rank, em até uma hora. Imagens
Amazon são exibidas pela URL recebida e nunca são baixadas.

Ao marcar “Quero ler”, o banco guarda somente o vínculo durável com os ASINs e
formatos. Metadados permanentes vêm de um livro já existente ou do Google
Books; sem chave/resultado, é criado apenas um rótulo neutro com o ASIN. Preço,
URL comercial, imagem e descrição Amazon nunca são copiados para `books`.

Não existe histórico de preço, alerta automático nem alegação de “menor
preço”. Essa restrição segue as
[políticas do Programa de Associados](https://associados.amazon.com.br/help/operating/policies/?ac-ms-src=ac-nav)
e as [boas práticas da Creators API](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/best-programming-practices).
A habilitação do modo `creators` depende de aprovação e credenciais válidas da
conta Amazon.

## Qualidade

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Os testes puros da Edge Function rodam com:

```powershell
npx vitest run --config supabase/functions/amazon-catalog/vitest.config.ts
```

## Preview HCSolutions

Na raiz `Z:\HCSolutions`:

```powershell
$env:SKIP_PREVIEW_INSTALL='1'
npm run build:previews -- entre-capitulos
npm run deploy:previews -- entre-capitulos
```

URL esperada:

```text
https://preview.hcwebsolutions.com.br/projetos/entre-capitulos/
```
