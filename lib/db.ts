import { getCloudflareContext } from "@opennextjs/cloudflare";

export type OrderStatus = "pending" | "success" | "failed" | "abandoned";

export type OrderRow = {
  id: string;
  out_order_no: string;
  session_id: string | null;
  amount: string;
  network: string;
  symbol: string;
  recipient: string;
  status: OrderStatus;
  success_url: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
};

export type InsertOrderInput = {
  id: string;
  outOrderNo: string;
  sessionId: string;
  amount: string;
  network: string;
  symbol: string;
  recipient: string;
  status: OrderStatus;
  successUrl: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
};

export async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) {
    throw new Error("D1 binding DB is not configured");
  }
  return env.DB;
}

export async function insertOrder(
  db: D1Database,
  input: InsertOrderInput,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO orders (
        id, out_order_no, session_id, amount, network, symbol, recipient,
        status, success_url, created_at, updated_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.outOrderNo,
      input.sessionId,
      input.amount,
      input.network,
      input.symbol,
      input.recipient,
      input.status,
      input.successUrl,
      input.createdAt,
      input.updatedAt,
      input.expiresAt,
    )
    .run();
}

export async function getOrderBySessionId(
  db: D1Database,
  sessionId: string,
): Promise<OrderRow | null> {
  return db
    .prepare(`SELECT * FROM orders WHERE session_id = ? LIMIT 1`)
    .bind(sessionId)
    .first<OrderRow>();
}

export async function getOrderByOutOrderNo(
  db: D1Database,
  outOrderNo: string,
): Promise<OrderRow | null> {
  return db
    .prepare(`SELECT * FROM orders WHERE out_order_no = ? LIMIT 1`)
    .bind(outOrderNo)
    .first<OrderRow>();
}

export async function updateOrderStatus(params: {
  db: D1Database;
  sessionId?: string | null;
  outOrderNo?: string | null;
  status: OrderStatus;
  updatedAt: string;
}): Promise<void> {
  const { db, sessionId, outOrderNo, status, updatedAt } = params;

  if (sessionId) {
    await db
      .prepare(
        `UPDATE orders SET status = ?, updated_at = ? WHERE session_id = ?`,
      )
      .bind(status, updatedAt, sessionId)
      .run();
    return;
  }

  if (outOrderNo) {
    await db
      .prepare(
        `UPDATE orders SET status = ?, updated_at = ? WHERE out_order_no = ?`,
      )
      .bind(status, updatedAt, outOrderNo)
      .run();
  }
}

export type WebhookEventRow = {
  id: string;
  type: string;
  resource_id: string | null;
  payload_json: string;
  received_at: string;
};

export async function listWebhookEvents(
  db: D1Database,
  limit = 50,
): Promise<WebhookEventRow[]> {
  const result = await db
    .prepare(
      `SELECT id, type, resource_id, payload_json, received_at
       FROM webhook_events
       ORDER BY received_at DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all<WebhookEventRow>();

  return result.results ?? [];
}

export async function insertWebhookEventIfNew(params: {
  db: D1Database;
  id: string;
  type: string;
  resourceId: string | null;
  payloadJson: string;
  receivedAt: string;
}): Promise<boolean> {
  const existing = await params.db
    .prepare(`SELECT id FROM webhook_events WHERE id = ? LIMIT 1`)
    .bind(params.id)
    .first<{ id: string }>();

  if (existing) {
    return false;
  }

  await params.db
    .prepare(
      `INSERT INTO webhook_events (id, type, resource_id, payload_json, received_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      params.id,
      params.type,
      params.resourceId,
      params.payloadJson,
      params.receivedAt,
    )
    .run();

  return true;
}
