import { Kind } from 'graphql';

import { DecimalScalar } from './decimal.scalar';

describe('DecimalScalar', () => {
  const scalar = new DecimalScalar();

  it('문자열 입력을 Decimal로 파싱한다', () => {
    const decimal = scalar.parseValue('10.5');

    expect(decimal.toString()).toBe('10.5');
  });

  it('숫자 리터럴을 Decimal로 파싱한다', () => {
    const decimal = scalar.parseLiteral({
      kind: Kind.FLOAT,
      value: '3.14',
    });

    expect(decimal.toString()).toBe('3.14');
  });

  it('Decimal 값을 문자열로 직렬화한다', () => {
    const serialized = scalar.serialize('123.4500');

    expect(serialized).toBe('123.45');
  });

  it('허용되지 않은 GraphQL 리터럴에 대해 예외를 던진다', () => {
    expect(() =>
      scalar.parseLiteral({
        kind: Kind.BOOLEAN,
        value: true,
      } as never),
    ).toThrow(
      'Decimal 스칼라는 문자열, 정수 또는 부동소수점 리터럴만 허용합니다.',
    );
  });
});
