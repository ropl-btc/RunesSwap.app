// Centralized, typed query key factories to avoid magic strings

export const queryKeys = {
  popularRunes: () => ['popularRunes'] as const,
  runeInfo: (name: string) => ['runeInfo', name] as const,
  runeMarket: (name: string) => ['runeMarket', name] as const,
  runePriceHistory: (name: string) => ['runePriceHistory', name] as const,
  btcBalance: (address: string) => ['btcBalance', address] as const,
  runeBalances: (address: string) => ['runeBalances', address] as const,
  runesList: () => ['runesList'] as const,
  runeActivity: (address: string) => ['runeActivity', address] as const,
  portfolioData: (address: string) => ['portfolioData', address] as const,
  liquidiumPortfolio: (address: string) =>
    ['liquidiumPortfolio', address] as const,
  btcFeeRates: () => ['btcFeeRates'] as const,
};

export type QueryKeyFactory = typeof queryKeys;
