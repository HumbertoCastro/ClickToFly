# Entre Capítulos

Biblioteca doméstica para perfis compartilharem livros, progresso, resenhas,
resumos e avaliações por critérios.

## Stack

- React 19, Vite e TypeScript
- Supabase Auth + Postgres + Row Level Security
- Google Books API
- Hash Router, para funcionar sob `/projetos/entre-capitulos/`

## Configuração

1. Crie um projeto no Supabase.
2. Execute `supabase/migrations/202607280001_initial.sql` no SQL Editor.
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

## Qualidade

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
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
