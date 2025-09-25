import { Module } from '@nestjs/common';
import { MarketsResolver } from './markets.resolver';
import { MarketsService } from './markets.service';

@Module({
  providers: [MarketsResolver, MarketsService],
  exports: [MarketsService],
})
export class MarketsModule {}
