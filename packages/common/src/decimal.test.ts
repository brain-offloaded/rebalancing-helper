import { describe, expect, it } from 'vitest';
import DecimalJs from 'decimal.js-light';
import {
  add,
  compare,
  createDecimal,
  divide,
  fromPrismaDecimal,
  isDecimal,
  isNegative,
  isPositive,
  isZero,
  max,
  min,
  multiply,
  roundDecimal,
  subtract,
  sum,
  toPlainString,
  toPrismaDecimal,
  type DecimalInput,
} from './decimal';

function expectDecimalEqual(value: DecimalInput, expected: string) {
  expect(createDecimal(value).toString()).toBe(expected);
}

describe('Decimal 유틸리티', () => {
  it('기본 생성 동작을 보장한다', () => {
    expectDecimalEqual(createDecimal('0.3'), '0.3');
    expectDecimalEqual(createDecimal(0.3), '0.3');
    expectDecimalEqual(createDecimal(new DecimalJs(0.3)), '0.3');
    expectDecimalEqual(createDecimal({ toString: () => '123.456' }), '123.456');
    expectDecimalEqual(createDecimal({ valueOf: () => '789.012' }), '789.012');
  });

  it('선행 플러스 부호를 허용한다', () => {
    expectDecimalEqual(createDecimal('+1'), '1');
    expectDecimalEqual(createDecimal(' +42.5 '), '42.5');
    expectDecimalEqual(createDecimal('+1e3'), '1000');
  });

  it('Prisma Decimal 대응 래퍼를 제공한다', () => {
    const prismaDecimalLike = {
      toString: () => '456.789',
      valueOf: () => new DecimalJs('456.789'),
    };

    expectDecimalEqual(fromPrismaDecimal(prismaDecimalLike), '456.789');
    expect(toPrismaDecimal(prismaDecimalLike)).toBe('456.789');
  });

  it('숫자 연산을 정확하게 수행한다', () => {
    expectDecimalEqual(add('0.1', '0.2'), '0.3');
    expectDecimalEqual(subtract('1', '0.42'), '0.58');
    expectDecimalEqual(multiply('1.2', '3.4'), '4.08');
    expectDecimalEqual(
      divide('1', '3'),
      new DecimalJs('1').dividedBy(3).toString(),
    );
    expectDecimalEqual(sum(['1.1', '2.2', '3.3']), '6.6');
  });

  it('비교 및 집계 연산을 지원한다', () => {
    expect(compare('1.23', '1.22')).toBe(1);
    expect(compare('1.22', '1.22')).toBe(0);
    expect(compare('1.22', '1.23')).toBe(-1);
    expectDecimalEqual(max('1.1', '2.2', '3.3'), '3.3');
    expectDecimalEqual(min('1.1', '2.2', '3.3'), '1.1');
  });

  it('부호 판별 유틸리티를 제공한다', () => {
    expect(isZero('0')).toBe(true);
    expect(isPositive('0.0001')).toBe(true);
    expect(isPositive('0', true)).toBe(true);
    expect(isNegative('-0.0001')).toBe(true);
    expect(isNegative('0', true)).toBe(true);
  });

  it('반올림 및 문자열 포맷 옵션을 제공한다', () => {
    expectDecimalEqual(roundDecimal('1.23456', { decimalPlaces: 2 }), '1.23');
    expectDecimalEqual(
      roundDecimal('1.23556', { decimalPlaces: 2, roundingMode: 'HALF_UP' }),
      '1.24',
    );
    expect(toPlainString('1.2300', { trimTrailingZeros: true })).toBe('1.23');
    expect(
      toPlainString('12345.6789', {
        decimalPlaces: 2,
        roundingMode: 'DOWN',
        trimTrailingZeros: true,
      }),
    ).toBe('12345.67');
    expect(
      toPlainString('1000000000000000000000.0001', { trimTrailingZeros: true }),
    ).toBe('1000000000000000000000.0001');
  });

  it('isDecimal 판별을 정확히 수행한다', () => {
    expect(isDecimal(new DecimalJs(1))).toBe(true);
    expect(isDecimal('1')).toBe(false);
  });
});
