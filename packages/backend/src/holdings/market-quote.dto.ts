import type { YahooFinanceQuote } from './yahoo-finance.types';

type QuoteFields = Pick<
  YahooFinanceQuote,
  | 'symbol'
  | 'longName'
  | 'shortName'
  | 'regularMarketPrice'
  | 'currency'
  | 'financialCurrency'
  | 'market'
  | 'fullExchangeName'
  | 'exchange'
  | 'regularMarketTime'
>;

export interface MarketQuote {
  symbol: string;
  displaySymbol: QuoteFields['symbol'];
  name: string;
  price: NonNullable<QuoteFields['regularMarketPrice']>;
  currency: NonNullable<QuoteFields['currency']>;
  market: string;
  exchange: NonNullable<QuoteFields['fullExchangeName']>;
  lastUpdated: Date;
}

export type MarketQuoteSource = QuoteFields;
