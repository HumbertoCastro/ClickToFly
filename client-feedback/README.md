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
