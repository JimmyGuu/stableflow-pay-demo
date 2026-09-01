import { NextResponse } from "next/server";
import Big from "big.js";

import { isAddressValid } from "@/lib/address";
import { parsePositiveAmount, usdToTokenAmount } from "@/lib/amount";
import {
  findReceiveToken,
  isStablecoinSymbol,
  type PayToken,
} from "@/lib/checkout-options";
import { shouldValidateCheckoutRecipient } from "@/lib/config";
import { getDB, insertOrder } from "@/lib/db";
import { getAppEnv } from "@/lib/env";
import { createCheckoutSession, fetchPayTokens } from "@/lib/stableflow";
import { isValidHttpUrl } from "@/lib/url";

type CreateSessionBody = {
  amount?: string;
  apiKey?: string;
  network?: string;
  symbol?: string;
  recipient?: string;
  successUrl?: string;
};

function defaultSuccessUrl(): string {
  return new URL("/success", getAppEnv().NEXT_PUBLIC_APP_URL).toString();
}

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
    const successUrl = body.successUrl?.trim() || defaultSuccessUrl();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 },
      );
    }
    if (!isValidHttpUrl(successUrl)) {
      return NextResponse.json(
        { error: "A valid http(s) success URL is required" },
        { status: 400 },
      );
    }
    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient is required" },
        { status: 400 },
      );
    }
    if (
      shouldValidateCheckoutRecipient() &&
      !isAddressValid(recipient, network)
    ) {
      return NextResponse.json(
        { error: "Recipient address does not match the selected network" },
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

    const token = findReceiveToken(tokens, network, symbol);
    if (!token) {
      return NextResponse.json(
        { error: "Invalid checkout network/symbol pair" },
        { status: 400 },
      );
    }

    const amount = usdToTokenAmount(
      parsed,
      isStablecoinSymbol(token.symbol) ? "1" : token.price,
    );
    if (Big(amount).lte(0)) {
      return NextResponse.json(
        { error: "Amount is too small for the selected token price" },
        { status: 400 },
      );
    }

    const { session, checkoutUrl } = await createCheckoutSession({
      amount,
      apiKey,
      network,
      symbol,
      recipient,
      successUrl,
    });
    const now = new Date().toISOString();
    const db = await getDB();

    await insertOrder(db, {
      id: session.out_order_no,
      outOrderNo: session.out_order_no,
      sessionId: session.session_id,
      sessionUrl: session.session_url,
      paymentsId: session.payments_id?.trim() || null,
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
