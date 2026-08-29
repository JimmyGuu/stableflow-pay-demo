import { getServerEnv } from "@/lib/env";

export type CheckoutSession = {
  amount: string;
  created_at: string;
  expires_at: string;
  network: string;
  out_order_no: string;
  recipient: string;
  session_id: string;
  status: string;
  success_url: string;
  symbol: string;
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

export function buildCheckoutUrl(sessionId: string): string {
  const env = getServerEnv();
  const url = new URL("/checkout", env.STABLEFLOW_PAY_HOST);
  url.searchParams.set("sessionId", sessionId);
  return url.toString();
}

export async function createCheckoutSession(amount: string): Promise<{
  session: CheckoutSession;
  checkoutUrl: string;
}> {
  const env = getServerEnv();
  const outOrderNo = generateOutOrderNo();
  const successUrl = new URL("/success", env.NEXT_PUBLIC_APP_URL).toString();

  const body = {
    amount,
    network: env.CHECKOUT_NETWORK,
    out_order_no: outOrderNo,
    recipient: env.CHECKOUT_RECIPIENT,
    success_url: successUrl,
    symbol: env.CHECKOUT_SYMBOL,
  };

  const response = await fetch(
    `${env.STABLEFLOW_API_BASE}/v1/pay/checkout/sessions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.STABLEFLOW_API_KEY,
      },
      body: JSON.stringify(body),
    },
  );

  const payload = (await response.json()) as ApiEnvelope<CheckoutSession>;

  if (!response.ok || payload.code !== 200 || !payload.data?.session_id) {
    const message =
      payload.message ||
      `Failed to create checkout session (HTTP ${response.status})`;
    throw new Error(message);
  }

  const session = payload.data;
  return {
    session,
    checkoutUrl: buildCheckoutUrl(session.session_id),
  };
}
