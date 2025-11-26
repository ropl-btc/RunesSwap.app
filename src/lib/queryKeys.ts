// Centralized, typed query key factories to avoid magic strings

export const queryKeys = {
  /** Key for popular runes list. */
  popularRunes: () => ['popularRunes'] as const,
  /** Key for specific rune info. */
  runeInfo: (name: string) => ['runeInfo', name] as const,
  /** Key for rune market data. */
  runeMarket: (name: string) => ['runeMarket', name] as const,
  /** Key for rune price history. */
  runePriceHistory: (name: string) => ['runePriceHistory', name] as const,
  /** Key for BTC balance of an address. */
  btcBalance: (address: string) => ['btcBalance', address] as const,
  /** Key for rune balances of an address. */
  runeBalances: (address: string) => ['runeBalances', address] as const,
  /** Key for full runes list. */
  runesList: () => ['runesList'] as const,
  /** Key for rune activity of an address. */
  runeActivity: (address: string) => ['runeActivity', address] as const,
  /** Key for portfolio data of an address. */
  portfolioData: (address: string) => ['portfolioData', address] as const,
  /** Key for Liquidium portfolio data. */
  liquidiumPortfolio: (address: string) =>
    ['liquidiumPortfolio', address] as const,
  /** Key for BTC fee rates. */
  btcFeeRates: () => ['btcFeeRates'] as const,
};

export type QueryKeyFactory = typeof queryKeys;
