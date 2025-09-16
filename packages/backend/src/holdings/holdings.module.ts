import { Module } from '@nestjs/common';
import { HoldingsService } from './holdings.service';
import { HoldingsResolver } from './holdings.resolver';

@Module({
  providers: [HoldingsService, HoldingsResolver],
  exports: [HoldingsService],
})
export class HoldingsModule {}