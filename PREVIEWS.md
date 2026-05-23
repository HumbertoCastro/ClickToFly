# Deploy de previews

Este projeto raiz gera um pacote unico para Cloudflare Pages em `preview-dist`.

## Rotas

- `https://preview.hcwebsolutions.com.br/`
- `https://preview.hcwebsolutions.com.br/projetos/akatu/`
- `https://preview.hcwebsolutions.com.br/projetos/analitica/`
- `https://preview.hcwebsolutions.com.br/projetos/briefing/`
- `https://preview.hcwebsolutions.com.br/projetos/clicktofly/`
- `https://preview.hcwebsolutions.com.br/projetos/dgad/`

## Cloudflare Pages

O deploy automatizado usa Wrangler e a API da Cloudflare.

- Project name: `hcwebsolutions-preview`
- Custom domain: `preview.hcwebsolutions.com.br`
- Build output directory: `preview-dist`

## Configuracao unica

Instale as dependencias da raiz:

```bash
npm install
```

Copie o exemplo de variaveis:

```powershell
Copy-Item .env.cloudflare.example .env.cloudflare
```

Preencha `.env.cloudflare`:

```txt
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ZONE_ID=
```

Permissoes recomendadas para o token:

- Account > Cloudflare Pages > Edit
- Zone > DNS > Edit

O script usa a API oficial para criar o projeto Pages, anexar o dominio e criar/atualizar o CNAME.

## Primeiro deploy

Rode:

```bash
npm run deploy:previews
```

Esse comando:

1. garante que o projeto `hcwebsolutions-preview` existe
2. builda todas as landings listadas em `preview.config.json`
3. publica `preview-dist` com Wrangler
4. remove `preview.hcwebsolutions.com.br` do projeto antigo `hcwebsolutions`, se ainda estiver preso nele
5. atualiza o DNS `preview -> hcwebsolutions-preview.pages.dev`
6. adiciona o custom domain no projeto novo

## Deploys seguintes

Sem parametro, o build continua recompilando todos os projetos:

```bash
npm run build:previews
```

Para buildar somente um projeto:

```bash
npm run build:previews -- akatu
```

Para buildar mais de um projeto:

```bash
npm run build:previews -- akatu clicktofly
```

Para publicar sem passos manuais, tambem e possivel passar o slug:

```bash
npm run deploy:previews -- akatu
```

Importante: o deploy parcial publica a pasta `preview-dist` inteira como versao final no Cloudflare Pages. Por isso, antes de enviar, o script valida se todas as rotas configuradas ainda existem em `preview-dist`. Se a pasta estiver incompleta, rode um build completo uma vez:

```bash
npm run build:previews
```

Para builds locais mais rapidos, quando quiser pular instalacao de dependencias, use:

```powershell
$env:SKIP_PREVIEW_INSTALL='1'; npm run build:previews
```

Por padrao, o script so roda `npm ci` dentro de uma landing quando ela ainda nao tem `node_modules`. Em CI limpo isso instala tudo; localmente evita reinstalacoes desnecessarias.

Para publicar sem passos manuais:

```bash
npm run deploy:previews
```

## Protecao

Os arquivos gerados incluem `robots.txt`, `meta robots` e header `X-Robots-Tag`, mas isso nao substitui controle de acesso.

Para previews de clientes, ative Cloudflare Access em:

```txt
preview.hcwebsolutions.com.br/*
```

## Adicionar novo projeto

Inclua uma entrada em `preview.config.json`:

```json
{
  "slug": "cliente",
  "name": "Cliente",
  "description": "Landing page em homologacao.",
  "dir": "nome-da-pasta"
}
```

O projeto precisa ter `package.json`, script `build` e gerar `dist`.

Se o app tiver rotas internas renderizadas pelo React, declare essas rotas em
`routes` para que o build gere um `index.html` estatico para cada uma:

```json
{
  "slug": "cliente",
  "name": "Cliente",
  "description": "Landing page em homologacao.",
  "dir": "nome-da-pasta",
  "routes": ["/orcamento"]
}
```

Isso evita que rotas como `/projetos/cliente/orcamento` caiam no indice geral
dos previews em ambientes onde o fallback SPA global do Cloudflare Pages entra
antes das rotas do projeto.
