import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaDecimalService } from './prisma-decimal.service';

@Global()
@Module({
  providers: [PrismaService, PrismaDecimalService],
  exports: [PrismaService, PrismaDecimalService],
})
export class PrismaModule {}
