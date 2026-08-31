import { isAddressValid } from "@/lib/address";
import { shouldValidateCheckoutRecipient } from "@/lib/config";
import { isValidHttpUrl } from "@/lib/url";

export const DEMO_CONFIG_STORAGE_KEY = "stableflow-pay-demo.config";

export type DemoConfig = {
  apiKey: string;
  network: string;
  symbol: string;
  recipient: string;
  successUrl: string;
};

/** Default network, symbol, recipient, and success URL when a field is missing. */
export const SIMPLE_MODE_DEFAULTS: Omit<DemoConfig, "apiKey"> = {
  network: "near",
  symbol: "USDT",
  recipient: "stableflow.near",
  successUrl: "",
};

export const DEFAULT_DEMO_CONFIG: DemoConfig = {
  apiKey: "",
  ...SIMPLE_MODE_DEFAULTS,
};

export function parseDemoConfig(value: unknown): DemoConfig {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_DEMO_CONFIG };
  }

  const record = value as Record<string, unknown>;
  return {
    apiKey: typeof record.apiKey === "string" ? record.apiKey : "",
    network:
      typeof record.network === "string" && record.network
        ? record.network
        : SIMPLE_MODE_DEFAULTS.network,
    symbol:
      typeof record.symbol === "string" && record.symbol
        ? record.symbol
        : SIMPLE_MODE_DEFAULTS.symbol,
    recipient:
      typeof record.recipient === "string" && record.recipient
        ? record.recipient
        : SIMPLE_MODE_DEFAULTS.recipient,
    successUrl:
      typeof record.successUrl === "string" ? record.successUrl : "",
  };
}

export function isDemoConfigReady(config: DemoConfig): boolean {
  const recipientOk = shouldValidateCheckoutRecipient()
    ? isAddressValid(config.recipient, config.network)
    : Boolean(config.recipient.trim());
  return Boolean(
    config.apiKey.trim() &&
      config.network.trim() &&
      config.symbol.trim() &&
      recipientOk &&
      isValidHttpUrl(config.successUrl),
  );
}
