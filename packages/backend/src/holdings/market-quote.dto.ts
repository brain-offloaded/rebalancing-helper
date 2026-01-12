export interface MarketQuoteSource {
  symbol?: string;
  longName?: string;
  shortName?: string;
  regularMarketPrice?: number;
  currency?: string;
  financialCurrency?: string;
  market?: string;
  fullExchangeName?: string;
  exchange?: string;
  regularMarketTime?: Date | number;
}

export interface MarketQuote {
  symbol: string;
  displaySymbol: string;
  name: string;
  price: number;
  currency: string;
  market: string;
  exchange: string;
  lastUpdated: Date;
}
