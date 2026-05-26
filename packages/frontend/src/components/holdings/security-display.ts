import { formatMarketWithSymbol } from './formatters';
import type { Holding } from './types';

export interface SecurityDisplayInfo {
  symbol: string;
  displayName: string;
  baseName: string;
  subtitle: string;
}

type HoldingDisplaySource = Pick<
  Holding,
  'alias' | 'lastTradedAt' | 'market' | 'name' | 'symbol'
>;

type AliasDisplaySource = {
  alias: string;
  market?: string | null;
  symbol: string;
};

const normalizeSymbolKey = (symbol: string) => symbol.trim().toUpperCase();

const getHoldingDisplayScore = (holding: HoldingDisplaySource) => {
  const alias = holding.alias?.trim() ?? '';
  const name = holding.name.trim();
  const symbol = normalizeSymbolKey(holding.symbol);

  return (
    (alias.length > 0 ? 4 : 0) +
    (name.length > 0 && normalizeSymbolKey(name) !== symbol ? 2 : 0) +
    (holding.market ? 1 : 0)
  );
};

export const buildSecurityDisplayMap = (
  holdings: HoldingDisplaySource[],
  aliases: AliasDisplaySource[] = [],
): Map<string, SecurityDisplayInfo> => {
  const ranked = new Map<
    string,
    { info: SecurityDisplayInfo; score: number; lastTradedAt: number }
  >();

  for (const holding of holdings) {
    const symbol = normalizeSymbolKey(holding.symbol);
    if (symbol.length === 0) {
      continue;
    }

    const alias = holding.alias?.trim() ?? '';
    const baseName = holding.name.trim() || symbol;
    const displayName = alias.length > 0 ? alias : baseName;
    const score = getHoldingDisplayScore(holding);
    const lastTradedAt = new Date(holding.lastTradedAt).getTime();
    const current = ranked.get(symbol);

    if (
      current &&
      (current.score > score ||
        (current.score === score && current.lastTradedAt >= lastTradedAt))
    ) {
      continue;
    }

    ranked.set(symbol, {
      score,
      lastTradedAt,
      info: {
        symbol,
        displayName,
        baseName,
        subtitle: formatMarketWithSymbol(holding.market, symbol),
      },
    });
  }

  for (const alias of aliases) {
    const symbol = normalizeSymbolKey(alias.symbol);
    const displayName = alias.alias.trim();
    if (symbol.length === 0 || displayName.length === 0) {
      continue;
    }

    const score = 5 + (alias.market ? 1 : 0);
    const current = ranked.get(symbol);
    if (current && current.score > score) {
      continue;
    }

    ranked.set(symbol, {
      score,
      lastTradedAt: Number.MAX_SAFE_INTEGER,
      info: {
        symbol,
        displayName,
        baseName: displayName,
        subtitle: formatMarketWithSymbol(alias.market ?? null, symbol),
      },
    });
  }

  return new Map(
    Array.from(ranked.entries()).map(([symbol, value]) => [symbol, value.info]),
  );
};

export const getSecurityDisplayInfo = (
  displayMap: Map<string, SecurityDisplayInfo>,
  symbol: string,
): SecurityDisplayInfo => {
  const normalizedSymbol = normalizeSymbolKey(symbol);
  return (
    displayMap.get(normalizedSymbol) ?? {
      symbol: normalizedSymbol || symbol,
      displayName: normalizedSymbol || symbol,
      baseName: normalizedSymbol || symbol,
      subtitle: '보유 종목 정보 없음',
    }
  );
};

export const isSameSecurityLabel = (left: string, right: string) =>
  normalizeSymbolKey(left) === normalizeSymbolKey(right);
