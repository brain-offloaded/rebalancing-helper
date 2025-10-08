import { Prisma } from '@prisma/client';

import {
  isPrismaDecimal,
  toCommonDecimal,
  toPrismaDecimal,
} from './prisma-decimal.adapter';

const SAMPLE_VALUE = '1234.56789';

describe('prisma-decimal.adapter', () => {
  it('Prisma.Decimal 인스턴스를 식별한다', () => {
    const prismaDecimal = new Prisma.Decimal(SAMPLE_VALUE);

    expect(isPrismaDecimal(prismaDecimal)).toBe(true);
    expect(isPrismaDecimal(SAMPLE_VALUE)).toBe(false);
  });

  it('Prisma.Decimal을 공통 Decimal로 변환한다', () => {
    const prismaDecimal = new Prisma.Decimal(SAMPLE_VALUE);

    const converted = toCommonDecimal(prismaDecimal);

    expect(converted.toString()).toBe(SAMPLE_VALUE);
  });

  it('문자열과 숫자를 공통 Decimal로 변환한다', () => {
    expect(toCommonDecimal(SAMPLE_VALUE).toString()).toBe(SAMPLE_VALUE);
    expect(toCommonDecimal(42).toString()).toBe('42');
  });

  it('공통 Decimal 입력을 Prisma.Decimal로 변환한다', () => {
    const prismaDecimal = toPrismaDecimal(SAMPLE_VALUE);

    expect(prismaDecimal).toBeInstanceOf(Prisma.Decimal);
    expect(prismaDecimal.toString()).toBe(SAMPLE_VALUE);
  });
});
