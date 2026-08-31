import { FIXED_CHAINS, type ChainKind } from "@/lib/checkout-options";

export type AddressValidationResult = {
  isValid: boolean;
  error?: string;
};

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const byBlockchain = new Map(
  FIXED_CHAINS.map((chain) => [chain.blockchain, chain.chainKind]),
);

function decodeBase58(input: string): Uint8Array | null {
  if (!input) return null;
  let zeros = 0;
  while (zeros < input.length && input[zeros] === "1") zeros++;
  const size = Math.ceil(input.length * 0.733);
  const bytes = new Uint8Array(size);
  let length = 0;
  for (let i = zeros; i < input.length; i++) {
    let carry = BASE58_ALPHABET.indexOf(input[i]);
    if (carry < 0) return null;
    for (let j = 0; j < length; j++) {
      carry += bytes[size - 1 - j] * 58;
      bytes[size - 1 - j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes[size - 1 - length] = carry & 0xff;
      length++;
      carry >>= 8;
    }
  }
  const out = new Uint8Array(zeros + length);
  for (let i = 0; i < length; i++) out[zeros + i] = bytes[size - length + i];
  return out;
}

export function chainKindForNetwork(network: string): ChainKind | null {
  const raw = String(network || "").trim().toLowerCase();
  if (!raw) return null;
  if (raw === "evm" || raw === "near" || raw === "solana" || raw === "tron") {
    return raw;
  }
  if (raw === "sol") return "solana";
  if (raw === "trx") return "tron";
  return byBlockchain.get(raw) ?? null;
}

function validateEvmAddress(address: string): AddressValidationResult {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { isValid: false, error: "Invalid EVM address" };
  }
  return { isValid: true };
}

function validateNearAddress(address: string): AddressValidationResult {
  if (address.length < 2 || address.length > 64) {
    return { isValid: false, error: "NEAR address must be 2-64 characters long" };
  }
  if (address.startsWith(".") || address.endsWith(".")) {
    return { isValid: false, error: "NEAR address cannot start or end with a dot" };
  }
  if (address.includes("..")) {
    return { isValid: false, error: "NEAR address cannot contain consecutive dots" };
  }
  if (/^[0-9a-f]{64}$/i.test(address)) {
    return { isValid: true };
  }
  if (address.startsWith("0x") || address.startsWith("0X")) {
    return { isValid: false, error: "Invalid NEAR address" };
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(address)) {
    return { isValid: false, error: "Invalid NEAR address" };
  }
  const labelPattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/;
  if (!address.split(".").every((label) => labelPattern.test(label))) {
    return {
      isValid: false,
      error: "NEAR address labels must start/end with letters or numbers",
    };
  }
  if (/^\d+$/.test(address)) {
    return { isValid: false, error: "NEAR address cannot be purely numeric" };
  }
  if (!/[a-zA-Z]/.test(address)) {
    return { isValid: false, error: "NEAR address must contain at least one letter" };
  }
  return { isValid: true };
}

function validateSolanaAddress(address: string): AddressValidationResult {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return { isValid: false, error: "Invalid Solana address" };
  }
  const decoded = decodeBase58(address);
  if (!decoded || decoded.length !== 32) {
    return { isValid: false, error: "Invalid Solana address" };
  }
  return { isValid: true };
}

function validateTronAddress(address: string): AddressValidationResult {
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
    return { isValid: false, error: "Invalid Tron address" };
  }
  return { isValid: true };
}

export function validateAddress(
  address: string,
  networkOrKind: string | null | undefined,
): AddressValidationResult {
  const trimmed = String(address || "").trim();
  if (!trimmed) return { isValid: false, error: "Address cannot be empty" };
  const kind = chainKindForNetwork(String(networkOrKind || ""));
  if (!kind) return { isValid: false, error: "Unsupported network" };
  if (kind === "evm") return validateEvmAddress(trimmed);
  if (kind === "near") return validateNearAddress(trimmed);
  if (kind === "tron") return validateTronAddress(trimmed);
  return validateSolanaAddress(trimmed);
}

export function isAddressValid(
  address: string,
  networkOrKind: string | null | undefined,
): boolean {
  return validateAddress(address, networkOrKind).isValid;
}
