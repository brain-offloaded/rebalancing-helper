import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypedConfigModule, TypedConfigService } from '../../typed-config';
import { ExternalHttpService } from './external-http.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [TypedConfigModule],
      inject: [TypedConfigService],
      useFactory: (configService: TypedConfigService) => ({
        timeout: configService.get('HTTP_TIMEOUT_MS'),
        maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
      }),
    }),
  ],
  providers: [ExternalHttpService],
  exports: [ExternalHttpService],
})
export class ExternalHttpModule {}
