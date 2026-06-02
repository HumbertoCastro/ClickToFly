export type PortalSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
  };
};

export type PortalProject = {
  accessId: string;
  clientId: string;
  clientName: string;
  projectSlug: string;
  role: 'client' | 'admin';
  email: string;
  editableCount: number;
  publishedVersion: number | null;
  publishedAt: string;
};

export type PortalFieldType = 'text' | 'image' | 'sectionVisible';

export type PortalField = {
  projectSlug: string;
  key: string;
  label: string;
  type: PortalFieldType;
  defaultValue: PortalContentValue | null;
  validation: {
    maxLength?: number;
    target?: {
      selector?: string;
      mode?: string;
    };
  };
  sortOrder: number;
  enabled: boolean;
};

export type PortalContentValue =
  | {
      type: 'text';
      value: string;
    }
  | {
      type: 'image';
      assetId: string;
      url?: string;
    }
  | {
      type: 'sectionVisible';
      visible: boolean;
    };

export type PortalContent = Record<string, PortalContentValue>;

export type PortalVersion = {
  id: string;
  projectSlug: string;
  versionNumber: number;
  status: 'draft' | 'published' | 'rollback';
  content: PortalContent;
  createdByUserId: string;
  createdByEmail: string;
  createdAt: string;
  publishedAt: string;
  rollbackFromVersionId: string;
};

export type PortalProjectDetail = {
  project: PortalProject;
  fields: PortalField[];
  published: PortalVersion | null;
  draft: PortalVersion | null;
  versions: PortalVersion[];
};

export type PortalAsset = {
  id: string;
  projectSlug: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  status: 'pending' | 'uploaded' | 'rejected';
  publicUrl: string;
};

const SESSION_KEY = 'hc-client-portal:session:v1';

export function getSupabaseConfig() {
  const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '');

  return {
    configured: Boolean(supabaseUrl && anonKey),
    supabaseUrl,
    anonKey,
  };
}

export function loadPortalSession(): PortalSession | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as PortalSession | null;

    if (!parsed?.accessToken || !parsed.refreshToken || !parsed.expiresAt) {
      return null;
    }

    if (parsed.expiresAt <= Math.floor(Date.now() / 1000)) {
      clearPortalSession();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function savePortalSession(session: PortalSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearPortalSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function signInWithPassword(email: string, password: string) {
  const config = requireSupabaseConfig();
  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.msg || payload.error || 'Nao foi possivel entrar.');
  }

  const session = mapSupabaseSession(payload);
  savePortalSession(session);
  return session;
}

export async function sendPasswordReset(email: string) {
  const config = requireSupabaseConfig();
  const response = await fetch(`${config.supabaseUrl}/auth/v1/recover`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email,
      redirect_to: window.location.href,
    }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error_description || payload.msg || payload.error || 'Nao foi possivel enviar reset.');
  }
}

export async function refreshPortalSession(session: PortalSession) {
  if (session.expiresAt > Math.floor(Date.now() / 1000) + 90) {
    return session;
  }

  const config = requireSupabaseConfig();
  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.access_token) {
    clearPortalSession();
    throw new Error('Sessao expirada. Entre novamente.');
  }

  const nextSession = mapSupabaseSession(payload);
  savePortalSession(nextSession);
  return nextSession;
}

export async function portalFetch<T>(
  session: PortalSession,
  path: string,
  init: RequestInit = {},
): Promise<{ session: PortalSession; data: T }> {
  const nextSession = await refreshPortalSession(session);
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
      Authorization: `Bearer ${nextSession.accessToken}`,
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Nao foi possivel completar a acao.');
  }

  return { session: nextSession, data: payload as T };
}

export async function uploadPortalAsset(
  session: PortalSession,
  projectSlug: string,
  file: File,
) {
  const intent = await portalFetch<{
    asset: PortalAsset;
    uploadUrl: string;
  }>(session, '/api/client/assets/upload-intent', {
    method: 'POST',
    body: JSON.stringify({
      projectSlug,
      fileName: file.name,
      contentType: file.type,
      byteSize: file.size,
    }),
  });

  const response = await fetch(intent.data.uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${intent.session.accessToken}`,
      'Content-Type': file.type,
    },
    body: file,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Nao foi possivel enviar a imagem.');
  }

  return {
    session: intent.session,
    asset: payload.asset as PortalAsset,
  };
}

function requireSupabaseConfig() {
  const config = getSupabaseConfig();

  if (!config.configured) {
    throw new Error('Supabase nao configurado no build.');
  }

  return config;
}

function mapSupabaseSession(payload: any): PortalSession {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Number(payload.expires_at || Math.floor(Date.now() / 1000) + Number(payload.expires_in || 3600)),
    user: {
      id: String(payload.user?.id || ''),
      email: String(payload.user?.email || ''),
    },
  };
}
