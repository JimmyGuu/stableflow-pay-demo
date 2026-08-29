export const DEMO_CONFIG_STORAGE_KEY = "stableflow-pay-demo.config";

export type DemoConfig = {
  apiKey: string;
  webhookSecret: string;
  network: string;
  symbol: string;
  recipient: string;
};

export const DEFAULT_DEMO_CONFIG: DemoConfig = {
  apiKey: "",
  webhookSecret: "",
  network: "near",
  symbol: "USDT",
  recipient: "",
};

export function parseDemoConfig(value: unknown): DemoConfig {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_DEMO_CONFIG };
  }

  const record = value as Record<string, unknown>;
  return {
    apiKey: typeof record.apiKey === "string" ? record.apiKey : "",
    webhookSecret:
      typeof record.webhookSecret === "string" ? record.webhookSecret : "",
    network:
      typeof record.network === "string" && record.network
        ? record.network
        : DEFAULT_DEMO_CONFIG.network,
    symbol:
      typeof record.symbol === "string" && record.symbol
        ? record.symbol
        : DEFAULT_DEMO_CONFIG.symbol,
    recipient: typeof record.recipient === "string" ? record.recipient : "",
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

export function isDemoConfigReady(config: DemoConfig): boolean {
  return Boolean(
    config.apiKey.trim() &&
      config.webhookSecret.trim() &&
      config.network.trim() &&
      config.symbol.trim() &&
      config.recipient.trim(),
  );
}
