import { NextResponse } from "next/server";

import {
  getDB,
  insertWebhookEventIfNew,
  updateOrderStatus,
} from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import {
  extractOrderRefs,
  mapEventTypeToOrderStatus,
  resolveEventId,
  verifyWebhookSignature,
  type WebhookEvent,
} from "@/lib/webhook";

function headerValue(
  headers: Headers,
  names: string[],
): string | null {
  for (const name of names) {
    const value = headers.get(name);
    if (value) return value;
  }
  return null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const timestamp = headerValue(request.headers, [
    "x-ping-timestamp",
    "X-Ping-Timestamp",
  ]);
  const signature = headerValue(request.headers, [
    "x-ping-signature",
    "X-Ping-Signature",
  ]);
  const headerEventType = headerValue(request.headers, [
    "x-ping-event-type",
    "X-Ping-Event-Type",
  ]);

  if (!timestamp || !signature) {
    return NextResponse.json(
      { error: "Missing webhook signature headers" },
      { status: 401 },
    );
  }

  let secret: string;
  try {
    secret = getServerEnv().STABLEFLOW_WEBHOOK_SECRET;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Server misconfigured";
    console.error("[webhooks]", message);
    return NextResponse.json({ error: message }, { status: 500 });
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
  const db = await getDB();

  const inserted = await insertWebhookEventIfNew({
    db,
    id: eventId,
    type: eventType,
    resourceId:
      typeof event.resourceId === "string" ? event.resourceId : null,
    payloadJson: rawBody,
    receivedAt,
  });

  if (inserted) {
    const status = mapEventTypeToOrderStatus(eventType);
    if (status) {
      const refs = extractOrderRefs(event);
      await updateOrderStatus({
        db,
        sessionId: refs.sessionId,
        outOrderNo: refs.outOrderNo,
        status,
        updatedAt: receivedAt,
      });
    }
  }

  return new NextResponse("OK", { status: 200 });
}
