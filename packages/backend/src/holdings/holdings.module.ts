import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HoldingsService } from './holdings.service';
import { HoldingsResolver } from './holdings.resolver';
import { MarketDataService } from './market-data.service';

@Module({
  imports: [HttpModule],
  providers: [HoldingsService, HoldingsResolver, MarketDataService],
  exports: [HoldingsService],
})
export class HoldingsModule {}
