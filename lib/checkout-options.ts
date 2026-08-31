/** Checkout destination options aligned with StableFlow Pay v3. */

export type ChainOption = {
  blockchain: string;
  chainName: string;
};

/** Mirrors v3 FIXED_CHAINS blockchain codes used for payout destination. */
export const FIXED_CHAINS: ChainOption[] = [
  { blockchain: "eth", chainName: "Ethereum" },
  { blockchain: "base", chainName: "Base" },
  { blockchain: "arb", chainName: "Arbitrum" },
  { blockchain: "op", chainName: "Optimism" },
  { blockchain: "pol", chainName: "Polygon" },
  { blockchain: "bsc", chainName: "BNB Chain" },
  { blockchain: "avax", chainName: "Avalanche" },
  { blockchain: "gnosis", chainName: "Gnosis" },
  { blockchain: "scroll", chainName: "Scroll" },
  { blockchain: "xlayer", chainName: "X Layer" },
  { blockchain: "bera", chainName: "Berachain" },
  { blockchain: "near", chainName: "Near" },
  { blockchain: "sol", chainName: "Solana" },
  { blockchain: "tron", chainName: "Tron" },
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

export type PayToken = {
  symbol: string;
  network: string;
  decimals: number;
  contract_address: string;
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

export function isValidReceivePair(
  tokens: PayToken[],
  network: string,
  symbol: string,
): boolean {
  if (!NETWORK_SET.has(network) || !symbol) return false;
  return receiveTokens(tokens).some(
    (token) => token.network === network && token.symbol === symbol,
  );
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
  if (typeof record.support_payment !== "boolean") return null;
  if (typeof record.support_receive !== "boolean") return null;
  return {
    symbol: record.symbol,
    network: record.network,
    decimals: record.decimals,
    contract_address: record.contract_address,
    support_payment: record.support_payment,
    support_receive: record.support_receive,
  };
}
