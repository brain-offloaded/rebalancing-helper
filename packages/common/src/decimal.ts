import DecimalJs, { type Decimal as DecimalType } from 'decimal.js-light';
import { Decimal as DecimalClass } from 'decimal.js-light';

export type PrimitiveDecimalSource = string | number | bigint;

export type DecimalInput =
  | DecimalType
  | PrimitiveDecimalSource
  | { toString(): string }
  | { valueOf(): PrimitiveDecimalSource | DecimalType };

export type Decimal = DecimalType;
export const Decimal = DecimalClass;

export type DecimalRoundingKeyword =
  | 'UP'
  | 'DOWN'
  | 'CEIL'
  | 'FLOOR'
  | 'HALF_UP'
  | 'HALF_DOWN'
  | 'HALF_EVEN'
  | 'HALF_CEIL'
  | 'HALF_FLOOR';

export type DecimalRoundingMode =
  | DecimalRoundingKeyword
  | Parameters<DecimalType['toFixed']>[1];

export interface RoundOptions {
  decimalPlaces: number;
  roundingMode?: DecimalRoundingMode;
}

export interface PlainStringOptions {
  decimalPlaces?: number;
  roundingMode?: DecimalRoundingMode;
  trimTrailingZeros?: boolean;
}

const ROUNDING_MODE_MAP: Record<
  DecimalRoundingKeyword,
  Parameters<DecimalType['toFixed']>[1]
> = {
  UP: DecimalJs.ROUND_UP,
  DOWN: DecimalJs.ROUND_DOWN,
  CEIL: DecimalJs.ROUND_CEIL,
  FLOOR: DecimalJs.ROUND_FLOOR,
  HALF_UP: DecimalJs.ROUND_HALF_UP,
  HALF_DOWN: DecimalJs.ROUND_HALF_DOWN,
  HALF_EVEN: DecimalJs.ROUND_HALF_EVEN,
  HALF_CEIL: DecimalJs.ROUND_HALF_CEIL,
  HALF_FLOOR: DecimalJs.ROUND_HALF_FLOOR,
};

function resolveRoundingMode(
  roundingMode?: DecimalRoundingMode,
): Parameters<DecimalType['toFixed']>[1] | undefined {
  if (roundingMode === undefined) {
    return undefined;
  }

  if (typeof roundingMode === 'string') {
    const resolved = ROUNDING_MODE_MAP[roundingMode];

    if (resolved === undefined) {
      throw new RangeError(`지원하지 않는 반올림 모드: ${roundingMode}`);
    }

    return resolved;
  }

  return roundingMode;
}

function isPrimitiveDecimalSource(
  value: unknown,
): value is PrimitiveDecimalSource {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  );
}

function normalizePrimitive(value: PrimitiveDecimalSource): string | number {
  return typeof value === 'bigint' ? value.toString() : value;
}

export function isDecimal(value: unknown): value is DecimalType {
  return value instanceof DecimalJs;
}

export function createDecimal(value: DecimalInput): DecimalType {
  if (isDecimal(value)) {
    return value;
  }

  if (isPrimitiveDecimalSource(value)) {
    return new DecimalJs(normalizePrimitive(value));
  }

  if (value && typeof value === 'object') {
    if ('valueOf' in value) {
      const raw = value.valueOf();

      if (isDecimal(raw)) {
        return raw;
      }

      if (isPrimitiveDecimalSource(raw)) {
        return new DecimalJs(normalizePrimitive(raw));
      }
    }

    if ('toString' in value) {
      return new DecimalJs(value.toString());
    }
  }

  throw new TypeError('Decimal로 변환할 수 없는 값입니다.');
}

export function fromPrismaDecimal(value: DecimalInput): DecimalType {
  return createDecimal(value);
}

export function toPrismaDecimal(value: DecimalInput): string {
  return createDecimal(value).toString();
}

export function toPlainString(
  value: DecimalInput,
  options: PlainStringOptions = {},
): string {
  const decimal = createDecimal(value);
  const { decimalPlaces, roundingMode, trimTrailingZeros = false } = options;

  let plain: string;

  if (decimalPlaces !== undefined) {
    plain = decimal.toFixed(decimalPlaces, resolveRoundingMode(roundingMode));
  } else {
    const dp = decimal.decimalPlaces();
    plain = decimal.toFixed(dp ?? 0);
  }

  if (!trimTrailingZeros || !plain.includes('.')) {
    return plain;
  }

  return plain
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '')
    .replace(/\.$/, '');
}

export function roundDecimal(
  value: DecimalInput,
  options: RoundOptions,
): DecimalType {
  const { decimalPlaces, roundingMode } = options;

  if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0) {
    throw new RangeError('decimalPlaces는 0 이상의 정수여야 합니다.');
  }

  const rounded = createDecimal(value).toFixed(
    decimalPlaces,
    resolveRoundingMode(roundingMode),
  );

  return new DecimalJs(rounded);
}

export function add(first: DecimalInput, ...rest: DecimalInput[]): DecimalType {
  return rest.reduce<DecimalType>(
    (acc, current) => acc.plus(createDecimal(current)),
    createDecimal(first),
  );
}

export function sum(values: readonly DecimalInput[]): DecimalType {
  if (values.length === 0) {
    return new DecimalJs(0);
  }

  return values.reduce<DecimalType>(
    (acc, current) => acc.plus(createDecimal(current)),
    new DecimalJs(0),
  );
}

export function subtract(
  first: DecimalInput,
  ...rest: DecimalInput[]
): DecimalType {
  return rest.reduce<DecimalType>(
    (acc, current) => acc.minus(createDecimal(current)),
    createDecimal(first),
  );
}

export function multiply(
  first: DecimalInput,
  ...rest: DecimalInput[]
): DecimalType {
  return rest.reduce<DecimalType>(
    (acc, current) => acc.times(createDecimal(current)),
    createDecimal(first),
  );
}

export function divide(
  dividend: DecimalInput,
  divisor: DecimalInput,
): DecimalType {
  return createDecimal(dividend).dividedBy(createDecimal(divisor));
}

export function compare(a: DecimalInput, b: DecimalInput): number {
  return createDecimal(a).cmp(createDecimal(b));
}

export function max(first: DecimalInput, ...rest: DecimalInput[]): DecimalType {
  return rest.reduce<DecimalType>(
    (acc, current) =>
      acc.greaterThan(createDecimal(current)) ? acc : createDecimal(current),
    createDecimal(first),
  );
}

export function min(first: DecimalInput, ...rest: DecimalInput[]): DecimalType {
  return rest.reduce<DecimalType>(
    (acc, current) =>
      acc.lessThan(createDecimal(current)) ? acc : createDecimal(current),
    createDecimal(first),
  );
}

export function isZero(value: DecimalInput): boolean {
  return createDecimal(value).isZero();
}

export function isPositive(value: DecimalInput, includeZero = false): boolean {
  const decimal = createDecimal(value);

  return includeZero ? !decimal.isNegative() : decimal.greaterThan(0);
}

export function isNegative(value: DecimalInput, includeZero = false): boolean {
  const decimal = createDecimal(value);

  return includeZero ? !decimal.isPositive() : decimal.lessThan(0);
}
