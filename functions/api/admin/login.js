import {
  createAdminSessionCookie,
  isValidAdminPassword,
} from '../../_shared/admin-auth.js';
import { json, methodNotAllowed } from '../../_shared/responses.js';

export async function onRequestPost({ request, env }) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON invalido.' }, { status: 400 });
  }

  const passwordCheck = isValidAdminPassword(body?.password, env);

  if (!passwordCheck.ok) {
    return json({ error: passwordCheck.error }, { status: passwordCheck.error.includes('configurado') ? 500 : 401 });
  }

  const session = await createAdminSessionCookie(request, env);

  if (!session.ok) {
    return json({ error: session.error }, { status: 500 });
  }

  return json(
    { ok: true },
    {
      headers: {
        'Set-Cookie': session.cookie,
      },
    },
  );
}

export function onRequestGet() {
  return methodNotAllowed();
}
