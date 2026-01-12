import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { GqlAuthGuard } from './gql-auth.guard';
import { TypedConfigModule, TypedConfigService } from '../typed-config';

@Global()
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [TypedConfigModule],
      inject: [TypedConfigService],
      useFactory: (configService: TypedConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '40d' },
      }),
    }),
  ],
  providers: [AuthService, AuthResolver, JwtStrategy, GqlAuthGuard],
  exports: [AuthService, GqlAuthGuard],
})
export class AuthModule {}
