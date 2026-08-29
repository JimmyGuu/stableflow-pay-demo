CREATE TABLE IF NOT EXISTS demo_settings (
  id TEXT PRIMARY KEY,
  webhook_secret TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
