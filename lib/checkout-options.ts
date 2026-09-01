/** Checkout destination options aligned with StableFlow Pay v3. */

export type ChainKind = "evm" | "near" | "solana" | "tron";

export type ChainOption = {
  blockchain: string;
  chainName: string;
  chainKind: ChainKind;
};

/** Mirrors v3 FIXED_CHAINS blockchain codes used for payout destination. */
export const FIXED_CHAINS: ChainOption[] = [
  { blockchain: "eth", chainName: "Ethereum", chainKind: "evm" },
  { blockchain: "base", chainName: "Base", chainKind: "evm" },
  { blockchain: "arb", chainName: "Arbitrum", chainKind: "evm" },
  { blockchain: "op", chainName: "Optimism", chainKind: "evm" },
  { blockchain: "pol", chainName: "Polygon", chainKind: "evm" },
  { blockchain: "bsc", chainName: "BNB Chain", chainKind: "evm" },
  { blockchain: "avax", chainName: "Avalanche", chainKind: "evm" },
  { blockchain: "gnosis", chainName: "Gnosis", chainKind: "evm" },
  { blockchain: "scroll", chainName: "Scroll", chainKind: "evm" },
  { blockchain: "xlayer", chainName: "X Layer", chainKind: "evm" },
  { blockchain: "bera", chainName: "Berachain", chainKind: "evm" },
  { blockchain: "near", chainName: "Near", chainKind: "near" },
  { blockchain: "sol", chainName: "Solana", chainKind: "solana" },
  { blockchain: "tron", chainName: "Tron", chainKind: "tron" },
];

/** Mirrors v3 PAYOUT_SYMBOLS. */
export const PAYOUT_SYMBOLS = [
  "USDC",
  "USDT",
  "DAI",
  "WETH",
  "ETH",
  "BNB",
  "AVAX",
  "TRX",
  "SOL",
  "NEAR",
] as const;

/** USD-pegged symbols: treat as 1:1 when converting Add Credits USD to token amount. */
export const STABLECOIN_SYMBOLS = ["USDC", "USDT", "DAI"] as const;

const STABLECOIN_SYMBOL_SET = new Set<string>(STABLECOIN_SYMBOLS);

export function isStablecoinSymbol(symbol: string): boolean {
  return STABLECOIN_SYMBOL_SET.has(symbol.trim().toUpperCase());
}

export type PayToken = {
  symbol: string;
  network: string;
  decimals: number;
  contract_address: string;
  price: string;
  support_payment: boolean;
  support_receive: boolean;
};

const NETWORK_SET = new Set(FIXED_CHAINS.map((chain) => chain.blockchain));

export function parsePayTokens(value: unknown): PayToken[] {
  if (!Array.isArray(value)) return [];
  const tokens: PayToken[] = [];
  for (const entry of value) {
    const token = parsePayToken(entry);
    if (token) tokens.push(token);
  }
  return tokens;
}

export function receiveTokens(tokens: PayToken[]): PayToken[] {
  return tokens.filter((token) => token.support_receive);
}

export function chainsForReceive(tokens: PayToken[]): ChainOption[] {
  const networks = new Set(
    receiveTokens(tokens).map((token) => token.network),
  );
  return FIXED_CHAINS.filter((chain) => networks.has(chain.blockchain));
}

export function symbolsForNetwork(tokens: PayToken[], network: string): string[] {
  const onChain = new Set(
    receiveTokens(tokens)
      .filter((token) => token.network === network)
      .map((token) => token.symbol),
  );
  const ranked: string[] = [];
  for (const symbol of PAYOUT_SYMBOLS) {
    if (onChain.has(symbol)) {
      ranked.push(symbol);
      onChain.delete(symbol);
    }
  }
  return [...ranked, ...[...onChain].sort((a, b) => a.localeCompare(b))];
}

export function findReceiveToken(
  tokens: PayToken[],
  network: string,
  symbol: string,
): PayToken | null {
  if (!NETWORK_SET.has(network) || !symbol) return null;
  return (
    receiveTokens(tokens).find(
      (token) => token.network === network && token.symbol === symbol,
    ) ?? null
  );
}

export function isValidReceivePair(
  tokens: PayToken[],
  network: string,
  symbol: string,
): boolean {
  return findReceiveToken(tokens, network, symbol) !== null;
}

export function resolveCheckoutPair(
  tokens: PayToken[],
  network: string,
  symbol: string,
): { network: string; symbol: string } {
  const chains = chainsForReceive(tokens);
  const nextNetwork = chains.some((chain) => chain.blockchain === network)
    ? network
    : (chains[0]?.blockchain ?? "");
  const symbols = symbolsForNetwork(tokens, nextNetwork);
  const nextSymbol = symbols.includes(symbol) ? symbol : (symbols[0] ?? "");
  return { network: nextNetwork, symbol: nextSymbol };
}

function parsePayToken(value: unknown): PayToken | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.symbol !== "string" || !record.symbol.trim()) return null;
  if (typeof record.network !== "string" || !record.network.trim()) return null;
  if (typeof record.decimals !== "number") return null;
  if (typeof record.contract_address !== "string") return null;
  if (typeof record.price !== "string" || !record.price.trim()) return null;
  const priceNum = Number(record.price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) return null;
  if (typeof record.support_payment !== "boolean") return null;
  if (typeof record.support_receive !== "boolean") return null;
  return {
    symbol: record.symbol,
    network: record.network,
    decimals: record.decimals,
    contract_address: record.contract_address,
    price: record.price.trim(),
    support_payment: record.support_payment,
    support_receive: record.support_receive,
  };
}
