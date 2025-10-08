import {
  type Decimal,
  type DecimalInput,
  createDecimal,
  toPlainString,
} from '@rebalancing-helper/common';

export interface FormatDecimalOptions {
  decimalPlaces?: number;
  trimTrailingZeros?: boolean;
  useGrouping?: boolean;
}

export const formatDecimal = (
  value: DecimalInput,
  options: FormatDecimalOptions = {},
): string => {
  const decimal = createDecimal(value);
  const {
    decimalPlaces,
    trimTrailingZeros = false,
    useGrouping = false,
  } = options;

  const plain = toPlainString(decimal, {
    decimalPlaces,
    trimTrailingZeros,
  });

  if (!useGrouping) {
    return plain;
  }

  const sign = plain.startsWith('-') ? '-' : '';
  const digits = sign ? plain.slice(1) : plain;
  const [integerPart, fractionPart] = digits.split('.');
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (fractionPart && fractionPart.length > 0) {
    return `${sign}${groupedInteger}.${fractionPart}`;
  }

  return `${sign}${groupedInteger}`;
};

export const tryCreateDecimal = (value: string): Decimal | null => {
  try {
    return createDecimal(value);
  } catch {
    return null;
  }
};
