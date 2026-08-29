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

export type PayoutSymbol = (typeof PAYOUT_SYMBOLS)[number];

const NETWORK_SET = new Set(FIXED_CHAINS.map((chain) => chain.blockchain));
const SYMBOL_SET = new Set<string>(PAYOUT_SYMBOLS);

export function isValidCheckoutNetwork(network: string): boolean {
  return NETWORK_SET.has(network);
}

export function isValidCheckoutSymbol(symbol: string): boolean {
  return SYMBOL_SET.has(symbol);
}
