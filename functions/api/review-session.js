import { json, methodNotAllowed } from '../_shared/responses.js';
import { buildPreviewUrl, verifyReviewToken } from '../_shared/token.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const verification = await verifyReviewToken(token, env.FEEDBACK_TOKEN_SECRET);

  if (!verification.ok) {
    return json({ error: verification.error }, { status: 401 });
  }

  const payload = verification.payload;

  return json({
    session: {
      token,
      projectSlug: payload.projectSlug,
      projectName: payload.projectName,
      client: payload.client,
      route: payload.route,
      previewUrl: buildPreviewUrl(payload.projectSlug, payload.route),
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
    },
    emailTo: env.FEEDBACK_EMAIL_TO || 'dedebarbos@hotmail.com',
  });
}

export function onRequestPost() {
  return methodNotAllowed();
}
