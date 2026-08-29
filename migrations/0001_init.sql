CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  out_order_no TEXT NOT NULL UNIQUE,
  session_id TEXT,
  amount TEXT NOT NULL,
  network TEXT NOT NULL,
  symbol TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  success_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders (session_id);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  resource_id TEXT,
  payload_json TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events (type);
