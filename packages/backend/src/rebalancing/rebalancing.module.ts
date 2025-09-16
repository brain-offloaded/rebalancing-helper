import { Module } from '@nestjs/common';
import { RebalancingService } from './rebalancing.service';
import { RebalancingResolver } from './rebalancing.resolver';
import { BrokerageModule } from '../brokerage/brokerage.module';
import { HoldingsModule } from '../holdings/holdings.module';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [BrokerageModule, HoldingsModule, TagsModule],
  providers: [RebalancingService, RebalancingResolver],
  exports: [RebalancingService],
})
export class RebalancingModule {}
