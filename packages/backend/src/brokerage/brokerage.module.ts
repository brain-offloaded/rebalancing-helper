import { Module } from '@nestjs/common';
import { BrokerageService } from './brokerage.service';
import { BrokerageResolver } from './brokerage.resolver';

@Module({
  providers: [BrokerageService, BrokerageResolver],
  exports: [BrokerageService],
})
export class BrokerageModule {}