CREATE TABLE IF NOT EXISTS feedback_submissions (
  id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  project_name TEXT NOT NULL,
  client TEXT NOT NULL,
  route TEXT NOT NULL,
  reviewer_name TEXT NOT NULL DEFAULT '',
  reviewer_email TEXT NOT NULL DEFAULT '',
  viewport_json TEXT NOT NULL,
  items_json TEXT NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'in_progress', 'resolved')),
  created_at TEXT NOT NULL,
  viewed_at TEXT,
  resolved_at TEXT,
  email_status TEXT NOT NULL DEFAULT 'pending',
  email_message_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_created_at
  ON feedback_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_project_status
  ON feedback_submissions (project_slug, status, created_at DESC);
