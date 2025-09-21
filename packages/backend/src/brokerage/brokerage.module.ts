import { Module } from '@nestjs/common';
import { BrokerageService } from './brokerage.service';
import { BrokerageResolver } from './brokerage.resolver';
import { CredentialCryptoService } from './credential-crypto.service';

@Module({
  providers: [BrokerageService, BrokerageResolver, CredentialCryptoService],
  exports: [BrokerageService],
})
export class BrokerageModule {}
