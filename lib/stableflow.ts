import { parsePayTokens, type PayToken } from "@/lib/checkout-options";
import { getAppEnv } from "@/lib/env";

export type CheckoutSession = {
  amount: string;
  created_at: string;
  expires_at: string;
  network: string;
  out_order_no: string;
  recipient: string;
  session_id: string;
  session_url: string;
  status: string;
  success_url: string;
  symbol: string;
};

export type CreateCheckoutSessionInput = {
  amount: string;
  apiKey: string;
  network: string;
  symbol: string;
  recipient: string;
};

type ApiEnvelope<T> = {
  code: number;
  data?: T;
  message?: string;
};

export function generateOutOrderNo(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `demo_${Date.now()}_${rand}`;
}

export async function fetchPayTokens(): Promise<PayToken[]> {
  const env = getAppEnv();
  const response = await fetch(`${env.STABLEFLOW_API_BASE}/v1/pay/tokens`);
  const payload = (await response.json()) as ApiEnvelope<unknown>;

  if (!response.ok || payload.code !== 200) {
    const message =
      payload.message || `Failed to load tokens (HTTP ${response.status})`;
    throw new Error(message);
  }

  const tokens = parsePayTokens(payload.data);
  if (tokens.length === 0 && !Array.isArray(payload.data)) {
    throw new Error("Invalid tokens response");
  }
  return tokens;
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<{
  session: CheckoutSession;
  checkoutUrl: string;
}> {
  const env = getAppEnv();
  const outOrderNo = generateOutOrderNo();
  const successUrl = new URL("/success", env.NEXT_PUBLIC_APP_URL).toString();

  const body = {
    amount: input.amount,
    network: input.network,
    out_order_no: outOrderNo,
    recipient: input.recipient,
    success_url: successUrl,
    symbol: input.symbol,
  };

  const response = await fetch(
    `${env.STABLEFLOW_API_BASE}/v1/pay/checkout/sessions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": input.apiKey,
      },
      body: JSON.stringify(body),
    },
  );

  const payload = (await response.json()) as ApiEnvelope<CheckoutSession>;

  if (!response.ok || payload.code !== 200 || !payload.data?.session_url) {
    const message =
      payload.message ||
      `Failed to create checkout session (HTTP ${response.status})`;
    throw new Error(message);
  }

  const session = payload.data;
  return {
    session,
    checkoutUrl: session.session_url,
  };
}
