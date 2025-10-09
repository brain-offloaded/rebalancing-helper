import { Injectable } from '@nestjs/common';
import type { DecimalInput } from '@rebalancing-helper/common';
import { Decimal, createDecimal } from '@rebalancing-helper/common';
import { Decimal as PrismaDecimal } from '@prisma/client/runtime/library';

@Injectable()
export class PrismaDecimalService {
  private normalizeToString(value: DecimalInput): string {
    return createDecimal(value).toString();
  }

  decimalInputToPrismaDecimal(value: DecimalInput): PrismaDecimal {
    return new PrismaDecimal(this.normalizeToString(value));
  }

  prismaDecimalToCommonDecimal(value: PrismaDecimal): Decimal {
    return new Decimal(value.toString());
  }
}
