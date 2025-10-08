import type { DecimalInput } from '@rebalancing-helper/common';
import { createDecimal } from '@rebalancing-helper/common';

import { formatDecimal } from '../../utils/decimal-format';

export const formatCurrencyValue = (value: DecimalInput, currency: string) => {
  try {
    const decimal = createDecimal(value);

    if (currency === 'KRW') {
      return `₩${formatDecimal(decimal, {
        decimalPlaces: 0,
        useGrouping: true,
      })}`;
    }

    const formatted = formatDecimal(decimal, {
      decimalPlaces: 2,
      useGrouping: true,
    });

    if (currency === 'USD') {
      return `$${formatted}`;
    }

    return `${currency} ${formatted}`;
  } catch {
    return '-';
  }
};

export const formatQuantityValue = (value: DecimalInput) => {
  try {
    return formatDecimal(value, { trimTrailingZeros: true, useGrouping: true });
  } catch {
    return '-';
  }
};

export const formatLastUpdated = (value: string) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const formatMarketWithSymbol = (
  market: string | null | undefined,
  symbol: string,
) => {
  if (market && market.trim().length > 0) {
    return `${market} · ${symbol}`;
  }
  return symbol;
};
