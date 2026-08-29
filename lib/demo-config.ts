export const DEMO_CONFIG_STORAGE_KEY = "stableflow-pay-demo.config";

export type DemoConfig = {
  apiKey: string;
  webhookSecret: string;
  network: string;
  symbol: string;
  recipient: string;
};

/** Defaults used when `full=1` is absent (simple demo mode). */
export const SIMPLE_MODE_DEFAULTS: Omit<DemoConfig, "apiKey"> = {
  webhookSecret: "whsec_AIzq42FKac3uwqpm",
  network: "near",
  symbol: "USDT",
  recipient: "jimmygu.near",
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
    webhookSecret:
      typeof record.webhookSecret === "string" && record.webhookSecret
        ? record.webhookSecret
        : SIMPLE_MODE_DEFAULTS.webhookSecret,
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
  };
}

let cachedRaw: string | null = null;
let cachedConfig: DemoConfig = DEFAULT_DEMO_CONFIG;

/** Cached snapshot for useSyncExternalStore (stable referential equality). */
export function getDemoConfigSnapshot(): DemoConfig {
  if (typeof window === "undefined") {
    return DEFAULT_DEMO_CONFIG;
  }

  try {
    const raw = window.localStorage.getItem(DEMO_CONFIG_STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedConfig;
    }
    cachedRaw = raw;
    cachedConfig = raw ? parseDemoConfig(JSON.parse(raw)) : DEFAULT_DEMO_CONFIG;
    return cachedConfig;
  } catch {
    cachedRaw = null;
    cachedConfig = DEFAULT_DEMO_CONFIG;
    return cachedConfig;
  }
}

export function saveDemoConfig(config: DemoConfig): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(config);
  window.localStorage.setItem(DEMO_CONFIG_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedConfig = config;
}

/** Effective config used for checkout / readiness checks. */
export function resolveCheckoutConfig(
  stored: DemoConfig,
  fullMode: boolean,
): DemoConfig {
  if (fullMode) {
    return stored;
  }
  return {
    apiKey: stored.apiKey,
    ...SIMPLE_MODE_DEFAULTS,
  };
}

export function isDemoConfigReady(config: DemoConfig): boolean {
  return Boolean(
    config.apiKey.trim() &&
      config.webhookSecret.trim() &&
      config.network.trim() &&
      config.symbol.trim() &&
      config.recipient.trim(),
  );
}
