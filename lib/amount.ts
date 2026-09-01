import Big from "big.js";

export const PRESET_AMOUNTS = [1, 5, 10, 25, 50, 100] as const;

export function parsePositiveAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function toAmountString(amount: number, options?: { decimals?: number; }): string {
  const { decimals = 2 } = options ?? {};
  return Big(amount || 0).toFixed(decimals, Big.roundDown);
}

/** Convert USD value to token amount. Checkout sessions allow at most 6 decimals. */
export function usdToTokenAmount(usd: number | string, price: string): string {
  return Big(usd || 0).div(price).toFixed(6, Big.roundDown);
}
