import { Module } from '@nestjs/common';
import { BrokerageService } from './brokerage.service';
import { BrokerageResolver } from './brokerage.resolver';
import { CredentialCryptoService } from './credential-crypto.service';
import { MarketDataService } from './market-data.service';

@Module({
  providers: [
    BrokerageService,
    BrokerageResolver,
    CredentialCryptoService,
    MarketDataService,
  ],
  exports: [BrokerageService],
})
export class BrokerageModule {}
