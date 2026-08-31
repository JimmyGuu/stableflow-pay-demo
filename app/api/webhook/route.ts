import { NextResponse } from "next/server";

import {
  findOrderForWebhook,
  getDB,
  insertWebhookEventIfNew,
  listWebhookEvents,
  updateOrderStatus,
} from "@/lib/db";
import { getWebhookSecret } from "@/lib/env";
import {
  extractOrderRefs,
  mapWebhookToOrderStatus,
  resolveEventId,
  verifyWebhookSignature,
  type WebhookEvent,
} from "@/lib/webhook";

function headerValue(headers: Headers, names: string[]): string | null {
  for (const name of names) {
    const value = headers.get(name);
    if (value) return value;
  }
  return null;
}

export async function GET() {
  try {
    const db = await getDB();
    const events = await listWebhookEvents(db, 50);
    return NextResponse.json({ events });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list webhook events";
    console.error("[webhook] GET", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const timestamp = headerValue(request.headers, [
    "x-stableflowpay-timestamp",
    "X-Stableflowpay-Timestamp",
  ]);
  const signature = headerValue(request.headers, [
    "x-stableflowpay-signature",
    "X-Stableflowpay-Signature",
  ]);
  const headerEventType = headerValue(request.headers, [
    "x-stableflowpay-event-type",
    "X-Stableflowpay-Event-Type",
  ]);

  if (!timestamp || !signature) {
    return NextResponse.json(
      { error: "Missing webhook signature headers" },
      { status: 401 },
    );
  }

  let secret: string;
  try {
    secret = getWebhookSecret();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook secret is not configured";
    console.error("[webhook]", message);
    return NextResponse.json(
      { error: "Webhook secret is not configured" },
      { status: 401 },
    );
  }

  const valid = verifyWebhookSignature({
    rawBody,
    timestamp,
    signature,
    secret,
  });

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventType = event.type || headerEventType || "unknown";
  const eventId = resolveEventId(event, timestamp, rawBody);
  const receivedAt = new Date().toISOString();
  const refs = extractOrderRefs(event);
  const db = await getDB();

  const inserted = await insertWebhookEventIfNew({
    db,
    id: eventId,
    type: eventType,
    resourceId: refs.sessionId ?? refs.paymentsId,
    payloadJson: rawBody,
    receivedAt,
  });

  if (inserted) {
    const status = mapWebhookToOrderStatus({
      dataStatus: refs.dataStatus,
      eventType,
    });
    if (status) {
      const order = await findOrderForWebhook({
        db,
        outOrderNo: refs.outOrderNo,
        sessionId: refs.sessionId,
        paymentsId: refs.paymentsId,
      });
      if (order) {
        await updateOrderStatus({
          db,
          orderId: order.id,
          status,
          paymentsId: refs.paymentsId,
          updatedAt: receivedAt,
        });
      }
    }
  }

  return new NextResponse("OK", { status: 200 });
}
