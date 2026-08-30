export type AppEnv = {
  STABLEFLOW_API_BASE: string;
  NEXT_PUBLIC_APP_URL: string;
};

function required(name: keyof AppEnv, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return trimmed;
}

function requiredUrl(name: keyof AppEnv, value: string | undefined): string {
  return required(name, value).replace(/\/$/, "");
}

/** Host / URL settings only. Secrets and checkout fields come from the demo UI. */
export function getAppEnv(): AppEnv {
  return {
    STABLEFLOW_API_BASE: requiredUrl(
      "STABLEFLOW_API_BASE",
      process.env.STABLEFLOW_API_BASE,
    ),
    NEXT_PUBLIC_APP_URL: requiredUrl(
      "NEXT_PUBLIC_APP_URL",
      process.env.NEXT_PUBLIC_APP_URL,
    ),
  };
}
