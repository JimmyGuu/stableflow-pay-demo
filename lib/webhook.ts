import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import type { OrderStatus } from "@/lib/db";

export type WebhookEvent = {
  id?: string;
  type?: string;
  resourceId?: string;
  data?: Record<string, unknown>;
  createdAt?: string;
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

export function mapEventTypeToOrderStatus(
  eventType: string | undefined,
): OrderStatus | null {
  if (!eventType) return null;

  switch (eventType) {
    case "payment.success":
    case "checkout.session.completed":
      return "success";
    case "payment.failed":
      return "failed";
    case "payment.abandoned":
    case "checkout.session.expired":
      return "abandoned";
    default:
      return null;
  }
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function extractOrderRefs(event: WebhookEvent): {
  sessionId: string | null;
  outOrderNo: string | null;
} {
  const data = event.data ?? {};
  return {
    sessionId:
      asString(data.sessionId) ??
      asString(data.session_id) ??
      asString(event.resourceId),
    outOrderNo: asString(data.outOrderNo) ?? asString(data.out_order_no),
  };
}
