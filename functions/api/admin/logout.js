import { clearAdminSessionCookie } from '../../_shared/admin-auth.js';
import { json, methodNotAllowed } from '../../_shared/responses.js';

export function onRequestPost({ request }) {
  return json(
    { ok: true },
    {
      headers: {
        'Set-Cookie': clearAdminSessionCookie(request),
      },
    },
  );
}

export function onRequestGet() {
  return methodNotAllowed();
}
