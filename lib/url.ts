export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function defaultSuccessUrl(): string {
  if (typeof window === "undefined") return "";
  return new URL("/success", window.location.origin).toString();
}
