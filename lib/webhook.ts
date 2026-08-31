import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import type { OrderStatus } from "@/lib/order";

export type WebhookEvent = {
  id?: string;
  type?: string;
  resourceId?: string;
  created_at?: string;
  createdAt?: string;
  data?: Record<string, unknown>;
};

export function verifyWebhookSignature(params: {
  rawBody: string;
  timestamp: string;
  signature: string;
  secret: string;
}): boolean {
  const { rawBody, timestamp, signature, secret } = params;
  if (!timestamp || !signature || !secret) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function resolveEventId(
  event: WebhookEvent,
  timestamp: string,
  rawBody: string,
): string {
  if (event.id && typeof event.id === "string") {
    return event.id;
  }
  return createHash("sha256")
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
}

export function mapWebhookToOrderStatus(params: {
  dataStatus?: string | null;
  eventType?: string | null;
}): OrderStatus | null {
  const values = [params.dataStatus, params.eventType]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().toLowerCase());

  for (const value of values) {
    if (
      value === "success" ||
      value === "completed" ||
      value === "payment.success" ||
      value === "checkout.session.completed"
    ) {
      return "success";
    }
    if (value === "failed" || value === "payment.failed") {
      return "failed";
    }
    if (
      value === "expired" ||
      value === "abandoned" ||
      value === "payment.abandoned" ||
      value === "checkout.session.expired"
    ) {
      return "expired";
    }
  }

  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function extractOrderRefs(event: WebhookEvent): {
  sessionId: string | null;
  outOrderNo: string | null;
  paymentsId: string | null;
  dataStatus: string | null;
} {
  const data = event.data ?? {};
  return {
    sessionId:
      asString(data.sessionId) ??
      asString(data.session_id) ??
      asString(event.resourceId),
    outOrderNo: asString(data.outOrderNo) ?? asString(data.out_order_no),
    paymentsId: asString(data.paymentsId) ?? asString(data.payments_id),
    dataStatus: asString(data.status),
  };
}
