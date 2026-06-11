# Client Feedback

Interface de revisao para clientes da HC Web Solutions.

## Link de revisao

O fluxo recomendado e entrar em `/projetos/`, fazer login com a senha admin e emitir o link pelo modal do projeto.

Na raiz `Z:\HCSolutions`, gere um link assinado:

```powershell
$env:FEEDBACK_TOKEN_SECRET='use-um-segredo-longo'
npm run feedback:link -- --project clicktofly --route / --client "Nome do Cliente"
```

## Envio de email

Configure no Cloudflare Pages:

- `RESEND_API_KEY` como secret.
- `FEEDBACK_TOKEN_SECRET` como secret.
- `PREVIEW_ADMIN_PASSWORD` como secret.
- `PREVIEW_ADMIN_SECRET` como secret, ou use fallback para `FEEDBACK_TOKEN_SECRET`.
- `FEEDBACK_EMAIL_TO=dedebarbos@hotmail.com`.
- `FEEDBACK_EMAIL_FROM=feedback@hcwebsolutions.com.br`.

O remetente precisa estar verificado no Resend antes do envio real.

## Inbox privada de feedback

O email recebido agora deve funcionar como notificacao curta. O detalhe real fica salvo no D1 e abre em `/feedback/admin/?submission=<id>`, usando a mesma senha admin dos previews.

Setup do D1 na raiz `Z:\HCSolutions`:

```powershell
npx wrangler d1 create hc_feedback_inbox
# copie o database_id retornado para wrangler.toml
npx wrangler d1 migrations apply hc_feedback_inbox
```

Binding esperado:

- `FEEDBACK_DB` apontando para o banco `hc_feedback_inbox`.
- Migration em `migrations/0001_feedback_submissions.sql`.

## Portal seguro de edicao do cliente

O portal do cliente fica em:

```txt
https://preview.hcwebsolutions.com.br/feedback/client/
```

Ele usa Supabase Auth para email/senha e D1/R2 para conteudo publicado. O cliente nao recebe token de deploy, segredo Cloudflare, acesso ao repo ou permissao para editar campos fora do manifesto.

Configure o build do app com:

```txt
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

Configure no Cloudflare Pages:

- `SUPABASE_URL` como variavel.
- `SUPABASE_JWT_AUDIENCE=authenticated`, se quiser declarar explicitamente.
- `SUPABASE_REQUIRE_AAL2=1`, opcional, para exigir MFA AAL2 nas APIs do portal.
- `CLIENT_ASSETS_BUCKET` como binding R2 para o bucket `hc-client-assets`.

Setup do armazenamento:

```powershell
npx wrangler r2 bucket create hc-client-assets
npx wrangler d1 migrations apply hc_feedback_inbox
```

Para liberar um cliente, crie o usuario no Supabase e vincule o email ao projeto no D1:

```sql
INSERT INTO clients (id, name, created_at, updated_at)
VALUES ('cliente-clicktofly', 'Cliente ClickToFly', datetime('now'), datetime('now'));

INSERT INTO client_project_access (
  id,
  client_id,
  project_slug,
  supabase_user_id,
  email,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  'access-clicktofly-email',
  'cliente-clicktofly',
  'clicktofly',
  '',
  'cliente@email.com',
  'client',
  'active',
  datetime('now'),
  datetime('now')
);
```

Os campos editaveis ficam em `editable_fields`. A migration `0002_client_content_portal.sql` ja cria exemplos seguros para `clicktofly` e `akatu`. Cada campo define tipo, limite e seletor publico controlado pela HC; o cliente so envia valores.
