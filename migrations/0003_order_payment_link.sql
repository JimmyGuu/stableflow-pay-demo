ALTER TABLE orders ADD COLUMN session_url TEXT;
ALTER TABLE orders ADD COLUMN payments_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payments_id ON orders (payments_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);
