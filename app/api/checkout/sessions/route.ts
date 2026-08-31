import { NextResponse } from "next/server";

import { parsePositiveAmount, toAmountString } from "@/lib/amount";
import {
  isValidReceivePair,
  type PayToken,
} from "@/lib/checkout-options";
import { getDB, insertOrder } from "@/lib/db";
import { createCheckoutSession, fetchPayTokens } from "@/lib/stableflow";

type CreateSessionBody = {
  amount?: string;
  apiKey?: string;
  network?: string;
  symbol?: string;
  recipient?: string;
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

    const apiKey = body.apiKey?.trim() ?? "";
    const network = body.network?.trim() ?? "";
    const symbol = body.symbol?.trim() ?? "";
    const recipient = body.recipient?.trim() ?? "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 },
      );
    }
    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient is required" },
        { status: 400 },
      );
    }

    let tokens: PayToken[];
    try {
      tokens = await fetchPayTokens();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load tokens";
      return NextResponse.json({ error: message }, { status: 502 });
    }
    if (!isValidReceivePair(tokens, network, symbol)) {
      return NextResponse.json(
        { error: "Invalid checkout network/symbol pair" },
        { status: 400 },
      );
    }

    const amount = toAmountString(parsed);
    const { session, checkoutUrl } = await createCheckoutSession({
      amount,
      apiKey,
      network,
      symbol,
      recipient,
    });
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
