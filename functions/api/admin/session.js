import { verifyAdminRequest } from '../../_shared/admin-auth.js';
import { json, methodNotAllowed } from '../../_shared/responses.js';

export async function onRequestGet({ request, env }) {
  const session = await verifyAdminRequest(request, env);

  if (!session.ok) {
    return json({ authenticated: false, error: session.error });
  }

  return json({ authenticated: true, expiresAt: session.payload.exp });
}

export function onRequestPost() {
  return methodNotAllowed();
}
