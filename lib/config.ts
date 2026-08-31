/** API key bound to this demo's default webhook on StableFlow Pay. */
export const DEMO_WEBHOOK_BOUND_API_KEY =
  "Rh6nJMMXnqOMJk5jlNHxox7atvIClGGI8fypyXxoweJ8jaZ2VH3atM04ide62RNz";

/** Default off. Set NEXT_PUBLIC_VALIDATE_CHECKOUT_RECIPIENT=true to enable. */
export function shouldValidateCheckoutRecipient(): boolean {
  const raw = process.env.NEXT_PUBLIC_VALIDATE_CHECKOUT_RECIPIENT;
  const value = raw?.trim().toLowerCase();
  return value === "true" || value === "1";
}
