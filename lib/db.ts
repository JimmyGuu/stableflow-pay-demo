import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { OrderRow, OrderStatus } from "@/lib/order";

export type { OrderRow, OrderStatus };

export type InsertOrderInput = {
  id: string;
  outOrderNo: string;
  sessionId: string;
  sessionUrl: string;
  paymentsId: string | null;
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
        id, out_order_no, session_id, session_url, payments_id, amount, network,
        symbol, recipient, status, success_url, created_at, updated_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.outOrderNo,
      input.sessionId,
      input.sessionUrl,
      input.paymentsId,
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

export async function listOrders(
  db: D1Database,
  limit = 50,
): Promise<OrderRow[]> {
  const result = await db
    .prepare(
      `SELECT * FROM orders ORDER BY created_at DESC LIMIT ?`,
    )
    .bind(limit)
    .all<OrderRow>();

  return (result.results ?? []).map(normalizeOrderRow);
}

export async function getOrderBySessionId(
  db: D1Database,
  sessionId: string,
): Promise<OrderRow | null> {
  const row = await db
    .prepare(`SELECT * FROM orders WHERE session_id = ? LIMIT 1`)
    .bind(sessionId)
    .first<OrderRow>();
  return row ? normalizeOrderRow(row) : null;
}

export async function getOrderByOutOrderNo(
  db: D1Database,
  outOrderNo: string,
): Promise<OrderRow | null> {
  const row = await db
    .prepare(`SELECT * FROM orders WHERE out_order_no = ? LIMIT 1`)
    .bind(outOrderNo)
    .first<OrderRow>();
  return row ? normalizeOrderRow(row) : null;
}

export async function getOrderByPaymentsId(
  db: D1Database,
  paymentsId: string,
): Promise<OrderRow | null> {
  const row = await db
    .prepare(`SELECT * FROM orders WHERE payments_id = ? LIMIT 1`)
    .bind(paymentsId)
    .first<OrderRow>();
  return row ? normalizeOrderRow(row) : null;
}

export async function findOrderForWebhook(params: {
  db: D1Database;
  outOrderNo?: string | null;
  sessionId?: string | null;
  paymentsId?: string | null;
}): Promise<OrderRow | null> {
  const { db, outOrderNo, sessionId, paymentsId } = params;
  if (outOrderNo) {
    const order = await getOrderByOutOrderNo(db, outOrderNo);
    if (order) return order;
  }
  if (sessionId) {
    const order = await getOrderBySessionId(db, sessionId);
    if (order) return order;
  }
  if (paymentsId) {
    const order = await getOrderByPaymentsId(db, paymentsId);
    if (order) return order;
  }
  return null;
}

export async function updateOrderStatus(params: {
  db: D1Database;
  orderId: string;
  status: OrderStatus;
  paymentsId?: string | null;
  updatedAt: string;
}): Promise<void> {
  const { db, orderId, status, paymentsId, updatedAt } = params;
  if (paymentsId) {
    await db
      .prepare(
        `UPDATE orders
         SET status = ?, payments_id = COALESCE(?, payments_id), updated_at = ?
         WHERE id = ?`,
      )
      .bind(status, paymentsId, updatedAt, orderId)
      .run();
    return;
  }

  await db
    .prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`)
    .bind(status, updatedAt, orderId)
    .run();
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

function normalizeOrderRow(row: OrderRow): OrderRow {
  return {
    ...row,
    session_url: row.session_url ?? null,
    payments_id: row.payments_id ?? null,
    status: String(row.status) === "abandoned" ? "expired" : row.status,
  };
}
