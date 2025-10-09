import { PrismaDecimalService } from './prisma-decimal.service';
import { Decimal as PrismaDecimal } from '@prisma/client/runtime/library';
import { Decimal } from '@rebalancing-helper/common';

describe('PrismaDecimalService', () => {
  let service: PrismaDecimalService;

  beforeEach(() => {
    service = new PrismaDecimalService();
  });

  it('decimalInputToPrismaDecimal converts common inputs to Prisma.Decimal', () => {
    const fromString = service.decimalInputToPrismaDecimal('1234.56789');
    const fromNumber = service.decimalInputToPrismaDecimal(42);
    const fromCommon = service.decimalInputToPrismaDecimal(new Decimal('0.1'));

    expect(fromString).toBeInstanceOf(PrismaDecimal);
    expect(fromString.toString()).toBe('1234.56789');
    expect(fromNumber).toBeInstanceOf(PrismaDecimal);
    expect(fromNumber.toString()).toBe('42');
    expect(fromCommon).toBeInstanceOf(PrismaDecimal);
    expect(fromCommon.toString()).toBe('0.1');
  });

  it('prismaDecimalToCommonDecimal converts Prisma.Decimal to common Decimal', () => {
    const prismaDec = new PrismaDecimal('0.3000');
    const common = service.prismaDecimalToCommonDecimal(prismaDec);

    expect(common).toBeInstanceOf(Decimal);
    // Common Decimal may normalize trailing zeros; ensure numeric equality
    expect(common.toString()).toBe('0.3');
  });
});
