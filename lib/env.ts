export type ServerEnv = {
  STABLEFLOW_API_BASE: string;
  STABLEFLOW_PAY_HOST: string;
  STABLEFLOW_API_KEY: string;
  STABLEFLOW_WEBHOOK_SECRET: string;
  CHECKOUT_NETWORK: string;
  CHECKOUT_SYMBOL: string;
  CHECKOUT_RECIPIENT: string;
  NEXT_PUBLIC_APP_URL: string;
};

function required(name: keyof ServerEnv, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return trimmed;
}

function requiredUrl(name: keyof ServerEnv, value: string | undefined): string {
  return required(name, value).replace(/\/$/, "");
}

export function getServerEnv(): ServerEnv {
  return {
    STABLEFLOW_API_BASE: requiredUrl(
      "STABLEFLOW_API_BASE",
      process.env.STABLEFLOW_API_BASE,
    ),
    STABLEFLOW_PAY_HOST: requiredUrl(
      "STABLEFLOW_PAY_HOST",
      process.env.STABLEFLOW_PAY_HOST,
    ),
    STABLEFLOW_API_KEY: required(
      "STABLEFLOW_API_KEY",
      process.env.STABLEFLOW_API_KEY,
    ),
    STABLEFLOW_WEBHOOK_SECRET: required(
      "STABLEFLOW_WEBHOOK_SECRET",
      process.env.STABLEFLOW_WEBHOOK_SECRET,
    ),
    CHECKOUT_NETWORK: required(
      "CHECKOUT_NETWORK",
      process.env.CHECKOUT_NETWORK,
    ),
    CHECKOUT_SYMBOL: required("CHECKOUT_SYMBOL", process.env.CHECKOUT_SYMBOL),
    CHECKOUT_RECIPIENT: required(
      "CHECKOUT_RECIPIENT",
      process.env.CHECKOUT_RECIPIENT,
    ),
    NEXT_PUBLIC_APP_URL: requiredUrl(
      "NEXT_PUBLIC_APP_URL",
      process.env.NEXT_PUBLIC_APP_URL,
    ),
  };
}
