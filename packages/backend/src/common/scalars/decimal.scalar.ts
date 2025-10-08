import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, type ValueNode } from 'graphql';

import {
  Decimal,
  DecimalInput,
  createDecimal,
  toPlainString,
} from '@rebalancing-helper/common';

function coerceDecimal(value: unknown, origin: string): Decimal {
  try {
    return createDecimal(value as DecimalInput);
  } catch (error) {
    if (error instanceof Error) {
      throw new TypeError(
        `${origin}에서 Decimal로 변환할 수 없습니다: ${error.message}`,
      );
    }

    throw new TypeError(`${origin}에서 Decimal로 변환할 수 없습니다.`);
  }
}

@Scalar('Decimal')
export class DecimalScalar
  implements CustomScalar<string | number | Decimal, Decimal>
{
  description =
    'decimal.js 기반 고정 소수점 값을 표현하는 커스텀 Decimal 스칼라입니다.';

  parseValue(value: unknown): Decimal {
    return coerceDecimal(value, 'GraphQL 입력 값');
  }

  serialize(value: unknown): string {
    return toPlainString(coerceDecimal(value, '응답 직렬화'), {
      trimTrailingZeros: true,
    });
  }

  parseLiteral(ast: ValueNode): Decimal {
    if (
      ast.kind === Kind.INT ||
      ast.kind === Kind.FLOAT ||
      ast.kind === Kind.STRING
    ) {
      return coerceDecimal(ast.value, 'GraphQL 리터럴');
    }

    throw new TypeError(
      `Decimal 스칼라는 문자열, 정수 또는 부동소수점 리터럴만 허용합니다. (입력 kind: ${ast.kind})`,
    );
  }
}
