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
  price: Exclude<QuoteFields['regularMarketPrice'], undefined> | 0;
  currency: NonNullable<
    QuoteFields['currency'] | QuoteFields['financialCurrency']
  >;
  market: string;
  exchange: NonNullable<
    QuoteFields['fullExchangeName'] | QuoteFields['exchange']
  >;
  lastUpdated: Date;
}

export type MarketQuoteSource = QuoteFields;
