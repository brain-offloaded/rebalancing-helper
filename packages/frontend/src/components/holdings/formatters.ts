export const formatCurrencyValue = (value: number, currency: string) => {
  if (!Number.isFinite(value)) {
    return '-';
  }
  if (currency === 'KRW') {
    return `₩${Math.round(value).toLocaleString()}`;
  }
  if (currency === 'USD') {
    return `$${value.toFixed(2)}`;
  }
  return `${currency} ${value.toFixed(2)}`;
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
