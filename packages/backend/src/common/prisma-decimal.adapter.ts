import { Prisma } from '@prisma/client';
import type { Decimal as PrismaDecimal } from '@prisma/client/runtime/library';

import {
  Decimal,
  DecimalInput,
  createDecimal,
} from '@rebalancing-helper/common';

export type PrismaDecimalInput = DecimalInput | PrismaDecimal;

export function isPrismaDecimal(value: unknown): value is PrismaDecimal {
  return value instanceof Prisma.Decimal;
}

export function toCommonDecimal(value: PrismaDecimalInput): Decimal {
  if (isPrismaDecimal(value)) {
    return createDecimal(value.toString());
  }

  return createDecimal(value);
}

export function toPrismaDecimal(value: DecimalInput): PrismaDecimal {
  const decimal = createDecimal(value);

  return new Prisma.Decimal(decimal.toString());
}
