import { NextResponse } from "next/server";

import { parsePositiveAmount, toAmountString } from "@/lib/amount";
import { getDB, insertOrder } from "@/lib/db";
import { createCheckoutSession } from "@/lib/stableflow";

type CreateSessionBody = {
  amount?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateSessionBody;
    const parsed = parsePositiveAmount(body.amount ?? "");
    if (parsed === null) {
      return NextResponse.json(
        { error: "A valid positive amount is required" },
        { status: 400 },
      );
    }

    const amount = toAmountString(parsed);
    const { session, checkoutUrl } = await createCheckoutSession(amount);
    const now = new Date().toISOString();
    const db = await getDB();

    await insertOrder(db, {
      id: session.out_order_no,
      outOrderNo: session.out_order_no,
      sessionId: session.session_id,
      amount: session.amount,
      network: session.network,
      symbol: session.symbol,
      recipient: session.recipient,
      status: "pending",
      successUrl: session.success_url,
      createdAt: session.created_at || now,
      updatedAt: now,
      expiresAt: session.expires_at || null,
    });

    return NextResponse.json({ checkoutUrl, session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create session";
    console.error("[checkout/sessions]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
