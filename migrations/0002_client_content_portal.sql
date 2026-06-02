CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS client_project_access (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  project_slug TEXT NOT NULL,
  supabase_user_id TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients (id)
);

CREATE INDEX IF NOT EXISTS idx_client_project_access_user_project
  ON client_project_access (project_slug, supabase_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_project_access_email_project
  ON client_project_access (project_slug, lower(email));

CREATE INDEX IF NOT EXISTS idx_client_project_access_email
  ON client_project_access (lower(email), status);

CREATE TABLE IF NOT EXISTS editable_fields (
  project_slug TEXT NOT NULL,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'image', 'sectionVisible')),
  default_json TEXT NOT NULL DEFAULT 'null',
  validation_json TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (project_slug, field_key)
);

CREATE TABLE IF NOT EXISTS content_versions (
  id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'rollback')),
  content_json TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_by_email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  published_at TEXT,
  rollback_from_version_id TEXT,
  UNIQUE (project_slug, version_number)
);

CREATE INDEX IF NOT EXISTS idx_content_versions_project_public
  ON content_versions (project_slug, status, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_content_versions_project_draft_user
  ON content_versions (project_slug, status, created_by_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS asset_uploads (
  id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  sha256 TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'rejected')),
  created_by_user_id TEXT NOT NULL,
  created_by_email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  uploaded_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_asset_uploads_project_status
  ON asset_uploads (project_slug, status, created_at DESC);

CREATE TABLE IF NOT EXISTS publish_events (
  id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  version_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('publish', 'rollback')),
  actor_user_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  diff_summary_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_publish_events_project_created
  ON publish_events (project_slug, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  ip TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_project_created
  ON audit_log (project_slug, created_at DESC);

INSERT OR IGNORE INTO editable_fields (
  project_slug,
  field_key,
  label,
  field_type,
  default_json,
  validation_json,
  sort_order,
  enabled,
  created_at,
  updated_at
) VALUES
  (
    'clicktofly',
    'hero.title',
    'Titulo principal',
    'text',
    '{"type":"text","value":"Click To Fly"}',
    '{"maxLength":80,"target":{"selector":".flight-window-heading","mode":"text"}}',
    10,
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'clicktofly',
    'hero.description',
    'Descricao do hero',
    'text',
    '{"type":"text","value":"Curadoria humana de ofertas aereas, pacotes e alertas para embarcar com clareza."}',
    '{"maxLength":220,"target":{"selector":".flight-window-description","mode":"text"}}',
    20,
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'clicktofly',
    'sections.destinations.visible',
    'Mostrar secao de destinos',
    'sectionVisible',
    '{"type":"sectionVisible","visible":true}',
    '{"target":{"selector":".taste-destinations","mode":"visibility"}}',
    30,
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'clicktofly',
    'sections.socialProof.visible',
    'Mostrar prova social',
    'sectionVisible',
    '{"type":"sectionVisible","visible":true}',
    '{"target":{"selector":".taste-social-proof","mode":"visibility"}}',
    40,
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'clicktofly',
    'cta.title',
    'Titulo da chamada final',
    'text',
    '{"type":"text","value":"Receba o proximo achado antes que vire arrependimento."}',
    '{"maxLength":120,"target":{"selector":".taste-action h2","mode":"text"}}',
    50,
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'akatu',
    'hero.kicker',
    'Chamada curta do hero',
    'text',
    '{"type":"text","value":"Desenvolvendo sementes para um mundo inclusivo e feliz."}',
    '{"maxLength":140,"target":{"selector":"main section:first-of-type .inline-flex span","mode":"text"}}',
    10,
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'akatu',
    'hero.title',
    'Titulo principal',
    'text',
    '{"type":"text","value":"Um espaco vivo para a infancia florescer."}',
    '{"maxLength":100,"target":{"selector":"main section:first-of-type h1","mode":"text"}}',
    20,
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'akatu',
    'hero.description',
    'Descricao do hero',
    'text',
    '{"type":"text","value":"Terapia ocupacional, fonoaudiologia e psicologia em uma clinica infantil acolhedora, tecnica e cheia de imaginacao."}',
    '{"maxLength":240,"target":{"selector":"main section:first-of-type p.mt-8","mode":"text"}}',
    30,
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'akatu',
    'sections.reviews.visible',
    'Mostrar avaliacoes',
    'sectionVisible',
    '{"type":"sectionVisible","visible":true}',
    '{"target":{"selector":"#depoimentos","mode":"visibility"}}',
    40,
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'akatu',
    'sections.location.visible',
    'Mostrar localizacao',
    'sectionVisible',
    '{"type":"sectionVisible","visible":true}',
    '{"target":{"selector":"#localizacao","mode":"visibility"}}',
    50,
    1,
    datetime('now'),
    datetime('now')
  );
